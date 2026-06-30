"use client";

import { AlertCircle } from "lucide-react";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#eef2f9", padding: 24 }}>
      <div style={{ maxWidth: 440, textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, margin: "0 auto 20px",
          background: "#fff5f5", border: "1px solid #fecaca",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626",
        }}>
          <AlertCircle size={26} />
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1e2d5a", margin: "0 0 8px" }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 14, color: "#7b88a8", lineHeight: 1.5, margin: "0 0 24px" }}>
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          style={{
            padding: "10px 24px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #3b5bdb 0%, #4f6bdf 100%)",
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
