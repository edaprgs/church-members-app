// app/api/member-portal/route.ts
// Self-service member registration/edit. Any authenticated user may call
// this, but it only ever reads/writes the row tied to their own user_id —
// that scoping happens server-side, not via a client-supplied id.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/supabase-server";
import { validateMemberPayload, stripServerOwnedFields, MEMBER_PORTAL_REQUIRED_FIELDS } from "@/app/lib/validateMember";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const validationError = validateMemberPayload(body, MEMBER_PORTAL_REQUIRED_FIELDS);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const { data: existing } = await supabase
    .from("members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: "A member record is already linked to this account." }, { status: 409 });

  const payload = {
    ...stripServerOwnedFields(body),
    user_id: user.id,
    status: "Pending",
    membership_type: "Regular",
  };

  const { data, error } = await supabase.from("members").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const validationError = validateMemberPayload(body, MEMBER_PORTAL_REQUIRED_FIELDS);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const payload = stripServerOwnedFields(body);
  const { data, error } = await supabase
    .from("members")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}
