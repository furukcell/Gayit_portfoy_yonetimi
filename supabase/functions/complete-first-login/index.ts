import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return respond({ error: "Server is not configured" }, 500);

  const authorization = req.headers.get("Authorization");
  if (!authorization) return respond({ error: "Unauthorized" }, 401);
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return respond({ error: "Unauthorized" }, 401);

  let body: { newPassword?: string };
  try { body = await req.json(); } catch { return respond({ error: "Invalid JSON body" }, 400); }
  const newPassword = body.newPassword;
  if (!newPassword || newPassword.length < 10 || newPassword.length > 72) {
    return respond({ error: "Yeni şifre 10-72 karakter arasında olmalıdır." }, 400);
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("must_change_password,account_status")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileError || !profile) return respond({ error: "Profile not found" }, 404);
  if (profile.account_status !== "active") return respond({ error: "Account disabled" }, 403);
  if (!profile.must_change_password) return respond({ error: "İlk giriş şifresi zaten değiştirilmiş." }, 409);

  const { error: passwordError } = await adminClient.auth.admin.updateUserById(data.user.id, {
    password: newPassword,
  });
  if (passwordError) return respond({ error: "Şifre güncellenemedi." }, 400);

  const { error: updateError } = await adminClient.from("profiles")
    .update({ must_change_password: false })
    .eq("id", data.user.id);
  if (updateError) return respond({ error: "Şifre güncellendi ancak hesap durumu güncellenemedi." }, 500);

  return respond({ success: true });
});
