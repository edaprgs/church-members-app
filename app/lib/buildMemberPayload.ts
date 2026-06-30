import type { FormState } from "@/app/lib/types";

/**
 * Converts empty-string optional fields to null before sending to the API.
 * Shared by the admin new/edit member forms, which had this sanitization
 * list duplicated verbatim (the edit form additionally sets user_id and
 * updated_at on top of this).
 */
export function sanitizeMemberPayload(form: FormState) {
  return {
    ...form,
    birthdate: form.birthdate || null,
    wedding_date: form.wedding_date || null,
    baptism_date: form.baptism_date || null,
    date_of_decease: form.date_of_decease || null,
    age: form.age || null,
    years_married: form.years_married || null,
    middle_name: form.middle_name || null,
    suffix: form.suffix || null,
    blood_type: form.blood_type || null,
    birthplace: form.birthplace || null,
    father: form.father || null,
    mother: form.mother || null,
    home_address: form.home_address || null,
    office_address: form.office_address || null,
    email: form.email || null,
    education: form.education || null,
    school: form.school || null,
    year_graduated: form.year_graduated || null,
    occupation: form.occupation || null,
    baptism_place: form.baptism_place || null,
    officiating_minister: form.officiating_minister || null,
    spouse: form.spouse || null,
    spouse_citizenship: form.spouse_citizenship || null,
    children: form.children.map(c => ({ ...c, birthdate: c.birthdate || null })),
  };
}
