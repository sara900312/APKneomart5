// Toggles the AI provider setting between "lovable" and "openrouter".
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
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "invalid_body" }, 400);
    const { email, password, provider } = body as Record<string, string>;
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");

    if (!adminEmail || !adminPassword || email !== adminEmail || password !== adminPassword) {
      return json({ error: "unauthorized" }, 401);
    }
    if (provider !== "lovable" && provider !== "openrouter") {
      return json({ error: "invalid_provider" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "ai_provider", value: provider, updated_at: new Date().toISOString() });

    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, provider });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
