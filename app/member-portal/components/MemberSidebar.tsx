"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { User, Pencil, LogOut, X } from "lucide-react";

export default function MemberSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [memberName, setMemberName] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || "");
      const { data } = await supabase
        .from("members")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setMemberName(`${data.first_name} ${data.last_name}`);
    })();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/");
  };

  const nav = [
    { name: "My Profile", href: "/member-portal", icon: User },
    { name: "Edit Profile", href: "/member-portal/edit", icon: Pencil },
  ];

  return (
    <>
      {showLogoutModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(30,45,90,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #dde3f0",
              borderRadius: 18,
              padding: "32px 28px 28px",
              width: "100%", maxWidth: 360, textAlign: "center",
              boxShadow: "0 12px 48px rgba(30,45,90,0.14)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "#fff5f5",
              border: "1px solid rgba(239,68,68,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px", color: "#dc2626",
            }}>
              <LogOut size={22} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e2d5a", margin: "0 0 8px" }}>
              Sign Out
            </h2>
            <p style={{ fontSize: 13.5, color: "#7b88a8", margin: "0 0 24px", lineHeight: 1.5 }}>
              Are you sure you want to sign out?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1, padding: 11, borderRadius: 10,
                  border: "1.5px solid #dde3f0", background: "#f5f7fc",
                  fontSize: 13.5, fontWeight: 600, color: "#4a5678", cursor: "pointer",
                }}
              >
                Stay
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                style={{
                  flex: 1, padding: 11, borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                  fontSize: 13.5, fontWeight: 600, color: "#fff",
                  cursor: loggingOut ? "not-allowed" : "pointer",
                  opacity: loggingOut ? 0.6 : 1,
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 6,
                  boxShadow: "0 2px 10px rgba(79,70,229,0.28)",
                }}
              >
                {loggingOut ? (
                  <>
                    <div style={{
                      width: 13, height: 13,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff", borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                    }} />
                    Signing out…
                  </>
                ) : "Yes, Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      <aside style={{
        width: 272,
        flexShrink: 0,
        background: "linear-gradient(180deg, #f0f4ff 0%, #e8edf8 100%)",
        borderRight: "1px solid #dde3f0",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}>
        {/* Top */}
        <div style={{
          padding: "28px 24px 20px",
          borderBottom: "1px solid #dde3f0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 11,
              background: "#fff",
              border: "1px solid rgba(99,102,241,0.2)",
              boxShadow: "0 1px 6px rgba(30,45,90,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Image src="/uccp-logo.png" alt="UCCP" width={24} height={24} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1e2d5a", margin: 0, lineHeight: 1.3 }}>
                UCCP ILIGAN
              </p>
              <p style={{ fontSize: 11, color: "#7b88a8", margin: 0, fontWeight: 500 }}>
                Member Portal
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 14px" }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#9aa3bc",
            margin: "0 0 10px", padding: "0 8px",
          }}>
            My Account
          </p>
          <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {nav.map(({ name, href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, textDecoration: "none",
                  background: active ? "#fff" : "transparent",
                  color: active ? "#3730a3" : "#4a5678",
                  fontSize: 13.5, fontWeight: active ? 700 : 500,
                  transition: "all 0.15s",
                  border: active ? "1px solid rgba(99,102,241,0.18)" : "1px solid transparent",
                  boxShadow: active ? "0 1px 6px rgba(30,45,90,0.08)" : "none",
                }}>
                  <Icon size={16} strokeWidth={2} />
                  {name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px",
          borderTop: "1px solid #dde3f0",
          background: "rgba(255,255,255,0.6)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", marginBottom: 4,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "#e8edf8",
              border: "1px solid #dde3f0",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <User size={16} color="#4a5678" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 700, color: "#1e2d5a",
                margin: 0, lineHeight: 1.3,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {memberName || "Member"}
              </p>
              <p style={{
                fontSize: 11, color: "#9aa3bc", margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {userEmail}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "9px 12px", borderRadius: 8,
              border: "1px solid transparent", background: "transparent",
              color: "#9aa3bc", fontSize: 13, fontWeight: 500,
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "#fff5f5";
              (e.currentTarget as HTMLButtonElement).style.color = "#dc2626";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.18)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#9aa3bc";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
            }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}