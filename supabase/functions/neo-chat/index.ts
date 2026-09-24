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

interface Msg {
  role: "user" | "assistant" | "system";
  content: string;
}

function createAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) throw new Error("server_not_configured");
  return createClient(url, serviceRoleKey);
}

function createLegacyProductsClient() {
  const url = Deno.env.get("LEGACY_SUPABASE_URL");
  const anonKey = Deno.env.get("LEGACY_SUPABASE_ANON_KEY");
  if (!url || !anonKey) throw new Error("legacy_products_not_configured");
  return createClient(url, anonKey);
}

async function getProvider(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<"lovable" | "openrouter"> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "ai_provider")
    .maybeSingle();
  return data?.value === "openrouter" ? "openrouter" : "lovable";
}

async function searchProducts(
  supabase: ReturnType<typeof createLegacyProductsClient>,
  query: string,
) {
  const term = query
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ")
    .replace(/[(),.%]/g, " ")
    .trim();
  if (!term) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      "id,name,short_description,price,discounted_price,is_discounted,discount_percent,main_image_url,category",
    )
    .or(`name.ilike.%${term}%,short_description.ilike.%${term}%,category.ilike.%${term}%`)
    .limit(4);
  if (error) throw error;
  return data ?? [];
}

async function callOpenRouter(
  messages: Msg[],
  productsClient: ReturnType<typeof createLegacyProductsClient>,
) {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) throw new Error("OPENROUTER_API_KEY missing");

  const lastUser =
    [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const products = await searchProducts(productsClient, lastUser);
  const system = `أنتِ NEOMART، مستشارة جمال ذكية تتحدث باللغة العربية بأسلوب ودود وموجز.
مهمتك اقتراح منتجات مناسبة من كتالوج المتجر. أجيبي في فقرات قصيرة، واذكري المنتجات بأسمائها في ردّك (ستُعرض بطاقاتها تحت الرد تلقائيًا).
المنتجات المرشحة الآن:
${products.map((product) => `- ${product.name}${product.category ? ` (${product.category})` : ""} — ${product.price} د.ع${product.short_description ? ` — ${product.short_description}` : ""}`).join("\n") || "- لا توجد نتائج مطابقة"}`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "X-Title": "NEOMART",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "system", content: system }, ...messages.slice(-8)],
    }),
  });
  if (!res.ok) throw new Error(`openrouter ${res.status}: ${await res.text()}`);

  const data = await res.json();
  return { reply: data.choices?.[0]?.message?.content ?? "عذرًا، لم أفهم طلبك.", products };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const body = await req.json().catch(() => null);
    const messages: Msg[] = body?.messages ?? [];
    if (!Array.isArray(messages) || messages.length === 0)
      return json({ error: "no_messages" }, 400);

    const supabase = createAdminClient();
    const productsClient = createLegacyProductsClient();
    const provider = await getProvider(supabase);
    const out = await callOpenRouter(messages, productsClient);
    return json({ ...out, provider });
  } catch (err) {
    console.error("neo-chat error", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
