// app/lib/constants.ts
// ─── Shared constants used across new/edit member forms ──────────────────────

import type { FormState } from "@/app/lib/types";

export const MEMBERSHIP_TYPES = ["Regular","Affiliate",
    "Associate","Honorary","Transient","Does Not Exist"]

export const MEMBER_STATUSES = ["Active", "Pending", 
    "Inactive","Deceased"]

export const SUFFIX = ["Jr.","Sr.","I","II","III",
    "IV","V","VI","VII","VIII","IX","X"]

export const CIVIL_STATUS = ["Single","Married",
    "Widowed","Separated","Others"]

export const SEX = ["Female","Male"]

export const BLOOD_TYPE = ["A","B","AB","O","A+","B+","AB+",
    "O+","A-","B-","AB-","O-"]

export const CITIZENSHIP = ["Filipino","American","Canadian",
    "Japanese","Korean","Chinese","Australian","Others"]

export const HIGHEST_EDUCATION = ["High School","College",
    "Bachelor","Master","Doctorate","Others"]

export const OCCUPATION = ["Education / Academic",
    "Healthcare / Medical","Engineering / Technical",
    "Government Service","Business / Entrepreneur",
    "Private Employee / Corporate",
    "Skilled Trades / Manual Work","Service Industry",
    "Religious / Ministry Work","OFW / Seafarer",
    "Self-Employed / Freelance","Student","Retired",
    "Unemployed / Housewife / Househusband","Other"]

export const INTEREST_SKILLS = ["Music & Worship", "Ministry", "Teaching & Leadership"];
 
export const CHURCH_INVOLVEMENT = [
  "CWA", "CYF", "CYAF", "Chancel", "Choristers",
  "UCM", "Church Council", "Teacher", "Staff", "Others",
];
 
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
 
/** Fields that require Word-by-word title-casing on input */
export const CAPITALIZE_FIELDS = [
  "first_name", "middle_name", "last_name", "birthplace",
  "father", "mother", "home_address", "office_address",
  "school", "spouse", "baptism_place",
];
 
/** Fields required to save/update a member */
export const REQUIRED_FIELDS = [
  "red_book_no", "fellowship", "membership_type",
  "status", "first_name", "last_name", "civil_status", "sex",
];
 
/** Default empty form state */
export const EMPTY_FORM: FormState = {
  red_book_no: "", fellowship: "", membership_type: "", status: "",
  first_name: "", last_name: "", middle_name: "", suffix: "",
  civil_status: "", sex: "", blood_type: "", citizenship: "",
  birthdate: "", birthplace: "", age: "" as string | number, age_group: "",
  father: "", mother: "",
  home_address: "", zone: "", office_address: "",
  mobile_num: "", home_contact: "", office_contact: "", email: "",
  education: "", school: "", year_graduated: "", occupation: "",
  baptism_place: "", baptism_date: "", officiating_minister: "",
  spouse: "", spouse_citizenship: "", wedding_date: "", years_married: "" as string | number,
  children: [{ name: "", birthdate: "" }],
  interest_skills: [] as string[],
  church_involvement: [] as string[],
  date_of_decease: "",
};
 