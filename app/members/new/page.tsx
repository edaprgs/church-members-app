// app/members/new/page.tsx

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft, User, Church, BookOpen,
  Home, Phone, GraduationCap, Heart, Baby, Star, CheckCircle2 } from "lucide-react";
import {
  MEMBERSHIP_TYPES, MEMBER_STATUSES, SUFFIX,
  CIVIL_STATUS, SEX, BLOOD_TYPE, CITIZENSHIP,
  HIGHEST_EDUCATION, OCCUPATION, INTEREST_SKILLS, CHURCH_INVOLVEMENT,
  REQUIRED_FIELDS, EMPTY_FORM,
} from "@/app/lib/constants";
import type { FormState } from "@/app/lib/types";
import Toast, { defaultToast, useToast, type ToastState } from "@/app/components/ui/Toast";
import { useSettings } from "@/app/lib/api/members";
import { useMemberAutoCompute, useMemberFormHandlers } from "@/app/lib/hooks/useMemberFormState";
import { sanitizeMemberPayload } from "@/app/lib/buildMemberPayload";
import { RegSection, Field, SelectField } from "@/app/members/components/MemberFormFields";


export default function NewMemberPage() {
  const router    = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const { settings } = useSettings();

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<ToastState>(defaultToast);
  const showToast = useToast(setToast);

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });

  useMemberAutoCompute(form, setForm);
  const { handleChange, addChild, removeChild, updateChild, toggleSkills, toggleChurch } =
    useMemberFormHandlers(setForm, errors, setErrors);

  // ── Submit ────────────────────────────────────────────────────────────────
  const addMember = async () => {
    // Validate required fields
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

    // Sanitise empty strings → null for optional fields
    const payload = sanitizeMemberPayload(form);

    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Save failed." }));
      showToast("error", "Save Failed", error);
      return;
    }

    showToast("success", "Member Saved", "Church member record added successfully.");
    setForm({ ...EMPTY_FORM });
    setTimeout(() => router.push("/members"), 1800);

    window.dispatchEvent(new CustomEvent("member-count-changed"));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Toast {...toast} onClose={() => setToast(p => ({ ...p, show: false }))} />

      <div className="reg-root">

        {/* HEADER */}
        <div className="reg-header">
          <div className="reg-header-inner">
            <button className="reg-back" onClick={() => router.push("/members")}>
              <ArrowLeft size={14} /> Back to Members
            </button>
            <h1 className="reg-title">Church Member Registration</h1>
            <p className="reg-subtitle">Fill in accurate member information for church records</p>
          </div>
        </div>

        {/* BODY */}
        <div className="reg-body">

          {/* CHURCH RECORDS */}
          <RegSection title="Church Records" icon={<Church size={15} />}>
            <div className="reg-grid-4">
              <Field label="Red Book No."    name="red_book_no"     placeholder="XXXX" form={form} handleChange={handleChange} errors={errors} fieldRefs={fieldRefs} required />
              <SelectField label="Fellowship"      name="fellowship"      placeholder="Select fellowship" options={settings?.fellowships ?? []}      form={form} handleChange={handleChange} errors={errors} fieldRefs={fieldRefs} required />
              <SelectField label="Membership Type" name="membership_type" placeholder="Select type"       options={MEMBERSHIP_TYPES}  form={form} handleChange={handleChange} errors={errors} fieldRefs={fieldRefs} required />
              <SelectField label="Status"          name="status"          placeholder="Select status"     options={MEMBER_STATUSES}   form={form} handleChange={handleChange} errors={errors} fieldRefs={fieldRefs} required />
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
                      type="date" name="date_of_decease" value={form.date_of_decease} onChange={handleChange}
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
                  list="ministers-new" name="officiating_minister" placeholder="Select or type..."
                  value={form.officiating_minister || ""} onChange={handleChange}
                  className="reg-datalist"
                />
                <datalist id="ministers-new">
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
              <SelectField label="Highest Education" name="education"      placeholder="Select" options={HIGHEST_EDUCATION} form={form} handleChange={handleChange} />
              <Field       label="School / University" name="school"       form={form} handleChange={handleChange} />
              <Field       label="Year Graduated"      name="year_graduated" form={form} handleChange={handleChange} />
              <SelectField label="Occupation"          name="occupation"   placeholder="Select" options={OCCUPATION} form={form} handleChange={handleChange} />
            </div>
          </RegSection>

          {/* CHILDREN */}
          <RegSection title="Children" icon={<Baby size={15} />}>
            <div className="reg-children-header">
              <span className="reg-children-hint">Add children&apos;s records</span>
              <button className="reg-add-child" onClick={addChild} type="button">
                <Plus size={14} /> Add Child
              </button>
            </div>
            <div className="reg-children-list">
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
          <button className="reg-submit" onClick={addMember} disabled={loading}>
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Saving Record…
              </>
            ) : (
              <><CheckCircle2 size={18} /> Save Member Record</>
            )}
          </button>

        </div>
      </div>
    </>
  );
}
