"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#eef2f9", padding: 24, fontFamily: "system-ui, sans-serif" }}>
          <div style={{ maxWidth: 440, textAlign: "center" }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1e2d5a", margin: "0 0 8px" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: "#7b88a8", lineHeight: 1.5, margin: "0 0 24px" }}>
              {error.message || "A critical error occurred. Please try again."}
            </p>
            <button
              onClick={reset}
              style={{
                padding: "10px 24px", borderRadius: 10, border: "none",
                background: "#3b5bdb", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
