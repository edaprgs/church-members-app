// app/api/members/[id]/route.ts
// Admin-only member update/delete. Re-validates required fields server-side
// instead of trusting the client form.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, requireAdminSession } from "@/app/lib/supabase-server";
import { validateMemberPayload, stripServerOwnedFields } from "@/app/lib/validateMember";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const validationError = validateMemberPayload(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const payload = stripServerOwnedFields(body);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("members").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
