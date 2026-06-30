// app/api/members/route.ts
// Admin-only member creation. Re-validates required fields server-side
// instead of trusting the client form.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, requireAdminSession } from "@/app/lib/supabase-server";
import { validateMemberPayload, stripServerOwnedFields } from "@/app/lib/validateMember";

export async function POST(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const validationError = validateMemberPayload(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const payload = stripServerOwnedFields(body);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("members").insert([payload]).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data }, { status: 201 });
}
