// app/lib/validateMember.ts
// ─── Server-side validation for member create/update payloads ────────────────
// Mirrors the client-side required-field checks in the admin and member-portal
// forms, so writes can't bypass validation by calling the API directly.

import { REQUIRED_FIELDS } from "@/app/lib/constants";

/** Required fields for self-service member-portal registration/edits. */
export const MEMBER_PORTAL_REQUIRED_FIELDS = [
  "first_name", "last_name", "civil_status", "sex", "birthdate",
];

/** Fields a caller may never set directly — these are server-controlled. */
const SERVER_OWNED_FIELDS = ["id", "user_id", "created_at", "updated_at"];

export function validateMemberPayload(
  payload: Record<string, unknown>,
  requiredFields: string[] = REQUIRED_FIELDS
): string | null {
  if (!payload || typeof payload !== "object") return "Invalid payload.";

  for (const field of requiredFields) {
    const value = payload[field];
    if (value === undefined || value === null || value === "") {
      return `Missing required field: ${field}`;
    }
  }

  return null;
}

/** Strips fields the client must not be allowed to set. */
export function stripServerOwnedFields<T extends Record<string, unknown>>(payload: T): T {
  const clean = { ...payload };
  for (const field of SERVER_OWNED_FIELDS) delete clean[field];
  return clean;
}
