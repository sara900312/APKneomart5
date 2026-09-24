import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const REVIEW_TYPE = "APP_REVIEW_REQUEST";
const REVIEW_ACTION = "OPEN_APP_REVIEW";
const REVIEW_STATUS = "APP_REVIEW_REQUEST";
const REVIEW_CUSTOMER_CLAIM_STATUS = "APP_REVIEW_CUSTOMER_CLAIM";

type ReviewRequest = {
  phone?: string;
  order_code?: string;
  order_id?: string;
  notification_type?: string;
  action?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const body = (await req.json().catch(() => null)) as ReviewRequest | null;
    if (!body) return json({ error: "invalid_body" }, 400);

    const phone = body.phone?.trim();
    const orderCode = body.order_code?.trim();
    const orderId = body.order_id?.trim();
    if (
      !phone ||
      !orderCode ||
      !orderId ||
      body.notification_type !== REVIEW_TYPE ||
      body.action !== REVIEW_ACTION
    ) {
      return json({ error: "invalid_review_request" }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "missing_server_config" }, 500);

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: customerOrders, error: ordersError } = await supabase
      .from("orders")
      .select("id, order_code, order_status, delivered_at")
      .eq("customer_phone", phone)
      .order("delivered_at", { ascending: true, nullsFirst: true })
      .order("id", { ascending: true });

    if (ordersError) return json({ error: ordersError.message }, 500);

    const allOrders = customerOrders ?? [];
    const deliveredOrders = allOrders.filter((order) => order.order_status === "delivered");
    if (deliveredOrders.some((order) => !order.delivered_at)) {
      return json({ error: "delivery_history_incomplete" }, 409);
    }

    const currentOrder = deliveredOrders.find(
      (order) => String(order.id) === orderId || order.order_code === orderCode,
    );
    if (!currentOrder?.delivered_at) {
      return json({ error: "delivered_order_timestamp_missing" }, 409);
    }

    const currentIndex = deliveredOrders.findIndex(
      (order) => String(order.id) === String(currentOrder.id),
    );
    const deliverySequence = currentIndex + 1;
    if (deliverySequence !== 1) {
      return json({
        ok: true,
        sent: false,
        skipped: "not_first_customer_delivery",
        delivery_sequence: deliverySequence,
        delivered_at: currentOrder.delivered_at,
      });
    }

    const { data: previousCustomerReview, error: previousReviewError } = await supabase
      .from("notification_logs")
      .select("id")
      .eq("phone", phone)
      .in("status", [REVIEW_STATUS, REVIEW_CUSTOMER_CLAIM_STATUS])
      .limit(1)
      .maybeSingle();
    if (previousReviewError) return json({ error: previousReviewError.message }, 500);
    if (previousCustomerReview) {
      return json({
        ok: true,
        sent: false,
        skipped: "customer_already_reviewed",
        delivery_sequence: deliverySequence,
        delivered_at: currentOrder.delivered_at,
      });
    }

    const customerClaimCode = `review-customer:${phone}`;
    const { error: claimError } = await supabase
      .from("notification_logs")
      .insert({
        order_code: customerClaimCode,
        status: REVIEW_CUSTOMER_CLAIM_STATUS,
        phone,
        detail: {
          stage: "customer_review_claim",
          order_code: orderCode,
          order_id: orderId,
          delivered_at: currentOrder.delivered_at,
        },
      });
    if (claimError) {
      if (claimError.code === "23505" || /duplicate key|already exists/i.test(claimError.message)) {
        return json({
          ok: true,
          sent: false,
          skipped: "customer_already_reviewed",
          delivery_sequence: deliverySequence,
          delivered_at: currentOrder.delivered_at,
        });
      }
      return json({ error: claimError.message }, 500);
    }

    const notificationId = `review:${orderId || orderCode}`;
    console.log("APP_REVIEW_REQUEST_ELIGIBLE", {
      notification_id: notificationId,
      order_id: orderId,
      order_code: orderCode,
      customer_phone: phone,
      delivery_sequence: deliverySequence,
      delivered_at: currentOrder.delivered_at,
      customer_review_claimed: true,
    });

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-fcm-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        phone,
        order_code: orderCode,
        order_id: orderId,
        status: REVIEW_STATUS,
        notification_id: notificationId,
        notification_type: REVIEW_TYPE,
        action: REVIEW_ACTION,
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("APP_REVIEW_NOTIFICATION_FAILED", { status: response.status, result });
      return json({ error: "review_notification_failed", detail: result }, 502);
    }

    return json({
      ok: true,
      sent: result?.sent ?? 0,
      skipped: result?.skipped,
      delivery_sequence: deliverySequence,
      delivered_at: currentOrder.delivered_at,
      customer_review_claimed: true,
      notification_id: notificationId,
    });
  } catch (error) {
    console.error("send-app-review-notification error", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
