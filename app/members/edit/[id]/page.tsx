// app/members/edit/[id]/page.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { getZone, getAge, getAgeGroup, getYearsMarried, titleCase } from "@/app/lib/utils";
import type { Child, FormState } from "@/app/lib/types";
import {
  EMPTY_FORM, REQUIRED_FIELDS, CAPITALIZE_FIELDS,
  MEMBERSHIP_TYPES, MEMBER_STATUSES, SUFFIX,
  CIVIL_STATUS, SEX, BLOOD_TYPE, CITIZENSHIP,
  HIGHEST_EDUCATION, OCCUPATION, INTEREST_SKILLS, CHURCH_INVOLVEMENT,
} from "@/app/lib/constants";
import Toast, { defaultToast, useToast, type ToastState } from "@/app/components/ui/Toast";
import { useSettings } from "@/app/lib/api/members";

import {
  ArrowLeft, Plus, User, Church, BookOpen,
  Home, Phone, GraduationCap, Heart, Baby, Star, Save, Link2Off, ExternalLink,
} from "lucide-react";


export default function EditMemberPage() {
  const params = useParams();
  const router = useRouter();
  const id     = params.id as string;

  const [form,     setForm]     = useState<FormState>({ ...EMPTY_FORM });
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  const { settings } = useSettings();

  const fellowships =
  settings?.fellowships?.length
    ? settings.fellowships
    : [];

  const ministers = settings?.ministers ?? [];

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<ToastState>(defaultToast);
  const showToast = useToast(setToast);

  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  // ── Fetch member ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      setFetching(true);
      const { data, error } = await supabase
        .from("members").select("*").eq("id", id).single();
      setFetching(false);

      if (error) {
        showToast("error", "Failed to Load", error.message);
        return;
      }

      setForm({
        ...EMPTY_FORM,
        ...data,
        // Ensure controlled inputs never receive null
        status:           data.status           ?? "",
        fellowship:       data.fellowship       ?? "",
        membership_type:  data.membership_type  ?? "",
        civil_status:     data.civil_status     ?? "",
        sex:              data.sex              ?? "",
        blood_type:       data.blood_type       ?? "",
        citizenship:      data.citizenship      ?? "",
        suffix:           data.suffix           ?? "",
        education:        data.education        ?? "",
        occupation:       data.occupation       ?? "",
        children: data.children?.length > 0
          ? data.children.map((c: Child) => ({ name: c.name ?? "", birthdate: c.birthdate ?? "" }))
          : [{ name: "", birthdate: "" }],
        interest_skills:    data.interest_skills    ?? [],
        church_involvement: data.church_involvement ?? [],
      });
    })();
  }, [id]);

  // ── Auto-compute age & age group ──────────────────────────────────────────
  useEffect(() => {
    if (!form.birthdate) { setForm(p => ({ ...p, age: "", age_group: "" })); return; }
    const age      = getAge(form.birthdate);
    const ageGroup = getAgeGroup(age);
    setForm(p => ({ ...p, age, age_group: ageGroup }));
  }, [form.birthdate]);

  // ── Auto-compute years married ────────────────────────────────────────────
  useEffect(() => {
    if (!form.wedding_date) { setForm(p => ({ ...p, years_married: "" })); return; }
    setForm(p => ({ ...p, years_married: getYearsMarried(form.wedding_date!) }));
  }, [form.wedding_date]);

  // ── Auto-compute zone ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!form.home_address) { setForm(p => ({ ...p, zone: "" })); return; }
    setForm(p => ({ ...p, zone: getZone(form.home_address!) }));
  }, [form.home_address]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "mobile_num") {
      setForm(p => ({ ...p, mobile_num: value.replace(/\D/g, "").slice(0, 10) }));
      return;
    }
    const formatted = CAPITALIZE_FIELDS.includes(name)
      ? titleCase(value)
      : value;
    setForm(p => ({ ...p, [name]: formatted }));
    if (errors[name]) setErrors(p => { const n = { ...p }; delete n[name]; return n; });
  };

  // ── Children ──────────────────────────────────────────────────────────────
  const addChild    = () => setForm(p => ({ ...p, children: [...p.children, { name: "", birthdate: "" }] }));
  const removeChild = (i: number) => setForm(p => ({ ...p, children: p.children.filter((_, idx) => idx !== i) }));
  const updateChild = (i: number, field: keyof Child, value: string) =>
    setForm(p => {
      const updated = [...p.children];
      updated[i] = { ...updated[i], [field]: field === "name" ? titleCase(value) : value };
      return { ...p, children: updated };
    });

  // ── Tag toggles ───────────────────────────────────────────────────────────
  const toggleSkills = (v: string) =>
    setForm(p => ({
      ...p,
      interest_skills: p.interest_skills.includes(v)
        ? p.interest_skills.filter(x => x !== v)
        : [...p.interest_skills, v],
    }));

  const toggleChurch = (v: string) =>
    setForm(p => ({
      ...p,
      church_involvement: p.church_involvement.includes(v)
        ? p.church_involvement.filter(x => x !== v)
        : [...p.church_involvement, v],
    }));

  // ── Submit ────────────────────────────────────────────────────────────────
  const updateMember = async () => {
    const newErrors: Record<string, string> = {};
    REQUIRED_FIELDS.forEach(f => { if (!form[f as keyof FormState]) newErrors[f] = "This field is required"; });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const first = Object.keys(newErrors)[0];
      fieldRefs.current[first]?.scrollIntoView({ behavior: "smooth", block: "center" });
      fieldRefs.current[first]?.focus();
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const payload = {
        ...form,
        user_id:              form.user_id              || null,
        birthdate:            form.birthdate            || null,
        wedding_date:         form.wedding_date         || null,
        baptism_date:         form.baptism_date         || null,
        date_of_decease:      form.date_of_decease      || null,
        age:                  form.age                  || null,
        years_married:        form.years_married        || null,
        middle_name:          form.middle_name          || null,
        suffix:               form.suffix               || null,
        blood_type:           form.blood_type           || null,
        birthplace:           form.birthplace           || null,
        father:               form.father               || null,
        mother:               form.mother               || null,
        home_address:         form.home_address         || null,
        office_address:       form.office_address       || null,
        email:                form.email                || null,
        education:            form.education            || null,
        school:               form.school               || null,
        year_graduated:       form.year_graduated       || null,
        occupation:           form.occupation           || null,
        baptism_place:        form.baptism_place        || null,
        officiating_minister: form.officiating_minister || null,
        spouse:               form.spouse               || null,
        spouse_citizenship:   form.spouse_citizenship   || null,
        children: form.children.map(c => ({ ...c, birthdate: c.birthdate || null })),
        updated_at: new Date(),
      };

      const res = await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Update failed." }));
        showToast("error", "Update Failed", error);
        return;
      }

      showToast("success", "Member Updated", "Record updated successfully.");
      setTimeout(() => router.push("/members"), 1400);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (fetching) return (
    <div className="reg-root">
      <div className="reg-header">
        <div className="reg-header-inner">
          <div style={{ height: 13, width: 100, background: "rgba(255,255,255,0.1)", borderRadius: 8, marginBottom: 28 }} />
          <div style={{ height: 32, width: 260, background: "rgba(255,255,255,0.1)", borderRadius: 10, marginBottom: 12 }} />
          <div style={{ height: 14, width: 200, background: "rgba(255,255,255,0.07)", borderRadius: 8 }} />
        </div>
      </div>
      <div className="reg-body">
        {[180, 240, 140].map((h, i) => (
          <div key={i} className="reg-section" style={{ height: h, marginBottom: 20, animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>

      {showUnlinkModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}
          onClick={() => setShowUnlinkModal(false)}
        >
          <div style={{
            background: "#fff", borderRadius: 18, padding: "32px 28px 28px",
            width: "100%", maxWidth: 360, textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "#fef2f2",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px", color: "#c0392b",
            }}>
              <Link2Off size={22} />      {/* ← makes sense for unlink */}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a1714", margin: "0 0 8px" }}>
              Unlink Account
            </h2>
            <p style={{ fontSize: 13.5, color: "#8c8480", margin: "0 0 24px", lineHeight: 1.5 }}>
              This member will lose access to the member portal. You can re-link them later via the dashboard.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowUnlinkModal(false)}
                style={{
                  flex: 1, padding: 11, borderRadius: 10,
                  border: "1.5px solid #e2ddd8", background: "#fdfcfb",
                  fontSize: 13.5, fontWeight: 600, color: "#5a5450", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setForm(p => ({ ...p, user_id: "" }));
                  setShowUnlinkModal(false);
                  showToast("success", "Account Unlinked", "Click Update Member Record to save.");
                }}
                style={{
                  flex: 1, padding: 11, borderRadius: 10,
                  border: "none", background: "#c0392b",
                  fontSize: 13.5, fontWeight: 600, color: "#fff", cursor: "pointer",
                }}
              >
                Yes, Unlink
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast {...toast} onClose={() => setToast(p => ({ ...p, show: false }))} />

      <div className="reg-root">

        {/* HEADER */}
        <div className="reg-header">
          <div className="reg-header-inner">
            <button className="reg-back" onClick={() => router.push("/members")}>
              <ArrowLeft size={14} /> Back to Members
            </button>
            <h1 className="reg-title">Edit Member Information</h1>
            <p className="reg-subtitle">Update member records for church files</p>
          </div>
        </div>

        {/* BODY */}
        <div className="reg-body">

          {/* CHURCH RECORDS */}
          <RegSection title="Church Records" icon={<Church size={15} />}>
            
            {/* TOP INPUT GRID */}
            <div className="reg-grid-4">
              <Field
                label="Red Book No."
                name="red_book_no"
                placeholder="XXXX"
                form={form}
                handleChange={handleChange}
                errors={errors}
                fieldRefs={fieldRefs}
                required
              />

              <SelectField
                label="Fellowship"
                name="fellowship"
                placeholder="Select fellowship"
                options={settings?.fellowships ?? []}
                form={form}
                handleChange={handleChange}
                errors={errors}
                fieldRefs={fieldRefs}
                required
              />

              <SelectField
                label="Membership Type"
                name="membership_type"
                placeholder="Select type"
                options={MEMBERSHIP_TYPES}
                form={form}
                handleChange={handleChange}
                errors={errors}
                fieldRefs={fieldRefs}
                required
              />

              <SelectField
                label="Status"
                name="status"
                placeholder="Select status"
                options={MEMBER_STATUSES}
                form={form}
                handleChange={handleChange}
                errors={errors}
                fieldRefs={fieldRefs}
                required
              />
            </div>

            {/* LINKED ACCOUNT (FULL WIDTH BLOCK) */}
            <div style={{ marginTop: 16 }}>
              <label className="reg-label" style={{ marginBottom: 8, display: "block" }}>
                Linked Account{" "}
                <span style={{ fontSize: 10, color: "#a09890", fontWeight: 400 }}>
                  (managed via dashboard)
                </span>
              </label>

              {(form as any).user_id ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #bbf7d0",
                    background: "#f0fdf4",
                  }}
                >
                  {/* LEFT STATUS */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: "#16a34a",
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>
                      Account linked
                    </span>
                  </div>

                  {/* RIGHT ACTION */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        fontFamily: "monospace",
                        maxWidth: 160,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {(form as any).user_id}
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowUnlinkModal(true)}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#dc2626",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: 8,
                        padding: "5px 10px",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      Unlink
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #e2ddd8",
                    background: "#faf9f7",
                  }}
                >
                  {/* LEFT */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: "#d1d5db",
                      }}
                    />
                    <span style={{ fontSize: 13, color: "#a09890" }}>
                      No account linked
                    </span>
                  </div>

                  {/* RIGHT BUTTON */}
                  <a
                    href="/members/dashboard"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#1a4f7a",
                      background: "#e8f1f9",
                      border: "1px solid #c5daf0",
                      borderRadius: 8,
                      padding: "5px 10px",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <ExternalLink size={14} />
                    Link via Dashboard
                  </a>
                </div>
              )}
            </div>
          </RegSection>

          {/* DECEASED BANNER */}
          {form.status === "Deceased" && (
            <div className="reg-deceased-banner">
              <div className="reg-deceased-dot" />
              <div className="reg-deceased-body">
                <div className="reg-deceased-label">Deceased Information</div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div className="reg-field" style={{ flex: 1 }}>
                    <label className="reg-label" style={{ color: "rgba(255,255,255,0.4)" }}>Date of Decease</label>
                    <input
                      type="date" name="date_of_decease" value={form.date_of_decease ?? ""} onChange={handleChange}
                      className="reg-input"
                      style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.12)", color: "#fff", colorScheme: "dark" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BASIC INFORMATION */}
          <RegSection title="Basic Information" icon={<User size={15} />}>
            <div className="reg-grid-4">
              <Field label="First Name"  name="first_name"  form={form} handleChange={handleChange} errors={errors} fieldRefs={fieldRefs} required />
              <Field label="Middle Name" name="middle_name" form={form} handleChange={handleChange} />
              <Field label="Last Name"   name="last_name"   form={form} handleChange={handleChange} errors={errors} fieldRefs={fieldRefs} required />
              <SelectField label="Suffix" name="suffix" placeholder="None" options={SUFFIX} form={form} handleChange={handleChange} />
            </div>
            <div className="reg-divider" style={{ margin: "20px 0" }} />
            <div className="reg-grid-4">
              <SelectField label="Civil Status" name="civil_status" placeholder="Select" options={CIVIL_STATUS} form={form} handleChange={handleChange} errors={errors} fieldRefs={fieldRefs} required />
              <SelectField label="Sex"          name="sex"          placeholder="Select" options={SEX}          form={form} handleChange={handleChange} errors={errors} fieldRefs={fieldRefs} required />
              <SelectField label="Blood Type"   name="blood_type"   placeholder="Select" options={BLOOD_TYPE}   form={form} handleChange={handleChange} />
              <SelectField label="Citizenship"  name="citizenship"  placeholder="Select" options={CITIZENSHIP}  form={form} handleChange={handleChange} />
            </div>
          </RegSection>

          {/* MARRIAGE (conditional) */}
          {form.civil_status === "Married" && (
            <RegSection title="Marriage Information" icon={<Heart size={15} />}>
              <div className="reg-grid-4">
                <Field label="Spouse Name" name="spouse" form={form} handleChange={handleChange} />
                <SelectField label="Spouse Citizenship" name="spouse_citizenship" placeholder="Select"
                  options={["Filipino","American","Canadian","Japanese","Korean","Chinese","Australian","Others"]}
                  form={form} handleChange={handleChange} />
                <Field label="Wedding Date" type="date" name="wedding_date" form={form} handleChange={handleChange} />
                <div className="reg-field">
                  <label className="reg-label">Years Married <span className="auto-tag">(auto)</span></label>
                  <div className="reg-computed">
                    {form.years_married !== "" ? `${form.years_married} yr${form.years_married !== 1 ? "s" : ""}` : "—"}
                  </div>
                </div>
              </div>
            </RegSection>
          )}

          {/* BIRTHDATE & AGE */}
          <RegSection title="Birthdate & Age" icon={<Star size={15} />}>
            <div className="reg-grid-4">
              <Field label="Birthdate"  type="date" name="birthdate"  form={form} handleChange={handleChange} />
              <Field label="Birthplace"             name="birthplace" form={form} handleChange={handleChange} />
              <div className="reg-field">
                <label className="reg-label">Age <span className="auto-tag">(auto)</span></label>
                <div className="reg-computed">{form.age || "—"}</div>
              </div>
              <div className="reg-field">
                <label className="reg-label">Age Group <span className="auto-tag">(auto)</span></label>
                <div className="reg-computed">{form.age_group || "—"}</div>
              </div>
            </div>
          </RegSection>

          {/* FAMILY BACKGROUND */}
          <RegSection title="Family Background" icon={<User size={15} />}>
            <div className="reg-grid-2">
              <Field label="Father's Name" name="father" form={form} handleChange={handleChange} />
              <Field label="Mother's Name" name="mother" form={form} handleChange={handleChange} />
            </div>
          </RegSection>

          {/* ADDRESS */}
          <RegSection title="Address" icon={<Home size={15} />}>
            <div className="reg-grid-3">
              <Field label="Home Address"   name="home_address"   form={form} handleChange={handleChange} />
              <div className="reg-field">
                <label className="reg-label">Zone <span className="auto-tag">(auto)</span></label>
                <div className="reg-computed">{form.zone || "—"}</div>
              </div>
              <Field label="Office Address" name="office_address" form={form} handleChange={handleChange} />
            </div>
          </RegSection>

          {/* CONTACT */}
          <RegSection title="Contact Details" icon={<Phone size={15} />}>
            <div className="reg-grid-4">
              <div className="reg-field">
                <label className="reg-label">Mobile No.</label>
                <div className="reg-phone-wrap">
                  <span className="reg-phone-prefix">+63</span>
                  <input
                    className="reg-phone-input" name="mobile_num" placeholder="9XX XXX XXXX"
                    value={form.mobile_num || ""} onChange={handleChange}
                  />
                </div>
              </div>
              <Field label="Home Contact No."   name="home_contact"   form={form} handleChange={handleChange} />
              <Field label="Office Contact No." name="office_contact" form={form} handleChange={handleChange} />
              <Field label="Email Address"      name="email" type="email" form={form} handleChange={handleChange} />
            </div>
          </RegSection>

          {/* BAPTISM */}
          <RegSection title="Baptism" icon={<Church size={15} />}>
            <div className="reg-grid-3">
              <Field label="Place of Baptism / Church" name="baptism_place" form={form} handleChange={handleChange} />
              <Field label="Baptism Date" type="date"  name="baptism_date"  form={form} handleChange={handleChange} />
              <div className="reg-field">
                <label className="reg-label">Officiating Minister</label>
                <input
                  list="ministers-edit" name="officiating_minister" placeholder="Select or type..."
                  value={form.officiating_minister || ""} onChange={handleChange}
                  className="reg-datalist"
                />
                <datalist id="ministers-edit">
                  {(settings?.ministers ?? []).map(m => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
            </div>
          </RegSection>

          {/* EDUCATION & WORK */}
          <RegSection title="Education & Work" icon={<GraduationCap size={15} />}>
            <div className="reg-grid-4">
              <SelectField label="Highest Education"  name="education"      placeholder="Select" options={HIGHEST_EDUCATION} form={form} handleChange={handleChange} />
              <Field       label="School / University" name="school"         form={form} handleChange={handleChange} />
              <Field       label="Year Graduated"      name="year_graduated" form={form} handleChange={handleChange} />
              <SelectField label="Occupation"          name="occupation"     placeholder="Select" options={OCCUPATION} form={form} handleChange={handleChange} />
            </div>
          </RegSection>

          {/* CHILDREN */}
          <RegSection title="Children" icon={<Baby size={15} />}>
            <div className="reg-children-header">
              <span className="reg-children-hint">Update children&apos;s records</span>
              <button className="reg-add-child" onClick={addChild} type="button">
                <Plus size={14} /> Add Child
              </button>
            </div>
            <div className="reg-children-list">
              {form.children.length === 0 && (
                <p style={{ fontSize: 13, color: "#a09890", textAlign: "center", padding: "16px 0" }}>
                  No children added yet
                </p>
              )}
              {form.children.map((c, i) => (
                <div key={i} className="reg-child-card">
                  <button className="reg-child-remove" type="button" onClick={() => removeChild(i)}>✕</button>
                  <div className="reg-field">
                    <label className="reg-label">Child {i + 1} Name</label>
                    <input value={c.name} onChange={e => updateChild(i, "name", e.target.value)}
                      className="reg-input" placeholder="Full name" />
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">Birthdate</label>
                    <input type="date" value={c.birthdate ?? ""} onChange={e => updateChild(i, "birthdate", e.target.value)}
                      className="reg-input" />
                  </div>
                </div>
              ))}
            </div>
          </RegSection>

          {/* INTERESTS & SKILLS */}
          <RegSection title="Interests & Skills" icon={<Star size={15} />}>
            <div className="reg-tags">
              {INTEREST_SKILLS.map(item => (
                <button key={item} type="button" onClick={() => toggleSkills(item)}
                  className={`reg-tag ${form.interest_skills.includes(item) ? "active" : ""}`}>
                  {item}
                </button>
              ))}
            </div>
          </RegSection>

          {/* CHURCH INVOLVEMENT */}
          <RegSection title="Church Involvement" icon={<BookOpen size={15} />}>
            <div className="reg-tags">
              {CHURCH_INVOLVEMENT.map(item => (
                <button key={item} type="button" onClick={() => toggleChurch(item)}
                  className={`reg-tag ${form.church_involvement.includes(item) ? "active" : ""}`}>
                  {item}
                </button>
              ))}
            </div>
          </RegSection>

          {/* SUBMIT */}
          <button className="reg-submit" onClick={updateMember} disabled={loading}>
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Updating Record…
              </>
            ) : (
              <><Save size={17} /> Update Member Record</>
            )}
          </button>

        </div>
      </div>
    </>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function RegSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="reg-section">
      <div className="reg-section-header">
        <div className="reg-section-icon">{icon}</div>
        <h2 className="reg-section-title">{title}</h2>
      </div>
      <div className="reg-section-body">{children}</div>
    </div>
  );
}

