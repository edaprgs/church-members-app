import React from "react";

export const inputStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10,
  border: "1.5px solid #dde3f0",
  background: "#f9faff", fontSize: 14,
  color: "#1e2d5a", outline: "none",
  transition: "border-color 0.15s",
  width: "100%", boxSizing: "border-box",
};

export const labelStyle: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 600, color: "#4b5280",
  letterSpacing: "0.05em", textTransform: "uppercase",
};

export const computedStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10,
  background: "#f0f4ff", border: "1.5px solid #dde3f0",
  fontSize: 14, color: "#7b88a8",
  minHeight: 42, display: "flex", alignItems: "center",
};

export function Field({ label, name, type = "text", placeholder, form, handleChange, handleBlur }: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  form: Record<string, unknown>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type} name={name}
        value={(form[name] as string | number | undefined) ?? ""}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

export function SelectField({ label, name, options, placeholder, form, handleChange }: {
  label: string;
  name: string;
  options: string[];
  placeholder?: string;
  form: Record<string, unknown>;
  handleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <select
        name={name}
        value={(form[name] as string | number | undefined) ?? ""}
        onChange={handleChange}
        style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function Computed({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={labelStyle}>
        {label}{" "}
        <span style={{ fontSize: 10, color: "#9aa3bc", textTransform: "none", fontWeight: 400 }}>(auto)</span>
      </label>
      <div style={computedStyle}>{value || "—"}</div>
    </div>
  );
}

export function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #dde3f0", marginBottom: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(30,45,90,0.05)" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f3fa", background: "linear-gradient(135deg,#f0f4ff 0%,#f5f7fc 100%)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#4f46e5 0%,#6366f1 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(79,70,229,0.25)", flexShrink: 0 }}>
          <Icon size={15} color="#fff" />
        </div>
        <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#3730a3", margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}