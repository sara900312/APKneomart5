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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "server_not_configured" }, 500);

    const body = await req.json().catch(() => null);
    if (!body || !body.order_code || !body.customer_name || !body.customer_phone) {
      return json({ error: "missing_required_fields" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const inputItems = Array.isArray(body.items) ? body.items : [];
    if (
      !inputItems.length ||
      inputItems.some(
        (item: { product_id?: unknown; quantity?: unknown }) =>
          !Number.isInteger(Number(item.product_id)) ||
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) <= 0,
      )
    ) {
      return json({ error: "invalid_items" }, 400);
    }
    const productIds = [
      ...new Set(
        inputItems
          .map((item: { product_id?: unknown }) => Number(item.product_id))
          .filter(Number.isFinite),
      ),
    ];
    const { data: productRows, error: productsError } = await supabase
      .from("products")
      .select(
        "id,name,name_en,short_description,short_description_en,description,description_en,main_image_url,price,discounted_price,is_discounted,published",
      )
      .in("id", productIds)
      .eq("published", true);
    if (productsError) return json({ error: productsError.message }, 500);
    const productMap = new Map((productRows ?? []).map((product) => [Number(product.id), product]));
    if (productMap.size !== productIds.length) return json({ error: "invalid_product" }, 400);
    const orderItems = inputItems.map((item: { product_id: number; quantity: number }) => {
      const product = productMap.get(Number(item.product_id));
      const price =
        product?.is_discounted && Number(product.discounted_price) > 0
          ? Number(product.discounted_price)
          : Number(product?.price ?? 0);
      return {
        ...item,
        price,
        name: product?.name,
        name_en: product?.name_en,
        image: product?.main_image_url,
        short_description: product?.short_description,
        short_description_en: product?.short_description_en,
        description: product?.description,
        description_en: product?.description_en,
      };
    });
    let couponDiscount = 0;
    let coupon: {
      id: number;
      discount_type: "percentage" | "fixed";
      discount_value: number;
      usage_limit: number | null;
      valid_from: string | null;
      valid_until: string | null;
      is_active: boolean;
      maximum_quantity: number | null;
    } | null = null;
    let couponProductIds: number[] = [];
    if (typeof body.coupon_code === "string" && body.coupon_code.trim()) {
      const { data: couponData, error: couponError } = await supabase
        .from("coupons")
        .select(
          "id,code,discount_type,discount_value,usage_limit,valid_from,valid_until,is_active,maximum_quantity",
        )
        .ilike("code", body.coupon_code.trim().toUpperCase())
        .maybeSingle();
      if (couponError || !couponData) return json({ error: "coupon_invalid" }, 400);
      coupon = couponData;
      const now = Date.now();
      if (
        !coupon.is_active ||
        (coupon.valid_from && Date.parse(coupon.valid_from) > now) ||
        (coupon.valid_until && Date.parse(coupon.valid_until) < now)
      )
        return json({ error: "coupon_invalid" }, 400);
      const [{ data: links, error: linksError }, { count: usageCount, error: usageError }] =
        await Promise.all([
          supabase.from("coupons_products").select("product_id").eq("coupon_id", coupon.id),
          supabase
            .from("coupon_usage")
            .select("id", { count: "exact", head: true })
            .eq("coupon_id", coupon.id),
        ]);
      if (linksError || usageError) return json({ error: "coupon_validation_failed" }, 500);
      if (coupon.usage_limit != null && (usageCount ?? 0) >= coupon.usage_limit)
        return json({ error: "coupon_usage_limit" }, 400);
      couponProductIds = (links ?? []).map((link) => Number(link.product_id));
      const eligibleIds = new Set(couponProductIds);
      const applicableItems = couponProductIds.length
        ? orderItems.filter((item) => eligibleIds.has(Number(item.product_id)))
        : orderItems;
      if (couponProductIds.length && !applicableItems.length)
        return json({ error: "coupon_no_eligible_products" }, 400);
      let remaining =
        coupon.maximum_quantity == null ? Infinity : Math.max(0, Number(coupon.maximum_quantity));
      const eligibleSubtotal = applicableItems.reduce((sum, item) => {
        const quantity = Math.min(Math.max(0, Number(item.quantity)), remaining);
        remaining -= quantity;
        return sum + item.price * quantity;
      }, 0);
      couponDiscount =
        coupon.discount_type === "percentage"
          ? Math.min(eligibleSubtotal, (eligibleSubtotal * Number(coupon.discount_value)) / 100)
          : Math.min(eligibleSubtotal, Math.max(0, Number(coupon.discount_value)));
    }
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * Number(item.quantity), 0);
    const shipping = subtotal >= 75000 ? 0 : subtotal > 0 ? 5000 : 0;
    const total = Math.max(0, subtotal - couponDiscount + shipping);
    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_code: body.order_code,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        governorate: body.governorate ?? null,
        area: body.area ?? null,
        landmark: body.landmark ?? null,
        notes: body.notes ?? null,
        items: orderItems,
        subtotal,
        shipping,
        total,
        payment_method: body.payment_method ?? "cod",
        order_status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("insert error", error);
      return json({ error: error.message }, 500);
    }

    if (coupon) {
      const eligibleIds = new Set(couponProductIds);
      let remainingUsage =
        coupon.maximum_quantity == null ? Infinity : Math.max(0, Number(coupon.maximum_quantity));
      const usageItems = orderItems.flatMap((item) => {
        if (couponProductIds.length && !eligibleIds.has(Number(item.product_id))) return [];
        const quantity = Math.min(Number(item.quantity), remainingUsage);
        remainingUsage -= quantity;
        return quantity > 0 ? [{ ...item, quantity }] : [];
      });
      const { error: usageInsertError } = await supabase
        .from("coupon_usage")
        .insert(
          usageItems.map((item) => ({
            coupon_id: coupon!.id,
            product_id: item.product_id,
            user_id: body.user_id ?? null,
            order_id: data.id,
            quantity_used: item.quantity,
          })),
        );
      if (usageInsertError) return json({ error: usageInsertError.message }, 500);
    }

    // Telegram notification (best-effort)
    const TG_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const TG_CHAT = Deno.env.get("TELEGRAM_CHAT_ID");
    if (TG_TOKEN && TG_CHAT) {
      try {
        const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
        const lines = orderItems
          .map(
            (it: { name: string; quantity: number; price: number }) =>
              `• ${it.name} ×${it.quantity} — ${fmt(it.price * it.quantity)} IQD`,
          )
          .join("\n");
        const address = [body.governorate, body.area, body.landmark].filter(Boolean).join(" - ");
        const msg =
          `🛒 طلب جديد\n\n` +
          `رمز الطلب: ${body.order_code}\n` +
          `الاسم: ${body.customer_name}\n` +
          `الهاتف: ${body.customer_phone}\n` +
          `العنوان: ${address}\n` +
          (body.notes ? `ملاحظات: ${body.notes}\n` : "") +
          `\nالمنتجات:\n${lines}\n\n` +
          `المجموع الفرعي: ${fmt(subtotal)} IQD\n` +
          `التوصيل: ${fmt(shipping)} IQD\n` +
          `الإجمالي: ${fmt(total)} IQD\n` +
          `الدفع: ${body.payment_method === "cod" ? "عند الاستلام" : body.payment_method}`;

        const tgRes = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: TG_CHAT, text: msg }),
        });
        if (!tgRes.ok) console.error("telegram failed", tgRes.status, await tgRes.text());
      } catch (e) {
        console.error("telegram error", e);
      }
    } else {
      console.warn("telegram secrets missing; skipping notification");
    }

    return json({ ok: true, order: data });
  } catch (err) {
    console.error("fatal", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
