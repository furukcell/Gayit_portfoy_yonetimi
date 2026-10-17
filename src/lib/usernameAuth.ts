import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase";

const INTERNAL_LOGIN_DOMAIN = "accounts.gayit.invalid";

export type GayitProfile = {
  id: string;
  username: string;
  full_name: string;
  avatar_path: string | null;
  account_status: "active" | "disabled";
  must_change_password: boolean;
};

export type UsernameLoginResult = {
  user: User;
  profile: GayitProfile;
  mustChangePassword: boolean;
};

/**
 * The UI collects username + password only. The synthetic email is an internal
 * Supabase Auth compatibility detail and must never be displayed to users.
 */
export async function signInWithUsername(
  usernameInput: string,
  password: string,
): Promise<UsernameLoginResult> {
  const username = usernameInput.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new Error("Kullanıcı adı 3-32 karakter olmalı.");
  }
  if (!password) throw new Error("Şifre zorunludur.");

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: `${username}@${INTERNAL_LOGIN_DOMAIN}`,
    password,
  });
  if (error || !data.user) throw new Error("Kullanıcı adı veya şifre hatalı.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,username,full_name,avatar_path,account_status,must_change_password")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    throw new Error("Hesap profili bulunamadı. Lütfen yöneticinizle görüşün.");
  }
  if (profile.account_status !== "active") {
    await supabase.auth.signOut();
    throw new Error("Hesabınız devre dışı bırakılmış. Ofis yöneticinizle görüşün.");
  }

  return {
    user: data.user,
    profile: profile as GayitProfile,
    mustChangePassword: profile.must_change_password,
  };
}

export async function changeInitialPassword(newPassword: string): Promise<void> {
  if (newPassword.length < 10) {
    throw new Error("Yeni şifre en az 10 karakter olmalıdır.");
  }

  const supabase = getSupabaseClient();
  const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
  if (authError) throw new Error("Şifre değiştirilemedi. Lütfen tekrar deneyin.");

  // The migration's profile-field trigger intentionally blocks client changes
  // to must_change_password. Clear it through a trusted Edge Function instead.
  const { error } = await supabase.functions.invoke("complete-first-login", {
    body: {},
  });
  if (error) {
    throw new Error("Şifre değişti ancak ilk giriş adımı tamamlanamadı. Uygulamadan çıkış yapmadan yöneticinizle görüşün.");
  }
}
