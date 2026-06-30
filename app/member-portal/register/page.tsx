"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { getZone, titleCase } from "@/app/lib/utils";
import {
  ArrowLeft, Send, CheckCircle2, AlertCircle, X,
  User, MapPin, Church, GraduationCap,
  Heart, Baby, Star, BookOpen, Users, Clock3
} from "lucide-react";

type Child = { name: string; birthdate: string };
type Toast = { id: number; title: string; sub: string; type: "success" | "error" };

const CAPITALIZE = ["first_name","middle_name","last_name","birthplace","father","mother","home_address","office_address","school","spouse","baptism_place"];
const REQUIRED = ["first_name","last_name","civil_status","sex","birthdate"];

const MINISTERS = ["Rev. Tessie D. Torres","Rev. Jonathan M. Cal","Rev. Sherry T. Tubio","Rev. Silvestre Bontuyan Sr.","Rev. Napoleon A. Lumapguid","Rev. Luther F. Autor Sr.","Rev. Carlos D. Iglupas","Rev. Delfin Cardinal Jr.","Rev. Joan Mae E. Cañete","Rev. James S. Cañete","Rev. Rhee D. Telen","Rev. Jessie A. Belza","Rev. Roger Y. Edem","Rev. Merben Maglipac","Others"];

const EMPTY: any = {
  first_name:"",middle_name:"",last_name:"",suffix:"",
  civil_status:"",sex:"",blood_type:"",citizenship:"",
  birthdate:"",birthplace:"",age:"",age_group:"",
  father:"",mother:"",
  home_address:"",zone:"",office_address:"",
  mobile_num:"",home_contact:"",office_contact:"",email:"",
  education:"",school:"",year_graduated:"",occupation:"",
  baptism_place:"",baptism_date:"",officiating_minister:"",
  spouse:"",spouse_citizenship:"",wedding_date:"",years_married:"",
  fellowship:"",
  children:[{name:"",birthdate:""}],
  interest_skills:[],church_involvement:[],
};

// ── Styles (static, defined once outside) ──────────────────
const labelStyle: React.CSSProperties = {
  fontSize:11.5, fontWeight:700, color:"#7b88a8",
  letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:6,
};

const getInputStyle = (hasError: boolean): React.CSSProperties => ({
  padding:"10px 14px", borderRadius:10,
  border: `1.5px solid ${hasError ? "#dc2626" : "#dde3f0"}`,
  background: hasError ? "#fff5f5" : "#fff",
  fontSize:14, color:"#1e2d5a", outline:"none", width:"100%",
  boxSizing:"border-box",
  transition:"border-color 0.15s, box-shadow 0.15s",
});

// ── Section wrapper (pure presentational, stable) ──────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      background:"#fff", borderRadius:16,
      border:"1px solid #dde3f0",
      boxShadow:"0 2px 12px rgba(30,45,90,0.05)",
      marginBottom:20, overflow:"hidden",
    }}>
      <div style={{
        padding:"14px 24px",
        borderBottom:"1px solid #dde3f0",
        background:"linear-gradient(135deg, #f0f4ff 0%, #f5f7fc 100%)",
        display:"flex", alignItems:"center", gap:10,
      }}>
        <div style={{
          width:28, height:28, borderRadius:8, flexShrink:0,
          background:"linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"#fff",
          boxShadow:"0 2px 6px rgba(79,70,229,0.25)",
        }}>
          {icon}
        </div>
        <h2 style={{
          fontSize:11, fontWeight:700, letterSpacing:"0.09em",
          textTransform:"uppercase", color:"#3730a3", margin:0,
        }}>
          {title}
        </h2>
      </div>
      <div style={{ padding:24 }}>{children}</div>
    </div>
  );
}

// ── Computed display (stable, no inputs) ───────────────────
function Computed({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={labelStyle}>
        {label}{" "}
        <span style={{ fontSize:10, color:"#b0bbd4", textTransform:"none", fontWeight:400 }}>(auto)</span>
      </label>
      <div style={{
        padding:"10px 14px", borderRadius:10,
        background:"#f0f4ff", border:"1.5px solid #dde3f0",
        fontSize:14, color:"#4a5678", minHeight:42,
        display:"flex", alignItems:"center",
      }}>
        {value || "—"}
      </div>
    </div>
  );
}