// ─── Text / date input field ──────────────────────────────────────────────────
function Field({
  label, name, form, handleChange, errors, fieldRefs,
  required, placeholder, type = "text", disabled,
}: {
  label?: string; name: string; form: FormState;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors?: Record<string, string>;
  fieldRefs?: React.MutableRefObject<Record<string, HTMLElement | null>>;
  required?: boolean; placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <div className="reg-field">
      {label && (
        <label className="reg-label">
          {label}{required && <span className="req">*</span>}
        </label>
      )}
      <input
        ref={el => { if (fieldRefs?.current) fieldRefs.current[name] = el; }}
        type={type} name={name}
        value={(form as Record<string, unknown>)[name] as string ?? ""}
        onChange={handleChange} placeholder={placeholder} disabled={disabled}
        className={`reg-input ${errors?.[name] ? "error" : ""}`}
      />
      {errors?.[name] && <span className="reg-error-msg">↑ {errors[name]}</span>}
    </div>
  );
}

// ─── Select field ─────────────────────────────────────────────────────────────
function SelectField({
  label, name, form, handleChange, options, placeholder, errors, fieldRefs, required,
}: {
  label?: string; name: string; form: FormState;
  handleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[]; placeholder?: string;
  errors?: Record<string, string>;
  fieldRefs?: React.MutableRefObject<Record<string, HTMLElement | null>>;
  required?: boolean;
}) {
  return (
    <div className="reg-field">
      {label && (
        <label className="reg-label">
          {label}{required && <span className="req">*</span>}
        </label>
      )}
      <select
        ref={el => { if (fieldRefs?.current) fieldRefs.current[name] = el; }}
        name={name}
        value={(form as Record<string, unknown>)[name] as string ?? ""}
        onChange={handleChange}
        className={`reg-select ${errors?.[name] ? "error" : ""}`}
      >
        <option value="" disabled>{placeholder ?? `Select ${label}`}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {errors?.[name] && <span className="reg-error-msg">↑ {errors[name]}</span>}
    </div>
  );
}