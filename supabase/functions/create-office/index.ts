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
  const caller = data.user;
  if (error || !caller) return respond({ error: "Unauthorized" }, 401);
  if (caller.app_metadata?.role !== "superadmin") {
    return respond({ error: "Süperadmin yetkisi gerekli." }, 403);
  }

  // The role claim alone is not enough: disabled accounts may still hold a
  // valid JWT until it expires, so check the current server-side profile state.
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("account_status")
    .eq("id", caller.id)
    .maybeSingle();

  if (profileError) return respond({ error: "Account status check failed" }, 500);
  if (!profile || profile.account_status !== "active") {
    return respond({ error: "Hesabınız etkin değil." }, 403);
  }

  let body: { officeName?: string; ownerUsername?: string; ownerPassword?: string; ownerFullName?: string };
  try { body = await req.json(); } catch { return respond({ error: "Invalid JSON body" }, 400); }

  const officeName = body.officeName?.trim();
  const username = body.ownerUsername?.trim().toLowerCase();
  const password = body.ownerPassword;
  const fullName = body.ownerFullName?.trim();

  if (!officeName || !username || !password || !fullName) {
    return respond({ error: "Ofis adı, yetkili kullanıcı adı, ilk şifre ve yetkili adı zorunludur." }, 400);
  }
  if (officeName.length < 2 || officeName.length > 120) return respond({ error: "Ofis adı 2-120 karakter olmalıdır." }, 400);
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) return respond({ error: "Kullanıcı adı 3-32 karakter olmalı ve İngilizce harf/rakam, nokta, tire veya alt çizgi içermelidir." }, 400);
  if (password.length < 10 || password.length > 72) return respond({ error: "İlk şifre en az 10 karakter olmalıdır." }, 400);
  if (fullName.length > 100) return respond({ error: "Yetkili adı çok uzun." }, 400);

  const { data: existing, error: lookupError } = await adminClient
    .from("profiles").select("id").eq("username", username).maybeSingle();
  if (lookupError) return respond({ error: "Username lookup failed" }, 500);
  if (existing) return respond({ error: "Bu kullanıcı adı zaten kullanılıyor." }, 409);

  const { data: authResult, error: createError } = await adminClient.auth.admin.createUser({
    email: `${username}@accounts.gayit.invalid`,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { account_type: "owner" },
  });
  if (createError || !authResult.user) {
    return respond({ error: "Ofis sahibi hesabı oluşturulamadı." }, 400);
  }

  const ownerId = authResult.user.id;
  const { error: profileError } = await adminClient.from("profiles").update({
    username,
    full_name: fullName,
    account_status: "active",
    must_change_password: true,
  }).eq("id", ownerId);
  if (profileError) {
    await adminClient.auth.admin.deleteUser(ownerId);
    return respond({ error: "Ofis sahibi profili kaydedilemedi." }, 500);
  }

  const { data: office, error: officeError } = await adminClient.from("offices")
    .insert({ name: officeName, owner_id: ownerId, is_active: true })
    .select("id,name,owner_id")
    .single();

  if (officeError || !office) {
    await adminClient.auth.admin.deleteUser(ownerId);
    return respond({ error: "Ofis oluşturulamadı." }, 500);
  }

  return respond({
    success: true,
    office: { id: office.id, name: office.name },
    owner: { id: ownerId, username, fullName, mustChangePassword: true },
  }, 201);
});
