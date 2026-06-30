// app/members/components/MemberFormFields.tsx
// ─── Shared field components for the admin new/edit member forms ─────────────
// These were previously copy-pasted, byte-for-byte identical, into both
// members/new/page.tsx and members/edit/[id]/page.tsx.

import type { FormState } from "@/app/lib/types";

export function RegSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
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

export function Field({
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
        type={type} name={name} value={(form as Record<string, unknown>)[name] as string ?? ""}
        onChange={handleChange} placeholder={placeholder} disabled={disabled}
        className={`reg-input ${errors?.[name] ? "error" : ""}`}
      />
      {errors?.[name] && <span className="reg-error-msg">↑ {errors[name]}</span>}
    </div>
  );
}

export function SelectField({
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
        name={name} value={(form as Record<string, unknown>)[name] as string ?? ""}
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
