"use client";

import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/app/lib/supabase";
import { fetchMemberCount } from "@/app/lib/api/members";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, BarChart3, FileText, LogOut, Settings } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [memberCount, setMemberCount] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // ← NEW

  useEffect(() => {
    const fetchData = async () => {
      const count = await fetchMemberCount();
      setMemberCount(count);

      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || "");
    };

    fetchData();

    window.addEventListener("member-count-changed", fetchData);
    return () => window.removeEventListener("member-count-changed", fetchData);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/");
  };

  const nav = [
    { name: "Dashboard", href: "/members/dashboard", icon: LayoutDashboard },
    { name: "Members", href: "/members", icon: Users, badge: memberCount },
    { name: "Analytics", href: "/members/analytics", icon: BarChart3 },
    { name: "Reports", href: "/members/reports", icon: FileText },
    { name: "Settings",  href: "/members/settings",   icon: Settings },
  ];

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "AD";

  return (
    <>
      {/* ===== LOGOUT CONFIRMATION MODAL ===== */}
      {showLogoutModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 18, padding: "32px 28px 28px",
              width: "100%", maxWidth: 360, textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "#fef2f2",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px", color: "#c0392b",
            }}>
              <LogOut size={22} />
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a1714", margin: "0 0 8px" }}>
              Sign Out
            </h2>
            <p style={{ fontSize: 13.5, color: "#8c8480", margin: "0 0 24px", lineHeight: 1.5 }}>
              Are you sure you want to sign out? You&apos;ll need to sign in again to access your account.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1, padding: 11, borderRadius: 10,
                  border: "1.5px solid #e2ddd8", background: "#fdfcfb",
                  fontSize: 13.5, fontWeight: 600, color: "#5a5450",
                  cursor: "pointer",
                }}
              >
                Stay
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                style={{
                  flex: 1,
                  padding: 11,
                  borderRadius: 10,
                  border: "none",
                  background: "#1a2744",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: loggingOut ? "not-allowed" : "pointer",
                  opacity: loggingOut ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 2px 8px rgba(26,39,68,0.25)",
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

      <aside className="flex flex-col w-64 h-screen bg-white border-r border-gray-100 px-4 py-6">

        {/* Logo */}
        <div className="flex items-center gap-3 px-2 pb-6 mb-5 border-b border-gray-100">
          <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-[#1a2744]">
            <Image src="/uccp-logo.png" alt="UCCP Logo" width={35} height={35} loading="eager" />
          </div>
          <p className="text-[10.5px] font-semibold uppercase leading-snug tracking-wide text-gray-800">
            United Church of Christ in the Philippines
          </p>
        </div>

        {/* Nav label */}
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Main menu
        </p>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5">
          {nav.map(({ name, href, icon: Icon, badge }) => {
            const active = pathname === href || (href !== "/members" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active ? "bg-[#e8f1f9] text-[#1a4f7a] font-semibold" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-[#1a4f7a] rounded-r-full" />
                )}
                <Icon size={17} strokeWidth={2.2} className={active ? "text-[#1a4f7a]" : "text-gray-400"} />
                <span className="flex-1">{name}</span>
                {typeof badge !== "undefined" && (
                  <span className="ml-auto text-[11px] font-semibold bg-[#e8f1f9] text-[#1a4f7a] px-2 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-1">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-[#1a2744] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-800 leading-tight truncate">{userEmail || "Admin"}</p>
              <p className="text-[11px] text-gray-400 leading-tight">Administrator</p>
            </div>
          </div>

          {/* Sign out button — opens modal instead of signing out directly */}
          <button
            onClick={() => setShowLogoutModal(true)}  // ← opens modal, not direct logout
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all w-full text-left"
          >
            <LogOut size={16} strokeWidth={2.2} />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>
    </>
  );
}
