// app/lib/constants.ts
// ─── Shared constants used across new/edit member forms ──────────────────────

import type { FormState } from "@/app/lib/types";

export const FELLOWSHIPS = ["Bosque","Cabili","City Church",
    "Dalipuga","Digkilaan","Luinab","Pugaan","Saray","Suarez",
    "Tambacan","Tipanoy"]

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

export const MINISTERS = ["Rev. Tessie D. Torres",
                      "Rev. Jonathan M. Cal",
                      "Rev. Sherry T. Tubio",
                      "Rev. Silvestre Bontuyan Sr.",
                      "Rev. Napoleon A. Lumapguid",
                      "Rev. Guevara",
                      "Rev. Luther F. Autor Sr.",
                      "Rev. Olimpio D. Bonotan",
                      "Rev. Carlos D. Iglupas",
                      "Rev. Primo Talingting",
                      "Rev. Delfin Cardinal Jr.",
                      "Fr. Edward Barke",
                      "Pastor Teodoro N. Dajao",
                      "Rev. Nicholas Cabildo",
                      "Rev. Frank C. Laubach",
                      "Rev. Ricarte P. Beley",
                      "Rev. Marcelo Sumabong",
                      "Rev. Julia S. Yapsutco",
                      "Rev. Ambrosio Torres",
                      "Rev. Sabino Ababa",
                      "Rev. Wiron Santiago",
                      "Pastor Industan",
                      "Pastor Ramona Loyola",
                      "Rev. Pastor Rivera",
                      "Rev. Juan Uriarte Sr.",
                      "Rev. Robert Gahuman",
                      "Rev. Francisco C. Malanog Jr.",
                      "Rev. Joan Mae E. Cañete",
                      "Rev. James S. Cañete",
                      "Pastor George D. Inguito",
                      "Rev. Rhee D. Telen",
                      "Pastor Catalino Amorganda",
                      "Rev. Aranas",
                      "Pastor Dela Peña",
                      "Rev. Terero Gualdajara",
                      "Rev. Jessie A. Belza",
                      "Rev. Samuel Palionay",
                      "Rev. Judy Asis",
                      "Pastor Jess T. Lagrimas",
                      "Pastor Demecillo",
                      "Rev. Cesar Lamberang",
                      "Pastor Pontanella",
                      "Pastor Cadusales",
                      "Rev. Patadlas",
                      "Rev. Renerio Dadulo",
                      "Pastor Talapit",
                      "Rev. Nilward Alejo",
                      "John Chute",
                      "Rev. Rito Yañez",
                      "Pastor Elpedio Trego",
                      "Rev. Peter Gowing",
                      "Rev. Sereña",
                      "Rev. Lueldo Suralta",
                      "Rev. Indino",
                      "Parish Priest James Flynn",
                      "Rev. Rogelio Jeminez",
                      "Rev. Porferio M. Lagare",
                      "Parish Priest Antonio Raagas",
                      "Rev. Cabildo",
                      "Rev. Pak",
                      "Rev. Guerrero",
                      "Rev. Merben Maglipac",
                      "Pastor Benjie Epe",
                      "Fr. Marcelino Caldoya",
                      "Rev. Alfonso Quinones",
                      "Rev. Bautista",
                      "Bishop Juan Pia",
                      "Rev. Guillermo Bergado",
                      "Rev. Minda Gran",
                      "Rev. Auicito Echem",
                      "Rev. Henry Can-at",
                      "Pastor Tolero",
                      "Pastor Mike Documento",
                      "Pastor Cenas",
                      "Rev. Ruth Panganiban Billena",
                      "Fr. Michael Donohue",
                      "Rev. Roger Y. Edem",
                      "Rev. Sardual",
                      "Rev. Felipe Mosot",
                      "Rev. Ostoy",
                      "Pastor Wilbert T. Autor",
                      "Pastor Tadlas",
                      "Rev. Martin Ongcangco",
                      "Rev. Camomot",
                      "Pastor Padilla",
                      "Fr. Joseph Mullen",
                      "Rev. Isabel F. Sombrio",
                      "Fr. Francis J. Keaney",
                      "Rev. Pagsuguiron",
                      "Rev. Val Murillo",
                      "Fr. Martin",
                      "Rev. Perez",
                      "Rev. Vic Lem",
                      "Rev. Juan Pia Sr.",
                      "Rev. Rudolfo P. Beley",
                      "Rev. Feliciano Bergado",
                      "Rev. Rodolfo Cabonce",
                      "Rev. Magdamo",
                      "Rev. Adriano Santiago",
                      "Pastor Carl",
                      "Rev. Tampal",
                      "Rev. Zamora",
                      "Rev. Saclarita Villarmea",
                      "Fr. Terines",
                      "Rev. Serate",
                      "Rev. Benjamin M. Orteza",
                      "Rev. Dorindis",
                      "Rev. Franklin Dumaong",
                      "Rev. Longino Daamo Jr.",
                      "Rev. Hinkle",
                      "Pastor Seriño",
                      "Pastor Miguel Retes",
                      "Rev. Abner Saycon",
                      "Rev. Frank Arcadio",
                      "Rev. Bartido",
                      "Rev. Bernon",
                      "Rev. Lad-lad",
                      "Fr. Mograth",
                      "Rev. Febe Palionay",
                      "Pastor Soledad Nacion",
                      "Pastor Flordeliza A. Narsico",
                      "Pastor Flordeus R. Roa",
                      "Rev. Cosme Pacot",
                      "Pastor Sacayan",
                      "Rev. Viernes",
                      "Pastor Dogadoga",
                      "Rev. Timoleo Dayak",
                      "Rev. F. Eularrosa",
                      "Pastor Danlap",
                      "Pastor Gomez",
                      "Pastor Sumabeng",
                      "Dr. Pablo Bringas",
                      "Rev. Lenteria",
                      "Rev. Michael Ducomento",
                      "Pastor Binobo",
                      "Rev. Calson",
                      "Pastor Barte",
                      "Rev. Baliad",
                      "Rev. Loyd Van Vector",
                      "Pastor Bernardino Minor Sr.",
                      "Rev. Ireneo Agayan",
                      "Pastor Sabihon",
                      "Rev. Joven Salig",
                      "Rev. Nick Cabildo",
                      "Rev. Maximo Tilao",
                      "Rev. Dela Cruz",
                      "Others"];

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
 