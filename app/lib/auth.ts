// app/lib/auth.ts
// ─── Auth helpers shared across admin + member portal ────────────────────────


import { supabase } from "./supabase";

export async function getCurrentUserRole(): Promise<"admin" | "member" | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    return (data?.role as "admin" | "member") ?? null;
  } catch {
    return null;
  }
}

/**
 * Checks whether a session exists.
 * Returns the user if authenticated, or null if not.
 *
 * The caller decides how to handle the null case, e.g.:
 *   const user = await requireAuth();
 *   if (!user) { router.replace("/"); return; }
 */
export async function requireAuth() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    return { user, role: (profile?.role as "admin" | "member") ?? null };
  } catch {
    return null;
  }
}