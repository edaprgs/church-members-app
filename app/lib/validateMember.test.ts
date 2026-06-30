import { describe, it, expect } from "vitest";
import { validateMemberPayload, stripServerOwnedFields, MEMBER_PORTAL_REQUIRED_FIELDS } from "./validateMember";

describe("validateMemberPayload", () => {
  it("returns null when all admin-required fields are present", () => {
    const payload = {
      red_book_no: "001", fellowship: "Youth", membership_type: "Regular",
      status: "Active", first_name: "Juan", last_name: "Dela Cruz",
      civil_status: "Single", sex: "Male",
    };
    expect(validateMemberPayload(payload)).toBeNull();
  });

  it("reports the first missing required field", () => {
    const payload = { first_name: "Juan" };
    const error = validateMemberPayload(payload);
    expect(error).toMatch(/Missing required field/);
  });

  it("treats empty string as missing", () => {
    const payload = {
      red_book_no: "", fellowship: "Youth", membership_type: "Regular",
      status: "Active", first_name: "Juan", last_name: "Dela Cruz",
      civil_status: "Single", sex: "Male",
    };
    expect(validateMemberPayload(payload)).toBe("Missing required field: red_book_no");
  });

  it("treats null as missing", () => {
    const payload = { first_name: null };
    expect(validateMemberPayload(payload, ["first_name"])).toBe("Missing required field: first_name");
  });

  it("rejects a non-object payload", () => {
    expect(validateMemberPayload(null as unknown as Record<string, unknown>)).toBe("Invalid payload.");
  });

  it("accepts a custom required-fields list (member-portal self-registration)", () => {
    const payload = {
      first_name: "Juan", last_name: "Dela Cruz",
      civil_status: "Single", sex: "Male", birthdate: "1994-01-01",
    };
    expect(validateMemberPayload(payload, MEMBER_PORTAL_REQUIRED_FIELDS)).toBeNull();
  });

  it("does not require fields outside the given list", () => {
    const payload = { first_name: "Juan", last_name: "Dela Cruz" };
    // member-portal list also requires civil_status/sex/birthdate, so this should fail
    expect(validateMemberPayload(payload, MEMBER_PORTAL_REQUIRED_FIELDS)).not.toBeNull();
    // but an admin-only field like red_book_no is irrelevant to this list
    expect(validateMemberPayload(payload, ["first_name", "last_name"])).toBeNull();
  });
});

describe("stripServerOwnedFields", () => {
  it("removes id, user_id, created_at, and updated_at", () => {
    const payload = {
      id: "123", user_id: "abc", created_at: "now", updated_at: "now",
      first_name: "Juan",
    };
    const result = stripServerOwnedFields(payload);
    expect(result).toEqual({ first_name: "Juan" });
  });

  it("leaves other fields untouched", () => {
    const payload = { first_name: "Juan", last_name: "Dela Cruz" };
    expect(stripServerOwnedFields(payload)).toEqual(payload);
  });

  it("does not mutate the original payload", () => {
    const payload = { id: "123", first_name: "Juan" };
    stripServerOwnedFields(payload);
    expect(payload).toEqual({ id: "123", first_name: "Juan" });
  });
});
