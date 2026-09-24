// Warehouse-only: update an order's status. Verifies admin credentials, then updates via service role.
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

const ALLOWED = ["pending", "confirmed", "preparing", "ready", "shipping", "delivered", "cancelled"];

function notificationType(status: string): string {
  const types: Record<string, string> = {
    pending: "ORDER_CREATED",
    confirmed: "ORDER_CONFIRMED",
    preparing: "ORDER_PREPARING",
    ready: "ORDER_READY",
    shipping: "ORDER_OUT_FOR_DELIVERY",
    shipped: "ORDER_OUT_FOR_DELIVERY",
    delivered: "ORDER_DELIVERED",
    cancelled: "ORDER_CANCELLED",
  };
  return types[status] ?? "ORDER_STATUS_UPDATE";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "invalid_body" }, 400);
    const { email, password, order_code, status } = body as Record<string, string>;
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");

    if (!adminEmail || !adminPassword || email !== adminEmail || password !== adminPassword) {
      return json({ error: "unauthorized" }, 401);
    }
    if (!order_code || !ALLOWED.includes(status)) {
      return json({ error: "invalid_input" }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data, error } = await supabase
      .from("orders")
      .update({ order_status: status })
      .eq("order_code", order_code)
      .neq("order_status", status)
      .select()
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!data) {
      const { data: unchanged, error: unchangedError } = await supabase
        .from("orders")
        .select()
        .eq("order_code", order_code)
        .maybeSingle();
      if (unchangedError) return json({ error: unchangedError.message }, 500);
      if (!unchanged) return json({ error: "order_not_found" }, 404);
      console.log("NOTIFICATION_DEDUPLICATED", {
        notification_id: `${String((unchanged as { id?: string }).id ?? order_code)}:${notificationType(status)}:${status}`,
        order_id: (unchanged as { id?: string }).id,
        order_status: status,
        notification_type: notificationType(status),
        timestamp: new Date().toISOString(),
        source: "update-order-status.unchanged",
      });
      return json({ ok: true, skipped: "unchanged", order: unchanged });
    }

    const notificationId = `${String((data as { id?: string }).id ?? order_code)}:${notificationType(status)}:${status}`;
    console.log("NOTIFICATION_EVENT_CREATED", {
      notification_id: notificationId,
      order_id: (data as { id?: string }).id,
      order_status: status,
      notification_type: notificationType(status),
      timestamp: new Date().toISOString(),
      source: "update-order-status",
    });

    // Telegram note to admin
    const TG_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const TG_CHAT = Deno.env.get("TELEGRAM_CHAT_ID");
    if (TG_TOKEN && TG_CHAT) {
      try {
        await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TG_CHAT,
            text: `🔄 تحديث حالة الطلب\nرمز: ${order_code}\nالحالة الجديدة: ${status}`,
          }),
        });
      } catch (e) {
        console.error("telegram error", e);
      }
    }

    // Push notification to customer devices via FCM edge function
    try {
      const phone = (data as { customer_phone?: string }).customer_phone;
      if (phone) {
        console.log("NOTIFICATION_SEND_REQUEST", {
          notification_id: notificationId,
          order_id: (data as { id?: string }).id,
          order_status: status,
          timestamp: new Date().toISOString(),
          source: "update-order-status",
        });
        await fetch(`${SUPABASE_URL}/functions/v1/send-fcm-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({
            phone,
            order_code,
            status,
            order_id: String((data as { id?: string }).id ?? ""),
            notification_id: notificationId,
          }),
        });
      }
    } catch (e) {
      console.error("fcm invoke error", e);
    }

    let reviewResult: unknown = null;
    if (status === "delivered") {
      try {
        const phone = (data as { customer_phone?: string }).customer_phone;
        const orderId = String((data as { id?: string }).id ?? "");
        if (phone && orderId) {
          const reviewResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/send-app-review-notification`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SERVICE_KEY}`,
              },
              body: JSON.stringify({
                phone,
                order_code,
                order_id: orderId,
                notification_type: "APP_REVIEW_REQUEST",
                action: "OPEN_APP_REVIEW",
              }),
            },
          );
          reviewResult = await reviewResponse.json().catch(() => null);
          if (!reviewResponse.ok) {
            console.error("review notification error", {
              status: reviewResponse.status,
              order_code,
              order_id: orderId,
              result: reviewResult,
            });
          }
        }
      } catch (e) {
        console.error("review notification invoke error", e);
      }
    }

    return json({ ok: true, order: data, review: reviewResult });
  } catch (err) {
    console.error("fatal", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
