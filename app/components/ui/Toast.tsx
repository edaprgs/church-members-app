// app/components/ui/Toast.tsx
// ─── Success / error toast notification ──────────────────────────────────────

"use client";

import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastState = {
  show: boolean;
  type: "success" | "error";
  title: string;
  sub: string;
};

export const defaultToast: ToastState = {
  show: false,
  type: "success",
  title: "",
  sub: "",
};

type ToastProps = ToastState & {
  onClose: () => void;
};

export default function Toast({ show, type, title, sub, onClose }: ToastProps) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 300,
        display: "flex", alignItems: "center", gap: 12,
        background: "#fff", border: "1px solid #e8e5df",
        borderRadius: 14, padding: "14px 18px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        animation: "slideUp 0.25s ease",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: type === "error" ? "#fef2f2" : "#f0fdf4",
        color: type === "error" ? "#dc2626" : "#16a34a",
      }}>
        {type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      </div>

      <div>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: "#1a1714", margin: "0 0 1px" }}>{title}</p>
        <p style={{ fontSize: 12, color: "#a09890", margin: 0 }}>{sub}</p>
      </div>

      <button
        onClick={onClose}
        style={{
          padding: 4, borderRadius: 6, border: "none", background: "transparent",
          color: "#c0b8b0", cursor: "pointer", marginLeft: 4,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

/** Helper to trigger a toast with auto-dismiss after 10s */
export function useToast(setToast: React.Dispatch<React.SetStateAction<ToastState>>) {
  return (type: "success" | "error", title: string, sub: string) => {
    setToast({ show: true, type, title, sub });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 10000);
  };
}