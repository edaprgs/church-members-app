// app/dashboard/components/MemberLinkPanel.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { Link2, UserCheck, Search, X, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

type AuthUser = {
  id: string;
  email: string;
  created_at: string;
};

type UnlinkedMember = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  fellowship?: string;
  red_book_no?: string;
};

type ToastState = { show: boolean; type: "success" | "error"; message: string };

export default function MemberLinkPanel() {
  const [authUsers, setAuthUsers]         = useState<AuthUser[]>([]);
  const [members, setMembers]             = useState<UnlinkedMember[]>([]);
  const [search, setSearch]               = useState("");
  const [selectedUser, setSelectedUser]   = useState<AuthUser | null>(null);
  const [loading, setLoading]             = useState(true);
  const [linking, setLinking]             = useState(false);
  const [toast, setToast]                 = useState<ToastState>({ show: false, type: "success", message: "" });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
  };

  // ── Fetch unlinked auth users via admin API ────────────────────────────────
  // Requires service_role key — call a Next.js API route instead of calling
  // Supabase admin directly from the client.
  // See: app/api/admin/users/route.ts (generated below in comments)
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch unlinked members (no user_id set)
      const BATCH = 1000;
        let all: UnlinkedMember[] = [];
        let from = 0;

        while (true) {
          const { data, error } = await supabase
            .from("members")
            .select("id, first_name, last_name, email, fellowship, red_book_no")
            .is("user_id", null)
            .range(from, from + BATCH - 1);

          if (error) { console.error(error); break; }
          if (!data || data.length === 0) break;

          all = [...all, ...data];
          if (data.length < BATCH) break;
          from += BATCH;
        }

        setMembers(all);

      // Fetch unlinked auth users via your API route
      const res = await fetch("/api/admin/unlinked-users");
      if (res.ok) {
        const { users } = await res.json();
        setAuthUsers(users ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Link a selected auth user to a member record ───────────────────────────
  const handleLink = async (member: UnlinkedMember) => {
    if (!selectedUser) return;
    setLinking(true);
    try {
      const { error } = await supabase
        .from("members")
        .update({ user_id: selectedUser.id })
        .eq("id", member.id);

      if (error) { showToast("error", error.message); return; }

      showToast("success", `Linked ${selectedUser.email} → ${member.first_name} ${member.last_name}`);
      setSelectedUser(null);
      await fetchData(); // refresh both lists
    } finally {
      setLinking(false);
    }
  };

  // ── Auto-link by matching email ────────────────────────────────────────────
  const handleAutoLink = async () => {
    setLinking(true);
    let linked = 0;
    try {
      for (const user of authUsers) {
        const match = members.find(
          m => m.email?.toLowerCase() === user.email.toLowerCase()
        );
        if (!match) continue;
        const { error } = await supabase
          .from("members")
          .update({ user_id: user.id })
          .eq("id", match.id);
        if (!error) linked++;
      }
      showToast("success", linked > 0 ? `Auto-linked ${linked} member(s) by email` : "No matching emails found");
      await fetchData();
    } finally {
      setLinking(false);
    }
  };

  const filteredMembers = members.filter(m => {
    const q = search.toLowerCase();
    return (
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
      (m.email ?? "").toLowerCase().includes(q) ||
      (m.red_book_no ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ fontFamily: "inherit" }}>

      {/* Toast */}
      {toast.show && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 300,
          display: "flex", alignItems: "center", gap: 10,
          background: "#fff", border: "1px solid #e8e5df",
          borderRadius: 14, padding: "13px 16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          animation: "slideUp 0.25s ease",
        }}>
          <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: toast.type === "success" ? "#f0fdf4" : "#fef2f2",
            color: toast.type === "success" ? "#16a34a" : "#dc2626",
          }}>
            {toast.type === "success" ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1714", margin: 0 }}>{toast.message}</p>
          <button onClick={() => setToast(t => ({ ...t, show: false }))}
            style={{ border: "none", background: "none", cursor: "pointer", color: "#a09890", padding: 2, marginLeft: 4 }}>
            <X size={13}/>
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1a1714", margin: "0 0 3px" }}>Member Account Linking</h2>
          <p style={{ fontSize: 12.5, color: "#a09890", margin: 0 }}>
            Connect registered accounts to their member records
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchData} disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 9, border: "1.5px solid #e2ddd8",
              background: "#fdfcfb", fontSize: 13, fontWeight: 500, color: "#5a5450",
              cursor: "pointer", transition: "all 0.15s",
            }}>
            <RefreshCw size={13} style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }}/>
            Refresh
          </button>
          <button onClick={handleAutoLink} disabled={linking || loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 9, border: "none",
              background: "#1a2744", fontSize: 13, fontWeight: 600, color: "#fff",
              cursor: "pointer", opacity: (linking || loading) ? 0.6 : 1,
            }}>
            <Link2 size={13}/>
            Auto-link by Email
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* LEFT: Unlinked auth users */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8e5df", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0ede8", background: "#faf9f7" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#a09890", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              Registered Accounts ({authUsers.length})
            </p>
            <p style={{ fontSize: 11.5, color: "#c0b8b0", margin: "3px 0 0" }}>Select one to link it to a member</p>
          </div>

          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: "center", color: "#a09890", fontSize: 13 }}>Loading…</div>
            ) : authUsers.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center" }}>
                <UserCheck size={28} style={{ color: "#86efac", margin: "0 auto 8px", display: "block" }}/>
                <p style={{ fontSize: 13, color: "#a09890", margin: 0 }}>All accounts are linked</p>
              </div>
            ) : authUsers.map(user => {
              const isSelected = selectedUser?.id === user.id;
              return (
                <button key={user.id}
                  onClick={() => setSelectedUser(isSelected ? null : user)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "11px 16px", border: "none", textAlign: "left",
                    background: isSelected ? "#e8f1f9" : "transparent",
                    borderLeft: isSelected ? "3px solid #1a4f7a" : "3px solid transparent",
                    cursor: "pointer", transition: "all 0.12s",
                    borderBottom: "1px solid #f5f3f0",
                  }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: isSelected ? "#1a4f7a" : "#f0ede8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                    color: isSelected ? "#fff" : "#8c8480",
                  }}>
                    {user.email.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: isSelected ? "#1a4f7a" : "#1a1714", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.email}
                    </p>
                    <p style={{ fontSize: 11, color: "#a09890", margin: "2px 0 0" }}>
                      Registered {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  {isSelected && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#1a4f7a", background: "#c5daf0", padding: "2px 8px", borderRadius: 100 }}>
                      SELECTED
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Unlinked member records */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8e5df", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0ede8", background: "#faf9f7" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#a09890", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
              Unlinked Members ({members.length})
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #e2ddd8", borderRadius: 8, padding: "6px 10px" }}>
              <Search size={12} style={{ color: "#a09890", flexShrink: 0 }}/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, red book no."
                style={{ border: "none", outline: "none", fontSize: 12.5, color: "#1a1714", background: "transparent", width: "100%" }}/>
              {search && <button onClick={() => setSearch("")} style={{ border: "none", background: "none", cursor: "pointer", color: "#a09890", padding: 0, display: "flex" }}><X size={12}/></button>}
            </div>
          </div>

          {selectedUser && (
            <div style={{ padding: "10px 16px", background: "#fffbeb", borderBottom: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 6 }}>
              <Link2 size={12} style={{ color: "#d97706", flexShrink: 0 }}/>
              <p style={{ fontSize: 12, color: "#92400e", margin: 0 }}>
                Click a member below to link <strong>{selectedUser.email}</strong> to them
              </p>
            </div>
          )}

          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: "center", color: "#a09890", fontSize: 13 }}>Loading…</div>
            ) : filteredMembers.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center" }}>
                <UserCheck size={28} style={{ color: "#86efac", margin: "0 auto 8px", display: "block" }}/>
                <p style={{ fontSize: 13, color: "#a09890", margin: 0 }}>
                  {members.length === 0 ? "All members are linked" : "No results found"}
                </p>
              </div>
            ) : filteredMembers.map(member => (
              <div key={member.id}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderBottom: "1px solid #f5f3f0" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1714", margin: 0 }}>
                    {member.last_name}, {member.first_name}
                  </p>
                  <p style={{ fontSize: 11, color: "#a09890", margin: "2px 0 0" }}>
                    {[member.red_book_no && `#${member.red_book_no}`, member.fellowship, member.email].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {selectedUser ? (
                  <button onClick={() => handleLink(member)} disabled={linking}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "6px 12px", borderRadius: 8, border: "none",
                      background: "#1a2744", color: "#fff", fontSize: 12,
                      fontWeight: 600, cursor: "pointer", flexShrink: 0,
                      opacity: linking ? 0.6 : 1,
                    }}>
                    <Link2 size={11}/> Link
                  </button>
                ) : (
                  <span style={{ fontSize: 11, color: "#c0b8b0", fontStyle: "italic" }}>← select account</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}