// ── Field (stable — props only, no closures over render state) ──
function Field({
  label, name, type = "text", placeholder, value, error, onChange, fieldRef, required,
}: {
  label: string; name: string; type?: string; placeholder?: string;
  value: string; error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fieldRef?: (el: HTMLInputElement | null) => void;
  required?: boolean;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color:"#dc2626", marginLeft:3 }}>*</span>}
      </label>
      <input
        ref={fieldRef}
        type={type} name={name} value={value ?? ""}
        onChange={onChange} placeholder={placeholder}
        style={getInputStyle(!!error)}
      />
      {error && <span style={{ fontSize:11.5, color:"#dc2626", fontWeight:600 }}>↑ {error}</span>}
    </div>
  );
}

// ── Select (stable) ────────────────────────────────────────
function SelectField({
  label, name, options, placeholder, value, error, onChange, fieldRef, required,
}: {
  label: string; name: string; options: string[]; placeholder?: string;
  value: string; error?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  fieldRef?: (el: HTMLSelectElement | null) => void;
  required?: boolean;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color:"#dc2626", marginLeft:3 }}>*</span>}
      </label>
      <select
        ref={fieldRef}
        name={name} value={value ?? ""} onChange={onChange}
        style={{ ...getInputStyle(!!error), appearance:"none", cursor:"pointer" }}
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <span style={{ fontSize:11.5, color:"#dc2626", fontWeight:600 }}>↑ {error}</span>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function MemberRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const toastId = useRef(0);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const setRef = (name: string) => (el: HTMLElement | null) => { fieldRefs.current[name] = el; };

  const addToast = (title: string, sub: string, type: "success" | "error") => {
    const tid = ++toastId.current;
    setToasts(p => [...p, { id: tid, title, sub, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== tid)), 4000);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/"); return; }
      const { data } = await supabase.from("members").select("id").eq("user_id", user.id).maybeSingle();
      if (data) { router.replace("/member-portal"); return; }
      const { data: { user: u } } = await supabase.auth.getUser();
      setForm((p: any) => ({ ...p, email: u?.email || "" }));
      setCheckingExisting(false);
    })();
  }, []);

  useEffect(() => {
    if (!form.birthdate) { setForm((p: any) => ({ ...p, age: "", age_group: "" })); return; }
    const b = new Date(form.birthdate), today = new Date();
    let age = today.getFullYear() - b.getFullYear();
    if (today.getMonth() - b.getMonth() < 0 || (today.getMonth() - b.getMonth() === 0 && today.getDate() < b.getDate())) age--;
    const group = age <= 12 ? "Children" : age <= 30 ? "Youth" : age <= 59 ? "Adult" : "Senior";
    setForm((p: any) => ({ ...p, age, age_group: group }));
  }, [form.birthdate]);

  useEffect(() => {
    if (!form.wedding_date) { setForm((p: any) => ({ ...p, years_married: "" })); return; }
    const w = new Date(form.wedding_date), today = new Date();
    let yrs = today.getFullYear() - w.getFullYear();
    if (today.getMonth() - w.getMonth() < 0 || (today.getMonth() - w.getMonth() === 0 && today.getDate() < w.getDate())) yrs--;
    setForm((p: any) => ({ ...p, years_married: yrs }));
  }, [form.wedding_date]);

  useEffect(() => {
    if (!form.home_address) { setForm((p: any) => ({ ...p, zone: "" })); return; }
    setForm((p: any) => ({ ...p, zone: getZone(form.home_address) }));
  }, [form.home_address]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "mobile_num") {
      setForm((p: any) => ({ ...p, mobile_num: value.replace(/\D/g,"").slice(0,10) }));
      return;
    }
    const fmt = CAPITALIZE.includes(name) ? titleCase(value) : value;
    setForm((p: any) => ({ ...p, [name]: fmt }));
    if (errors[name]) setErrors(p => { const n = {...p}; delete n[name]; return n; });
  };

  const addChild = () => setForm((p: any) => ({ ...p, children: [...p.children, { name:"", birthdate:"" }] }));
  const removeChild = (i: number) => setForm((p: any) => ({ ...p, children: p.children.filter((_: any, idx: number) => idx !== i) }));
  const updateChild = (i: number, field: keyof Child, val: string) =>
    setForm((p: any) => {
      const updated = [...p.children];
      updated[i] = { ...updated[i], [field]: field === "name" ? titleCase(val) : val };
      return { ...p, children: updated };
    });

  const toggleSkill = (v: string) => setForm((p: any) => ({ ...p, interest_skills: p.interest_skills.includes(v) ? p.interest_skills.filter((x: string) => x !== v) : [...p.interest_skills, v] }));
  const toggleChurch = (v: string) => setForm((p: any) => ({ ...p, church_involvement: p.church_involvement.includes(v) ? p.church_involvement.filter((x: string) => x !== v) : [...p.church_involvement, v] }));

  const handleSubmit = async () => {
    const newErrors: Record<string,string> = {};
    REQUIRED.forEach(f => { if (!form[f]) newErrors[f] = "Required"; });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const first = Object.keys(newErrors)[0];
      fieldRefs.current[first]?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/"); return; }
    const res = await fetch("/api/member-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        birthdate: form.birthdate || null,
        wedding_date: form.wedding_date || null,
        baptism_date: form.baptism_date || null,
        age: form.age || null,
        years_married: form.years_married || null,
        children: form.children.map((c: Child) => ({ ...c, birthdate: c.birthdate || null })),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Submission failed." }));
      addToast("Submission Failed", error, "error");
      return;
    }
    setSubmitted(true);
  };

  const g4: React.CSSProperties = { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20 };
  const g3: React.CSSProperties = { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 };
  const g2: React.CSSProperties = { display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:20 };

  if (checkingExisting) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", flexDirection:"column", gap:12 }}>
      <div style={{ width:28, height:28, border:"3px solid #dde3f0", borderTopColor:"#4f46e5", borderRadius:"50%", animation:"spin 0.75s linear infinite" }} />
    </div>
  );

  if (submitted) return (
    <div style={{ padding:40, maxWidth:520, margin:"0 auto" }}>
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #dde3f0", boxShadow:"0 4px 20px rgba(30,45,90,0.07)", padding:40, textAlign:"center" }}>
        <div style={{ width:64, height:64, borderRadius:16, background:"#f0fdf4", border:"1px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", color:"#16a34a" }}>
          <CheckCircle2 size={28} />
        </div>
        <h2 style={{ fontSize:20, fontWeight:700, color:"#1e2d5a", margin:"0 0 10px" }}>Application Submitted!</h2>
        <p style={{ fontSize:14, color:"#7b88a8", lineHeight:1.6, margin:"0 0 28px" }}>
          Thank you, <strong style={{ color:"#1e2d5a" }}>{form.first_name}</strong>! Your membership application has been received. The church admin will review it and activate your account.
        </p>
        <button onClick={() => router.push("/member-portal")} style={{ padding:"11px 28px", borderRadius:10, border:"none", background:"linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer", boxShadow:"0 4px 14px rgba(79,70,229,0.28)" }}>
          Back to Portal
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        input:focus, select:focus {
          border-color: #818cf8 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important;
          outline: none !important;
        }
        @media(max-width:700px){
          .reg-g4,.reg-g3{grid-template-columns:1fr 1fr !important}
          .reg-g2{grid-template-columns:1fr !important}
        }
        @media(max-width:480px){
          .reg-g4,.reg-g3,.reg-g2{grid-template-columns:1fr !important}
        }
      `}</style>

      {/* Toasts */}
      <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
        {toasts.map(t => (
          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, background:"#fff", border:"1px solid #dde3f0", borderRadius:14, padding:"14px 18px", boxShadow:"0 8px 32px rgba(30,45,90,0.12)", animation:"slideUp 0.25s ease", pointerEvents:"auto" }}>
            <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background: t.type==="success"?"#f0fdf4":"#fff5f5", color: t.type==="success"?"#16a34a":"#dc2626", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {t.type==="success" ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
            </div>
            <div>
              <p style={{ fontSize:13.5, fontWeight:700, color:"#1e2d5a", margin:"0 0 1px" }}>{t.title}</p>
              <p style={{ fontSize:12, color:"#9aa3bc", margin:0 }}>{t.sub}</p>
            </div>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} style={{ padding:4, borderRadius:6, border:"none", background:"transparent", color:"#b0bbd4", cursor:"pointer", marginLeft:4 }}>
              <X size={14}/>
            </button>
          </div>
        ))}
      </div>

      <div style={{ background:"#eef2f9", minHeight:"100vh" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg, #1e2d5a 0%, #2d3f7a 100%)", borderBottom:"1px solid rgba(99,102,241,0.2)", boxShadow:"0 4px 20px rgba(30,45,90,0.15)" }}>
          <div style={{ maxWidth:1000, margin:"0 auto", padding:"40px 32px 36px" }}>
            <button onClick={() => router.push("/member-portal")} style={{ display:"inline-flex", alignItems:"center", gap:6, color:"rgba(255,255,255,0.55)", fontSize:13, fontWeight:500, border:"none", background:"none", cursor:"pointer", padding:0, marginBottom:24 }}>
              <ArrowLeft size={14}/> Back to Profile
            </button>
            <h1 style={{ fontSize:28, fontWeight:700, color:"#fff", letterSpacing:"-0.02em", margin:"0 0 6px" }}>Membership Application</h1>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14, margin:0, lineHeight:1.6 }}>
              Fill out the form below. Your application will be reviewed by the church admin before activation.
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:20, padding:"12px 16px", background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.28)", borderRadius:10 }}>
              <Clock3 size={18} strokeWidth={2.2} color="rgba(255,210,100,0.95)" />
              <p style={{ fontSize:13, color:"rgba(255,210,100,0.95)", margin:0 }}>
                Your account will show as <strong>Pending</strong> until the admin approves your application.
              </p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1000, margin:"0 auto", padding:"32px 32px 80px" }}>

          <Section title="Basic Information" icon={<User size={14}/>}>
            <div className="reg-g4" style={g4}>
              <Field label="First Name" name="first_name" value={form.first_name} error={errors.first_name} onChange={handleChange} fieldRef={setRef("first_name")} required />
              <Field label="Middle Name" name="middle_name" value={form.middle_name} error={errors.middle_name} onChange={handleChange} fieldRef={setRef("middle_name")} />
              <Field label="Last Name" name="last_name" value={form.last_name} error={errors.last_name} onChange={handleChange} fieldRef={setRef("last_name")} required />
              <SelectField label="Suffix" name="suffix" options={["Jr.","Sr.","I","II","III","IV","V","VI","VII","VIII","IX","X"]} placeholder="None" value={form.suffix} error={errors.suffix} onChange={handleChange} fieldRef={setRef("suffix")} />
            </div>
            <div style={{ height:1, background:"#dde3f0", margin:"20px 0" }} />
            <div className="reg-g4" style={g4}>
              <SelectField label="Civil Status" name="civil_status" options={["Single","Married","Widowed","Separated","Others"]} placeholder="Select" value={form.civil_status} error={errors.civil_status} onChange={handleChange} fieldRef={setRef("civil_status")} required />
              <SelectField label="Sex" name="sex" options={["Female","Male"]} placeholder="Select" value={form.sex} error={errors.sex} onChange={handleChange} fieldRef={setRef("sex")} required />
              <SelectField label="Blood Type" name="blood_type" options={["A","B","AB","O","A+","B+","AB+","O+","A-","B-","AB-","O-"]} placeholder="Select" value={form.blood_type} error={errors.blood_type} onChange={handleChange} fieldRef={setRef("blood_type")} />
              <SelectField label="Citizenship" name="citizenship" options={["Filipino","American","Canadian","Japanese","Korean","Chinese","Australian","Others"]} placeholder="Select" value={form.citizenship} error={errors.citizenship} onChange={handleChange} fieldRef={setRef("citizenship")} />
            </div>
          </Section>

          <Section title="Birthdate & Age" icon={<Star size={14}/>}>
            <div className="reg-g4" style={g4}>
              <Field label="Birthdate" name="birthdate" type="date" value={form.birthdate} error={errors.birthdate} onChange={handleChange} fieldRef={setRef("birthdate")} required />
              <Field label="Birthplace" name="birthplace" value={form.birthplace} error={errors.birthplace} onChange={handleChange} fieldRef={setRef("birthplace")} />
              <Computed label="Age" value={form.age} />
              <Computed label="Age Group" value={form.age_group} />
            </div>
          </Section>

          <Section title="Family Background" icon={<Heart size={14}/>}>
            <div className="reg-g2" style={g2}>
              <Field label="Father's Name" name="father" value={form.father} error={errors.father} onChange={handleChange} fieldRef={setRef("father")} />
              <Field label="Mother's Name" name="mother" value={form.mother} error={errors.mother} onChange={handleChange} fieldRef={setRef("mother")} />
            </div>
          </Section>

          {form.civil_status === "Married" && (
            <Section title="Marriage Information" icon={<Users size={14}/>}>
              <div className="reg-g4" style={g4}>
                <Field label="Spouse Name" name="spouse" value={form.spouse} error={errors.spouse} onChange={handleChange} fieldRef={setRef("spouse")} />
                <SelectField label="Spouse Citizenship" name="spouse_citizenship" options={["Filipino","American","Canadian","Japanese","Korean","Chinese","Australian","Others"]} placeholder="Select" value={form.spouse_citizenship} error={errors.spouse_citizenship} onChange={handleChange} fieldRef={setRef("spouse_citizenship")} />
                <Field label="Wedding Date" name="wedding_date" type="date" value={form.wedding_date} error={errors.wedding_date} onChange={handleChange} fieldRef={setRef("wedding_date")} />
                <Computed label="Years Married" value={form.years_married !== "" ? `${form.years_married} yrs` : ""} />
              </div>
            </Section>
          )}

          <Section title="Address & Contact" icon={<MapPin size={14}/>}>
            <div className="reg-g3" style={{ ...g3, marginBottom:20 }}>
              <Field label="Home Address" name="home_address" value={form.home_address} error={errors.home_address} onChange={handleChange} fieldRef={setRef("home_address")} />
              <Computed label="Zone" value={form.zone} />
              <Field label="Office Address" name="office_address" value={form.office_address} error={errors.office_address} onChange={handleChange} fieldRef={setRef("office_address")} />
            </div>
            <div className="reg-g4" style={g4}>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={labelStyle}>Mobile No.</label>
                <div style={{ display:"flex", borderRadius:10, border:"1.5px solid #dde3f0", overflow:"hidden", background:"#fff" }}>
                  <span style={{ padding:"10px 12px", background:"#f0f4ff", borderRight:"1.5px solid #dde3f0", fontSize:13, fontWeight:700, color:"#4a5678", userSelect:"none" }}>+63</span>
                  <input name="mobile_num" value={form.mobile_num} onChange={handleChange} placeholder="9XX XXX XXXX"
                    style={{ flex:1, padding:"10px 12px", border:"none", background:"transparent", fontSize:14, color:"#1e2d5a", outline:"none" }} />
                </div>
              </div>
              <Field label="Home Contact" name="home_contact" value={form.home_contact} error={errors.home_contact} onChange={handleChange} fieldRef={setRef("home_contact")} />
              <Field label="Office Contact" name="office_contact" value={form.office_contact} error={errors.office_contact} onChange={handleChange} fieldRef={setRef("office_contact")} />
              <Field label="Email Address" name="email" type="email" value={form.email} error={errors.email} onChange={handleChange} fieldRef={setRef("email")} />
            </div>
          </Section>

          <Section title="Fellowship" icon={<Church size={14}/>}>
            <div className="reg-g2" style={g2}>
              <SelectField label="Fellowship" name="fellowship" options={["Bosque","Cabili","City Church","Dalipuga","Digkilaan","Luinab","Pugaan","Saray","Suarez","Tambacan","Tipanoy"]} placeholder="Select your fellowship" value={form.fellowship} error={errors.fellowship} onChange={handleChange} fieldRef={setRef("fellowship")} />
            </div>
          </Section>

          <Section title="Education & Work" icon={<GraduationCap size={14}/>}>
            <div className="reg-g4" style={g4}>
              <SelectField label="Education" name="education" options={["High School","College","Bachelor","Master","Doctorate","Others"]} placeholder="Select" value={form.education} error={errors.education} onChange={handleChange} fieldRef={setRef("education")} />
              <Field label="School / University" name="school" value={form.school} error={errors.school} onChange={handleChange} fieldRef={setRef("school")} />
              <Field label="Year Graduated" name="year_graduated" value={form.year_graduated} error={errors.year_graduated} onChange={handleChange} fieldRef={setRef("year_graduated")} />
              <SelectField label="Occupation" name="occupation" options={["Education / Academic","Healthcare / Medical","Engineering / Technical","Government Service","Business / Entrepreneur","Private Employee / Corporate","Skilled Trades / Manual Work","Service Industry","Religious / Ministry Work","OFW / Seafarer","Self-Employed / Freelance","Student","Retired","Unemployed / Housewife / Househusband","Other"]} placeholder="Select" value={form.occupation} error={errors.occupation} onChange={handleChange} fieldRef={setRef("occupation")} />
            </div>
          </Section>

          <Section title="Baptism" icon={<Church size={14}/>}>
            <div className="reg-g3" style={g3}>
              <Field label="Place of Baptism" name="baptism_place" value={form.baptism_place} error={errors.baptism_place} onChange={handleChange} fieldRef={setRef("baptism_place")} />
              <Field label="Baptism Date" name="baptism_date" type="date" value={form.baptism_date} error={errors.baptism_date} onChange={handleChange} fieldRef={setRef("baptism_date")} />
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={labelStyle}>Officiating Minister</label>
                <input list="ministers-reg" name="officiating_minister" value={form.officiating_minister} onChange={handleChange}
                  placeholder="Select or type..." style={getInputStyle(false)} />
                <datalist id="ministers-reg">
                  {MINISTERS.map(m => <option key={m} value={m} />)}
                </datalist>
              </div>
            </div>
          </Section>

          <Section title="Children" icon={<Baby size={14}/>}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <span style={{ fontSize:13, color:"#9aa3bc" }}>Add your children's information</span>
              <button onClick={addChild} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:"1.5px dashed #b0bbd4", background:"transparent", color:"#7b88a8", fontSize:13, cursor:"pointer" }}>
                + Add Child
              </button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {form.children.map((c: Child, i: number) => (
                <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, padding:20, borderRadius:12, border:"1.5px solid #dde3f0", background:"#f5f7fc", position:"relative" }}>
                  <button onClick={() => removeChild(i)} style={{ position:"absolute", top:12, right:12, width:24, height:24, borderRadius:"50%", border:"1px solid #dde3f0", background:"#e8edf8", color:"#7b88a8", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <label style={labelStyle}>Child {i+1} Name</label>
                    <input value={c.name} onChange={e => updateChild(i,"name",e.target.value)} placeholder="Full name" style={getInputStyle(false)} />
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <label style={labelStyle}>Birthdate</label>
                    <input type="date" value={c.birthdate??""} onChange={e => updateChild(i,"birthdate",e.target.value)} style={getInputStyle(false)} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Interests & Skills" icon={<Star size={14}/>}>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {["Music & Worship","Ministry","Teaching & Leadership"].map(item => (
                <button key={item} onClick={() => toggleSkill(item)} style={{ padding:"7px 16px", borderRadius:100, fontSize:13, cursor:"pointer", transition:"all 0.15s", background:form.interest_skills.includes(item)?"linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)":"#fff", border:`1.5px solid ${form.interest_skills.includes(item)?"#4f46e5":"#dde3f0"}`, color:form.interest_skills.includes(item)?"#fff":"#4a5678", boxShadow:form.interest_skills.includes(item)?"0 2px 8px rgba(79,70,229,0.2)":"none" }}>
                  {item}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Church Involvement" icon={<BookOpen size={14}/>}>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {["CWA","CYF","CYAF","Chancel","Choristers","UCM","Church Council","Teacher","Staff","Others"].map(item => (
                <button key={item} onClick={() => toggleChurch(item)} style={{ padding:"7px 16px", borderRadius:100, fontSize:13, cursor:"pointer", transition:"all 0.15s", background:form.church_involvement.includes(item)?"linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)":"#fff", border:`1.5px solid ${form.church_involvement.includes(item)?"#4f46e5":"#dde3f0"}`, color:form.church_involvement.includes(item)?"#fff":"#4a5678", boxShadow:form.church_involvement.includes(item)?"0 2px 8px rgba(79,70,229,0.2)":"none" }}>
                  {item}
                </button>
              ))}
            </div>
          </Section>

          <button onClick={handleSubmit} disabled={loading} style={{ width:"100%", padding:16, borderRadius:12, border:"none", background:"linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", color:"#fff", fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?0.6:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 20px rgba(79,70,229,0.3)", transition:"opacity 0.15s, box-shadow 0.15s" }}>
            {loading
              ? <><div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} /> Submitting…</>
              : <><Send size={17}/> Submit Application</>
            }
          </button>

        </div>
      </div>
    </>
  );
}