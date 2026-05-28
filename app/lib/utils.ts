// app/lib/utils.ts
// ─── Pure helper functions shared across all pages ────────────────────────────

// ─── Date helpers ─────────────────────────────────────────────────────────────

export const fmtDate = (d?: string | null): string => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? "—"
    : dt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

export const fmtShort = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const getAge = (birthdate: string): number => {
  const today = new Date();
  const b = new Date(birthdate);
  let age = today.getFullYear() - b.getFullYear();
  if (
    today.getMonth() < b.getMonth() ||
    (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())
  )
    age--;
  return age;
};

export const getAgeGroup = (age: number): string => {
  if (age <= 12) return "Children";
  if (age <= 30) return "Youth";
  if (age <= 59) return "Adult";
  return "Senior";
};

export const getYearsMarried = (weddingDate: string): number => {
  const w = new Date(weddingDate);
  const today = new Date();
  let yrs = today.getFullYear() - w.getFullYear();
  const md = today.getMonth() - w.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < w.getDate())) yrs--;
  return yrs;
};

/** Sort key: (month * 100 + day) for month-day ordering */
export const mmdd = (date: string): number => {
  const d = new Date(date);
  return (d.getMonth() + 1) * 100 + d.getDate();
};

// ─── Name helpers ─────────────────────────────────────────────────────────────

export const getInitials = (first: string, last: string): string =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

export const fullName = (m: {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  suffix?: string;
}): string =>
  `${m.last_name ?? ""} ${m.first_name ?? ""} ${m.middle_name ?? ""} ${m.suffix ?? ""}`.trim();

export const displayName = (m: {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  suffix?: string;
}): string =>
  `${m.first_name ?? ""} ${m.middle_name ? m.middle_name + " " : ""}${m.last_name ?? ""}${m.suffix ? " " + m.suffix : ""}`.trim();

// ─── String helpers ───────────────────────────────────────────────────────────

/** Title-case every word in a string */
export const titleCase = (value: string): string =>
  value.replace(/\b\w/g, (c) => c.toUpperCase());

/** Strip non-digits and limit to 10 chars (PH mobile numbers) */
export const formatMobile = (value: string): string =>
  value.replace(/\D/g, "").slice(0, 10);

// ─── CSV helpers ──────────────────────────────────────────────────────────────

export const escapeCSV = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  return `"${String(v).replace(/"/g, '""')}"`;
};

export const downloadCSV = (rows: unknown[][], filename: string): void => {
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─── Address / Zone helper ────────────────────────────────────────────────────

export const getZone = (address: string): string => {
  const v = address.toLowerCase();
  if (
    /(poblacion|cocogrove|rabago|villaverde|mahayahay|sabayle|tibanga|roosevelt|saray|canaway|noria|ubaldo laya|benitez|isabel|pala-o|andrada|manggas|del carmen|green|abegail|country hills|bagong silang|maria cristina|sudlonon|san miguel|pugaan|langilanon|gaite)/.test(v)
  )
    return "Zone 1";
  if (
    /(tambo|bayug|gerona|bahayan|hinaplanon|franciscan|abragan|sto. rosario|sta. filomena|lambaguhon|barinaut|kiwalan|mandulog|luinab|tubaran|digkilaan|dalipuga|acmac|san roque|santiago)/.test(v)
  )
    return "Zone 2";
  if (
    /(bara-as|laville|noville|doña maria|tipanoy|tubod|rosario|celdran|bacayo|carbide|tambacan|steel town|camague|tominobo|suarez|linamon|ditucalan|bosque|buru-un)/.test(v)
  )
    return "Zone 3";
  return "";
};