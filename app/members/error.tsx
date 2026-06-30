"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MembersError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 440, textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, margin: "0 auto 20px",
          background: "#fff5f5", border: "1px solid #fecaca",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626",
        }}>
          <AlertCircle size={26} />
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1e2d5a", margin: "0 0 8px" }}>
          This page couldn&apos;t load
        </h1>
        <p style={{ fontSize: 14, color: "#7b88a8", lineHeight: 1.5, margin: "0 0 24px" }}>
          {error.message || "An unexpected error occurred while loading this section."}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              padding: "10px 20px", borderRadius: 10, border: "1.5px solid #dde3f0",
              background: "#fff", color: "#1e2d5a", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => router.push("/members/dashboard")}
            style={{
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #3b5bdb 0%, #4f6bdf 100%)",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
