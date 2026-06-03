// app/api/admin/unlinked-users/route.ts


import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // ← server-only, never sent to browser
);

export async function GET() {
  try {
    // 1. Get all auth users
    const { data: { users }, error: authError } = await adminClient.auth.admin.listUsers();
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

    // 2. Get all user_ids already linked in members table
    const { data: linked } = await adminClient
      .from("members")
      .select("user_id")
      .not("user_id", "is", null);

    const linkedIds = new Set((linked ?? []).map((r: { user_id: string }) => r.user_id));

    // 3. Get all admin user ids from profiles table
    const { data: admins } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    const adminIds = new Set((admins ?? []).map((a: { id: string }) => a.id));

    // 4. Return users who are NOT linked AND NOT an admin
    const unlinked = users
      .filter(u => !linkedIds.has(u.id) && !adminIds.has(u.id))
      .map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
      }));
    

    return NextResponse.json({ users: unlinked });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}