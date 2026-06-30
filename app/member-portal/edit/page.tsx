"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Field, SelectField, Computed, Section } from "../components/MemberFormFields";
import { getZone, getAge, getAgeGroup, getYearsMarried, titleCase } from "@/app/lib/utils";
import {
  ArrowLeft, Save, CheckCircle2, AlertCircle, X,
  User, Calendar, Users, Heart, MapPin, GraduationCap,
  Droplets, Baby, Lightbulb, Church,
} from "lucide-react";

type Child = { name: string; birthdate: string };
type Toast = { id: number; title: string; sub: string; type: "success" | "error" };

const CAPITALIZE = ["first_name", "middle_name", "last_name", "birthplace", "father", "mother", "home_address", "office_address", "school", "spouse", "baptism_place"];

const C = {
  headerFrom:   "#1e2d5a",
  headerTo:     "#2d3f7a",
  primary:      "#4f46e5",
  primarySoft:  "#6366f1",
  accentText:   "#3730a3",
  lightBg:      "#f0f4ff",
  indigoGlow:   "rgba(79,70,229,0.25)",
  pageBg:       "#eef2f9",
  card:         "#ffffff",
  softSurface:  "#f5f7fc",
  border:       "#dde3f0",
  lightBorder:  "#f0f3fa",
  secText:      "#7b88a8",
  mutedText:    "#9aa3bc",
  veryMuted:    "#b0bbd4",
  successGreen: "#16a34a",
  successBg:    "#f0fdf4",
  errorRed:     "#dc2626",
  errorBg:      "#fff5f5",
  label:        "#4b5280",
  inputText:    "#1e2d5a",
  inputBorder:  "#dde3f0",
  inputBg:      "#f9faff",
  computedBg:   "#f0f4ff",
  computedBdr:  "#dde3f0",
  computedText: "#7b88a8",
};

// ── Styles defined OUTSIDE component so they're stable across renders ──────────
const inputStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10,
  border: `1.5px solid ${C.inputBorder}`,
  background: C.inputBg, fontSize: 14,
  color: C.inputText, outline: "none",
  transition: "border-color 0.15s",
  width: "100%", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 600, color: C.label,
  letterSpacing: "0.05em", textTransform: "uppercase",
};

const grid4: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 };
const grid3: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 };

