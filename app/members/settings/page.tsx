// app/members/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { SettingsState, ToastState } from "@/app/lib/types";
import {
  Church, Users, Save, Plus,
  KeyRound, Mail, ShieldCheck, CheckCircle2, AlertCircle, X,
} from "lucide-react";


// ─── Default settings ─────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: SettingsState = {
  church_name:    "United Church of Christ in the Philippines — Iligan City",
  church_address: "Iligan City, Lanao del Norte",
  church_email:   "",
  fellowships:    ["Bosque","Cabili","City Church","Dalipuga","Digkilaan","Luinab","Pugaan","Saray","Suarez","Tambacan","Tipanoy"],
  ministers: [],
};

// ─── Section wrapper (matches reg-section style) ──────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
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

// ─── Editable tag list (fellowships) ──────────────────────────────────
function TagList({
  items, onAdd, onRemove, placeholder,
}: {
  items: string[];
  onAdd: (v: string) => void;
  onRemove: (i: number) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    const v = draft.trim();
    if (!v || items.includes(v)) return;
    onAdd(v);
    setDraft("");
  };

  return (
    <div>
      {/* existing tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {Array.isArray(items) &&
          items.map((item, i) => (
          <div key={item} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 100,
            border: "1.5px solid #e2ddd8", background: "#fdfcfb",
            fontSize: 13, color: "#2a2420",
          }}>
            {item}
            <button type="button" onClick={() => onRemove(i)}
              style={{
                border: "none", background: "none", cursor: "pointer",
                color: "#c0b8b0", padding: 0, display: "flex",
                alignItems: "center", lineHeight: 1,
              }}>
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      {/* add new */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder={placeholder}
          className="reg-input"
          style={{ maxWidth: 240 }}
        />
        <button type="button" onClick={handleAdd}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 14px", borderRadius: 10, border: "none",
            background: "#1a2744", color: "#fff", fontSize: 13,
            fontWeight: 600, cursor: "pointer",
          }}>
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [settings, setSettings]     = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading,  setLoading]       = useState(false);
  const [fetching, setFetching]      = useState(true);

  // Password change
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,        setNewPw]        = useState("");
  const [confirmPw,    setConfirmPw]    = useState("");
  const [pwLoading,    setPwLoading]    = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastState>({ show: false, type: "success", title: "", sub: "" });

  const showToast = (type: "success" | "error", title: string, sub: string) => {
    setToast({ show: true, type, title, sub });
    setTimeout(() => setToast(p => ({ ...p, show: false })), 5000);
  };

  // ── Load settings from Supabase ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      setFetching(false);
      if (data) {
        setSettings({
          church_name: data.church_name ?? DEFAULT_SETTINGS.church_name,
          church_address: data.church_address ?? DEFAULT_SETTINGS.church_address,
          church_email: data.church_email ?? DEFAULT_SETTINGS.church_email,
          fellowships: Array.isArray(data.fellowships)
            ? data.fellowships
            : DEFAULT_SETTINGS.fellowships,

          ministers: data.ministers ?? [],
        });
      }
    })();
  }, []);

  // ── Save settings ────────────────────────────────────────────────────────
  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({ id: 1, ...settings, updated_at: new Date() });

      if (error) { showToast("error", "Save Failed", error.message); return; }
      showToast("success", "Settings Saved", "Your changes have been applied.");
    } finally {
      setLoading(false);
    }
  };

  // ── Change password ──────────────────────────────────────────────────────
  const handlePasswordChange = async () => {
    if (!newPw || !confirmPw) { showToast("error", "Missing Fields", "Please fill in all password fields."); return; }
    if (newPw.length < 6)     { showToast("error", "Too Short", "Password must be at least 6 characters."); return; }
    if (newPw !== confirmPw)  { showToast("error", "Mismatch", "New passwords do not match."); return; }

    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) { showToast("error", "Update Failed", error.message); return; }
      showToast("success", "Password Updated", "Your password has been changed successfully.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } finally {
      setPwLoading(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const set = (key: keyof SettingsState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings(p => ({ ...p, [key]: e.target.value }));

  const addFellowship    = (v: string) => setSettings(p => ({ ...p, fellowships: [...p.fellowships, v] }));
  const removeFellowship = (i: number) => setSettings(p => ({ ...p, fellowships: p.fellowships.filter((_, idx) => idx !== i) }));

  if (fetching) return (
    <div className="reg-root">
      <div className="reg-header">
        <div className="reg-header-inner">
          <div style={{ height: 13, width: 80,  background: "rgba(255,255,255,0.1)", borderRadius: 8, marginBottom: 28 }} />
          <div style={{ height: 32, width: 200, background: "rgba(255,255,255,0.1)", borderRadius: 10, marginBottom: 12 }} />
          <div style={{ height: 14, width: 160, background: "rgba(255,255,255,0.07)", borderRadius: 8 }} />
        </div>
      </div>
      <div className="reg-body">
        {[120, 200, 160].map((h, i) => (
          <div key={i} className="reg-section" style={{ height: h, marginBottom: 20, animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Toast */}
      {toast.show && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 300,
          display: "flex", alignItems: "center", gap: 12,
          background: "#fff", border: "1px solid #e8e5df",
          borderRadius: 14, padding: "14px 18px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          animation: "slideUp 0.25s ease",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: toast.type === "error" ? "#fef2f2" : "#f0fdf4",
            color:      toast.type === "error" ? "#dc2626" : "#16a34a",
          }}>
            {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          </div>
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: "#1a1714", margin: "0 0 1px" }}>{toast.title}</p>
            <p style={{ fontSize: 12, color: "#a09890", margin: 0 }}>{toast.sub}</p>
          </div>
          <button onClick={() => setToast(p => ({ ...p, show: false }))}
            style={{ border: "none", background: "none", cursor: "pointer", color: "#c0b8b0", padding: 4, marginLeft: 4 }}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className="reg-root">

        {/* HEADER */}
        <div className="reg-header">
          <div className="reg-header-inner">
            <h1 className="reg-title">Settings</h1>
            <p className="reg-subtitle">Manage church information, fellowships and account security</p>
          </div>
        </div>

        <div className="reg-body">

          {/* ── CHURCH INFORMATION ── */}
          <Section title="Church Information" icon={<Church size={15} />}>
            <div className="reg-grid-2">
              <div className="reg-field">
                <label className="reg-label">Church Name</label>
                <input className="reg-input" value={settings.church_name} onChange={set("church_name")} placeholder="Church name" />
              </div>
              <div className="reg-field">
                <label className="reg-label">Church Email</label>
                <input className="reg-input" type="email" value={settings.church_email} onChange={set("church_email")} placeholder="church@example.com" />
              </div>
            </div>
            <div className="reg-grid-1" style={{ marginTop: 16 }}>
              <div className="reg-field">
                <label className="reg-label">Church Address</label>
                <input className="reg-input" value={settings.church_address} onChange={set("church_address")} placeholder="Full address" />
              </div>
            </div>
          </Section>

          {/* ── FELLOWSHIPS ── */}
          <Section title="Fellowships" icon={<Users size={15} />}>
            <p style={{ fontSize: 12.5, color: "#a09890", marginBottom: 14 }}>
              These fellowships appear in the member registration and edit forms. Changes here will reflect immediately in new member forms — existing member records are not affected.
            </p>
            <TagList
              items={settings.fellowships}
              onAdd={addFellowship}
              onRemove={removeFellowship}
              placeholder="New fellowship name…"
            />
          </Section>

          {/* ── MINISTERS ── */}
          <Section title="Ministers / Pastors" icon={<ShieldCheck size={15} />}>
            <p style={{ fontSize: 12.5, color: "#a09890", marginBottom: 14 }}>
              Used in member baptism and church records dropdowns.
            </p>

            <TagList
              items={settings.ministers}
              onAdd={(v) => setSettings(p => ({
                ...p,
                ministers: [...p.ministers, v],
              }))}
              onRemove={(i) => setSettings(p => ({
                ...p,
                ministers: p.ministers.filter((_, idx) => idx !== i),
              }))}
              placeholder="New minister or pastor name…"
            />
          </Section>

          {/* ── ACCOUNT SECURITY ── */}
          <Section title="Account Security" icon={<ShieldCheck size={15} />}>
            <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 10, background: "#f5f3f0", border: "1px solid #e8e5df" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Mail size={14} style={{ color: "#8c8480", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#5a5450" }}>
                  Signed in as <strong style={{ color: "#1a1714" }}>Admin</strong>
                </span>
              </div>
            </div>

            <div className="reg-grid-3">
              <div className="reg-field">
                <label className="reg-label">Current Password</label>
                <input
                  className="reg-input" type="password"
                  value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="reg-field">
                <label className="reg-label">New Password</label>
                <input
                  className="reg-input" type="password"
                  value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="Min. 6 characters"
                />
              </div>
              <div className="reg-field">
                <label className="reg-label">Confirm New Password</label>
                <input
                  className="reg-input" type="password"
                  value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handlePasswordChange()}
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            <button
              onClick={handlePasswordChange}
              disabled={pwLoading}
              style={{
                marginTop: 16,
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 10,
                border: "1.5px solid #e2ddd8", background: "#fdfcfb",
                fontSize: 13, fontWeight: 600, color: "#1a2744",
                cursor: pwLoading ? "not-allowed" : "pointer",
                opacity: pwLoading ? 0.6 : 1,
                transition: "all 0.15s",
              }}>
              {pwLoading ? (
                <>
                  <div style={{ width: 13, height: 13, border: "2px solid rgba(26,39,68,0.2)", borderTopColor: "#1a2744", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Updating…
                </>
              ) : (
                <><KeyRound size={14} /> Change Password</>
              )}
            </button>
          </Section>

          {/* ── SAVE BUTTON ── */}
          <button className="reg-submit" onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Saving…
              </>
            ) : (
              <><Save size={17} /> Save Settings</>
            )}
          </button>

        </div>
      </div>
    </>
  );
}