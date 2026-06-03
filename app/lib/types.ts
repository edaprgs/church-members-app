// app/lib/types.ts
// ─── Shared types used across admin + member portal ───────────────────────────

export type UserRole = "admin" | "member";

export type MemberStatus = "Active" | "Inactive" | "Deceased" | "Pending";

export type Child = {
  name: string;
  birthdate: string;
};

export type Member = {
  id: string;
  red_book_no?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  sex?: "Male" | "Female";
  status?: MemberStatus;
  fellowship?: string;
  membership_type?: string;
  birthdate?: string;
  birthplace?: string;
  mobile_num?: string;
  home_contact?: string;
  office_contact?: string;
  civil_status?: string;
  age?: string | number;
  age_group?: string;
  home_address?: string;
  office_address?: string;
  zone?: string;
  email?: string;
  occupation?: string;
  education?: string;
  school?: string;
  year_graduated?: string;
  spouse?: string;
  spouse_citizenship?: string;
  wedding_date?: string;
  years_married?: string | number;
  blood_type?: string;
  citizenship?: string;
  father?: string;
  mother?: string;
  baptism_place?: string;
  baptism_date?: string;
  officiating_minister?: string;
  children?: Child[];
  interest_skills?: string[];
  church_involvement?: string[];
  date_of_decease?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
};

export type FormState = Omit<Member, "id" | "created_at" | "updated_at" | "sex" | "status"> & {
  sex: "Male" | "Female" | "";
  status: MemberStatus | "";
  children: Child[];
  interest_skills: string[];
  church_involvement: string[];
};

export type SettingsState = {
  church_name: string;
  church_address: string;
  church_email: string;
  fellowships: string[];
  ministers: string[];
};

export interface ToastState {
  show: boolean;
  type: "success" | "error";
  title: string;
  sub: string;
}