const chipActive: React.CSSProperties = {
  padding: "7px 16px", borderRadius: 100, fontSize: 13, fontWeight: 500,
  cursor: "pointer", transition: "all 0.15s",
  background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primarySoft} 100%)`,
  border: `1.5px solid ${C.primary}`,
  color: "#fff",
  boxShadow: `0 2px 8px ${C.indigoGlow}`,
};

const chipIdle: React.CSSProperties = {
  padding: "7px 16px", borderRadius: 100, fontSize: 13, fontWeight: 500,
  cursor: "pointer", transition: "all 0.15s",
  background: C.inputBg,
  border: `1.5px solid ${C.inputBorder}`,
  color: C.secText,
};

const divider = <div style={{ height: 1, background: C.lightBorder, margin: "20px 0" }} />;

export default function MemberEditPage() {
  const router = useRouter();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [noRecord, setNoRecord] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const [form, setForm] = useState({
    first_name: "", middle_name: "", last_name: "", suffix: "",
    civil_status: "", sex: "", blood_type: "", citizenship: "",
    birthdate: "", birthplace: "", age: "" as string | number, age_group: "",
    father: "", mother: "",
    home_address: "", zone: "", office_address: "",
    mobile_num: "", home_contact: "", office_contact: "", email: "",
    education: "", school: "", year_graduated: "", occupation: "",
    baptism_place: "", baptism_date: "", officiating_minister: "",
    spouse: "", spouse_citizenship: "", wedding_date: "",
    years_married: "" as string | number,
    children: [{ name: "", birthdate: "" }] as Child[],
    interest_skills: [] as string[],
    church_involvement: [] as string[],
  });

  const addToast = (title: string, sub: string, type: "success" | "error") => {
    const tid = ++toastId.current;
    setToasts(p => [...p, { id: tid, title, sub, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== tid)), 4000);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/"); return; }
      const { data } = await supabase
        .from("members").select("*").eq("user_id", user.id).maybeSingle();
      setFetching(false);
      if (!data) { setNoRecord(true); return; }
      setMemberId(data.id);
      setForm({
        first_name: data.first_name || "", middle_name: data.middle_name || "",
        last_name: data.last_name || "", suffix: data.suffix || "",
        civil_status: data.civil_status || "", sex: data.sex || "",
        blood_type: data.blood_type || "", citizenship: data.citizenship || "",
        birthdate: data.birthdate || "", birthplace: data.birthplace || "",
        age: data.age ?? "", age_group: data.age_group || "",
        father: data.father || "", mother: data.mother || "",
        home_address: data.home_address || "", zone: data.zone || "",
        office_address: data.office_address || "",
        mobile_num: data.mobile_num || "", home_contact: data.home_contact || "",
        office_contact: data.office_contact || "", email: data.email || "",
        education: data.education || "", school: data.school || "",
        year_graduated: data.year_graduated || "", occupation: data.occupation || "",
        baptism_place: data.baptism_place || "", baptism_date: data.baptism_date || "",
        officiating_minister: data.officiating_minister || "",
        spouse: data.spouse || "", spouse_citizenship: data.spouse_citizenship || "",
        wedding_date: data.wedding_date || "", years_married: data.years_married ?? "",
        children: Array.isArray(data.children) && data.children.length > 0
          ? data.children : [{ name: "", birthdate: "" }],
        interest_skills: data.interest_skills || [],
        church_involvement: data.church_involvement || [],
      });
    })();
  }, [router]);

  useEffect(() => {
    if (!form.birthdate) { setForm(p => ({ ...p, age: "", age_group: "" })); return; }
    const age = getAge(form.birthdate);
    setForm(p => ({ ...p, age, age_group: getAgeGroup(age) }));
  }, [form.birthdate]);

  useEffect(() => {
    if (!form.wedding_date) { setForm(p => ({ ...p, years_married: "" })); return; }
    setForm(p => ({ ...p, years_married: getYearsMarried(form.wedding_date) }));
  }, [form.wedding_date]);

  useEffect(() => {
    if (!form.home_address) { setForm(p => ({ ...p, zone: "" })); return; }
    setForm(p => ({ ...p, zone: getZone(form.home_address) }));
  }, [form.home_address]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "mobile_num") {
      setForm(p => ({ ...p, mobile_num: value.replace(/\D/g, "").slice(0, 10) }));
      return;
    }
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (CAPITALIZE.includes(name)) {
      setForm(p => ({ ...p, [name]: titleCase(value) }));
    }
  };

  const addChild = () => setForm(p => ({ ...p, children: [...p.children, { name: "", birthdate: "" }] }));
  const removeChild = (i: number) => setForm(p => ({ ...p, children: p.children.filter((_, idx) => idx !== i) }));
  const updateChild = (i: number, field: keyof Child, val: string) =>
    setForm(p => {
      const updated = [...p.children];
      updated[i] = { ...updated[i], [field]: field === "name" ? titleCase(val) : val };
      return { ...p, children: updated };
    });

  const toggleSkill = (v: string) => setForm(p => ({
    ...p,
    interest_skills: p.interest_skills.includes(v) ? p.interest_skills.filter(x => x !== v) : [...p.interest_skills, v],
  }));
  const toggleChurch = (v: string) => setForm(p => ({
    ...p,
    church_involvement: p.church_involvement.includes(v) ? p.church_involvement.filter(x => x !== v) : [...p.church_involvement, v],
  }));

  const handleSave = async () => {
    if (!memberId) return;
    setLoading(true);
    const res = await fetch("/api/member-portal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        birthdate: form.birthdate || null,
        wedding_date: form.wedding_date || null,
        baptism_date: form.baptism_date || null,
        age: form.age !== "" ? form.age : null,
        years_married: form.years_married !== "" ? form.years_married : null,
        children: form.children.map(c => ({ ...c, birthdate: c.birthdate || null })),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Save failed." }));
      addToast("Save Failed", error, "error");
      return;
    }
    addToast("Profile Updated", "Your changes have been saved.", "success");
    setTimeout(() => router.push("/member-portal"), 1400);
  };

  if (fetching) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 12, background: C.pageBg }}>
      <div style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTopColor: C.primary, borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
    </div>
  );

  if (noRecord) return (
    <div
      style={{
        padding: 40,
        background: C.pageBg,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: C.card,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          padding: 40,
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          boxShadow: `0 4px 24px rgba(79,70,229,0.06)`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <AlertCircle size={32} style={{ color: "#f59e0b" }} />
        </div>

        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: C.headerFrom,
            margin: "0 0 10px",
          }}
        >
          No record linked
        </h2>

        <p
          style={{
            fontSize: 14,
            color: C.secText,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Contact your church admin to link your account.
        </p>
      </div>
    </div>
  );
  

  return (
    <>
      <style>{`
        input:focus, select:focus { border-color: ${C.primary} !important; box-shadow: 0 0 0 3px ${C.indigoGlow}; }
      `}</style>

      {/* ── Toasts ── */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: "flex", alignItems: "center", gap: 12,
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
            padding: "14px 18px", boxShadow: "0 8px 32px rgba(30,45,90,0.12)",
            animation: "slideUp 0.25s ease", pointerEvents: "auto",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: t.type === "success" ? C.successBg : C.errorBg,
              color: t.type === "success" ? C.successGreen : C.errorRed,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {t.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            </div>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: C.headerFrom, margin: "0 0 1px" }}>{t.title}</p>
              <p style={{ fontSize: 12, color: C.mutedText, margin: 0 }}>{t.sub}</p>
            </div>
            <button
              onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
              style={{ padding: 4, borderRadius: 6, border: "none", background: "transparent", color: C.veryMuted, cursor: "pointer", marginLeft: 4 }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ background: C.pageBg, minHeight: "100vh" }}>
        {/* ── Header ── */}
        <div style={{ background: `linear-gradient(135deg, ${C.headerFrom} 0%, ${C.headerTo} 100%)` }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 32px 36px" }}>
            <button
              onClick={() => router.push("/member-portal")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 500, border: "none", background: "none", cursor: "pointer", padding: 0, marginBottom: 24 }}
            >
              <ArrowLeft size={14} /> Back to My Profile
            </button>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 6px" }}>Edit My Profile</h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: 0 }}>Keep your membership information up to date</p>
          </div>
        </div>

        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 32px 80px" }}>

          <Section title="Personal Information" icon={User}>
            <div style={grid4}>
              <Field label="First Name" name="first_name" form={form} handleChange={handleChange} handleBlur={handleBlur} />
              <Field label="Middle Name" name="middle_name" form={form} handleChange={handleChange} handleBlur={handleBlur} />
              <Field label="Last Name" name="last_name" form={form} handleChange={handleChange} handleBlur={handleBlur} />
              <SelectField label="Suffix" name="suffix" options={["Jr.","Sr.","I","II","III","IV","V"]} placeholder="None" form={form} handleChange={handleChange} />
            </div>
            {divider}
            <div style={grid4}>
              <SelectField label="Civil Status" name="civil_status" options={["Single","Married","Widowed","Separated","Others"]} placeholder="Select" form={form} handleChange={handleChange} />
              <SelectField label="Sex" name="sex" options={["Female","Male"]} placeholder="Select" form={form} handleChange={handleChange} />
              <SelectField label="Blood Type" name="blood_type" options={["A","B","AB","O","A+","B+","AB+","O+","A-","B-","AB-","O-"]} placeholder="Select" form={form} handleChange={handleChange} />
              <SelectField label="Citizenship" name="citizenship" options={["Filipino","American","Canadian","Japanese","Korean","Chinese","Australian","Others"]} placeholder="Select" form={form} handleChange={handleChange} />
            </div>
          </Section>

          <Section title="Birthdate & Age" icon={Calendar}>
            <div style={grid4}>
              <Field label="Birthdate" name="birthdate" type="date" form={form} handleChange={handleChange} handleBlur={handleBlur} />
              <Field label="Birthplace" name="birthplace" form={form} handleChange={handleChange} handleBlur={handleBlur} />
              <Computed label="Age" value={form.age} />
              <Computed label="Age Group" value={form.age_group} />
            </div>
          </Section>

          <Section title="Family Background" icon={Users}>
            <div style={grid2}>
              <Field label="Father's Name" name="father" form={form} handleChange={handleChange} handleBlur={handleBlur} />
              <Field label="Mother's Name" name="mother" form={form} handleChange={handleChange} handleBlur={handleBlur} />
            </div>
          </Section>

          {form.civil_status === "Married" && (
            <Section title="Marriage Information" icon={Heart}>
              <div style={grid4}>
                <Field label="Spouse Name" name="spouse" form={form} handleChange={handleChange} handleBlur={handleBlur} />
                <SelectField label="Spouse Citizenship" name="spouse_citizenship" options={["Filipino","American","Canadian","Japanese","Korean","Chinese","Australian","Others"]} placeholder="Select" form={form} handleChange={handleChange} />
                <Field label="Wedding Date" name="wedding_date" type="date" form={form} handleChange={handleChange} handleBlur={handleBlur} />
                <Computed label="Years Married" value={form.years_married !== "" ? `${form.years_married} yrs` : ""} />
              </div>
            </Section>
          )}

          <Section title="Address & Contact" icon={MapPin}>
            <div style={{ ...grid3, marginBottom: 20 }}>
              <Field label="Home Address" name="home_address" form={form} handleChange={handleChange} handleBlur={handleBlur} />
              <Computed label="Zone" value={form.zone} />
              <Field label="Office Address" name="office_address" form={form} handleChange={handleChange} handleBlur={handleBlur} />
            </div>
            <div style={grid4}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={labelStyle}>Mobile No.</label>
                <div style={{ display: "flex", borderRadius: 10, border: `1.5px solid ${C.inputBorder}`, overflow: "hidden" }}>
                  <span style={{ padding: "10px 12px", background: C.lightBg, borderRight: `1.5px solid ${C.inputBorder}`, fontSize: 13, fontWeight: 600, color: C.label, userSelect: "none" }}>+63</span>
                  <input
                    name="mobile_num" value={form.mobile_num}
                    onChange={handleChange} placeholder="9XX XXX XXXX"
                    style={{ flex: 1, padding: "10px 12px", border: "none", background: C.inputBg, fontSize: 14, color: C.inputText, outline: "none" }}
                  />
                </div>
              </div>
              <Field label="Home Contact" name="home_contact" form={form} handleChange={handleChange} handleBlur={handleBlur} />
              <Field label="Office Contact" name="office_contact" form={form} handleChange={handleChange} handleBlur={handleBlur} />
              <Field label="Email Address" name="email" type="email" form={form} handleChange={handleChange} handleBlur={handleBlur} />
            </div>
          </Section>

          <Section title="Education & Work" icon={GraduationCap}>
            <div style={grid4}>
              <SelectField label="Education" name="education" options={["High School","College","Bachelor","Master","Doctorate","Others"]} placeholder="Select" form={form} handleChange={handleChange} />
              <Field label="School / University" name="school" form={form} handleChange={handleChange} handleBlur={handleBlur} />
              <Field label="Year Graduated" name="year_graduated" form={form} handleChange={handleChange} handleBlur={handleBlur} />
              <SelectField label="Occupation" name="occupation" options={["Education / Academic","Healthcare / Medical","Engineering / Technical","Government Service","Business / Entrepreneur","Private Employee / Corporate","Skilled Trades / Manual Work","Service Industry","Religious / Ministry Work","OFW / Seafarer","Self-Employed / Freelance","Student","Retired","Unemployed / Housewife / Househusband","Other"]} placeholder="Select" form={form} handleChange={handleChange} />
            </div>
          </Section>

          <Section title="Baptism" icon={Droplets}>
            <div style={grid3}>
              <Field label="Place of Baptism" name="baptism_place" form={form} handleChange={handleChange} handleBlur={handleBlur} />
              <Field label="Baptism Date" name="baptism_date" type="date" form={form} handleChange={handleChange} handleBlur={handleBlur} />
              <Field label="Officiating Minister" name="officiating_minister" form={form} handleChange={handleChange} handleBlur={handleBlur} />
            </div>
          </Section>

          <Section title="Children" icon={Baby}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: C.secText }}>Add or update your children&apos;s records</span>
              <button
                onClick={addChild}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1.5px dashed ${C.border}`, background: "transparent", color: C.secText, fontSize: 13, cursor: "pointer" }}
              >
                + Add Child
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {form.children.map((c, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: 20, borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.softSurface, position: "relative" }}>
                  <button
                    onClick={() => removeChild(i)}
                    style={{ position: "absolute", top: 12, right: 12, width: 24, height: 24, borderRadius: "50%", border: "none", background: C.lightBg, color: C.secText, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}
                  >✕</button>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={labelStyle}>Child {i + 1} Name</label>
                    <input
                      value={c.name}
                      onChange={e => updateChild(i, "name", e.target.value)}
                      placeholder="Full name"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={labelStyle}>Birthdate</label>
                    <input
                      type="date"
                      value={c.birthdate ?? ""}
                      onChange={e => updateChild(i, "birthdate", e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Interests & Skills" icon={Lightbulb}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Music & Worship", "Ministry", "Teaching & Leadership"].map(item => (
                <button key={item} onClick={() => toggleSkill(item)} style={form.interest_skills.includes(item) ? chipActive : chipIdle}>
                  {item}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Church Involvement" icon={Church}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["CWA","CYF","CYAF","Chancel","Choristers","UCM","Church Council","Teacher","Staff","Others"].map(item => (
                <button key={item} onClick={() => toggleChurch(item)} style={form.church_involvement.includes(item) ? chipActive : chipIdle}>
                  {item}
                </button>
              ))}
            </div>
          </Section>

          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              width: "100%", padding: 16, borderRadius: 12, border: "none",
              background: loading ? C.primary : `linear-gradient(135deg, ${C.primary} 0%, ${C.primarySoft} 100%)`,
              color: "#fff", fontSize: 15, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: `0 4px 16px ${C.indigoGlow}`,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Saving…
              </>
            ) : (
              <><Save size={17} /> Save Changes</>
            )}
          </button>

        </div>
      </div>
    </>
  );
}