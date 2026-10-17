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
  if (!url || !anonKey || !serviceKey) {
    return respond({ error: "Server is not configured" }, 500);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) return respond({ error: "Unauthorized" }, 401);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser();
  const requester = authData.user;
  if (authError || !requester) return respond({ error: "Unauthorized" }, 401);

  let body: {
    officeId?: string;
    username?: string;
    password?: string;
    fullName?: string;
    avatarPath?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return respond({ error: "Invalid JSON body" }, 400);
  }

  const officeId = body.officeId?.trim();
  const username = body.username?.trim().toLowerCase();
  const password = body.password;
  const fullName = body.fullName?.trim();
  const avatarPath = body.avatarPath?.trim() || null;

  if (!officeId || !username || !password || !fullName) {
    return respond({ error: "Ofis, kullanıcı adı, şifre ve ad soyad zorunludur." }, 400);
  }
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return respond({ error: "Kullanıcı adı 3-32 karakter olmalı; İngilizce harf, rakam, nokta, tire ve alt çizgi kullanılabilir." }, 400);
  }
  if (password.length < 10 || password.length > 72) {
    return respond({ error: "İlk şifre en az 10 karakter olmalıdır." }, 400);
  }
  if (fullName.length > 100) return respond({ error: "Ad soyad çok uzun." }, 400);

  if (avatarPath) {
    if (!avatarPath.startsWith(`${officeId}/`) || avatarPath.includes("..")) {
      return respond({ error: "Profil fotoğrafı bu ofise ait değil." }, 400);
    }
    const avatarName = avatarPath.slice(officeId.length + 1);
    const { data: avatarObjects, error: avatarError } = await adminClient.storage
      .from("avatars")
      .list(officeId, { search: avatarName, limit: 10 });
    if (avatarError || !avatarObjects?.some((object) => object.name === avatarName)) {
      return respond({ error: "Profil fotoğrafı bulunamadı." }, 400);
    }
  }

  // Re-check account and office status server-side; an unexpired JWT must not
  // let a disabled owner or an inactive office continue creating accounts.
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("account_status")
    .eq("id", requester.id)
    .maybeSingle();

  if (profileError) return respond({ error: "Account status check failed" }, 500);
  if (!profile || profile.account_status !== "active") {
    return respond({ error: "Hesabınız etkin değil." }, 403);
  }

  const { data: office, error: officeError } = await adminClient
    .from("offices")
    .select("is_active")
    .eq("id", officeId)
    .maybeSingle();

  if (officeError) return respond({ error: "Office status check failed" }, 500);
  if (!office || office.is_active !== true) {
    return respond({ error: "Ofis bulunamadı veya etkin değil." }, 403);
  }

  // Check requester is an active owner of this exact office.
  const { data: membership, error: membershipError } = await adminClient
    .from("office_members")
    .select("role,status")
    .eq("office_id", officeId)
    .eq("user_id", requester.id)
    .maybeSingle();

  if (membershipError) return respond({ error: "Membership check failed" }, 500);
  if (!membership || membership.role !== "owner" || membership.status !== "active") {
    return respond({ error: "Bu ofise danışman ekleme yetkiniz yok." }, 403);
  }

  // Reserve a synthetic, non-deliverable email only for Supabase Auth's internal
  // email/password mechanism. The app UI and user workflow remain username-only.
  const internalEmail = `${username}@accounts.gayit.invalid`;
  const { data: existingProfile, error: lookupError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (lookupError) return respond({ error: "Username lookup failed" }, 500);
  if (existingProfile) return respond({ error: "Bu kullanıcı adı zaten kullanılıyor." }, 409);

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: internalEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { account_type: "agent" },
  });

  if (createError || !created.user) {
    const duplicate = createError?.message.toLowerCase().includes("already") ||
      createError?.message.toLowerCase().includes("unique");
    return respond({ error: duplicate ? "Bu kullanıcı adı zaten kullanılıyor." : "Danışman hesabı oluşturulamadı." }, duplicate ? 409 : 400);
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      username,
      full_name: fullName,
      avatar_path: avatarPath,
      account_status: "active",
      must_change_password: true,
    })
    .eq("id", created.user.id);

  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return respond({ error: "Danışman profili kaydedilemedi." }, 500);
  }

  const { error: memberError } = await adminClient.from("office_members").insert({
    office_id: officeId,
    user_id: created.user.id,
    role: "agent",
    status: "active",
  });

  if (memberError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return respond({ error: "Danışman ofise eklenemedi." }, 500);
  }

  return respond({
    success: true,
    agent: { id: created.user.id, username, fullName, avatarPath, mustChangePassword: true },
  }, 201);
});
