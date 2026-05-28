"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  User, Phone, Church, GraduationCap,
  Heart, BookOpen, Pencil, PenSquare, Clock3
} from "lucide-react";

export default function MemberPortalPage() {
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [noRecord, setNoRecord] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/"); return; }

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setLoading(false);
      if (!data) { setNoRecord(true); return; }
      setMember(data);
    })();
  }, []);

  const fmt = (date: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const val = (v: any) => v || "—";

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 12 }}>
      <div style={{
        width: 28, height: 28,
        border: "3px solid #dde3f0",
        borderTopColor: "#4f46e5",
        borderRadius: "50%",
        animation: "spin 0.75s linear infinite",
      }} />
      <p style={{ fontSize: 13, color: "#7b88a8" }}>Loading your profile…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (noRecord) return (
    <div style={{ padding: 40, maxWidth: 560, margin: "0 auto" }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #dde3f0",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(30,45,90,0.07)",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #f0f4ff 0%, #e8edf8 100%)",
          borderBottom: "1px solid #dde3f0",
          padding: "28px 32px",
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e2d5a", margin: "0 0 6px" }}>
            Welcome to the Member Portal
          </h2>
          <p style={{ fontSize: 14, color: "#7b88a8", margin: 0, lineHeight: 1.5 }}>
            You don't have a membership record linked yet.
          </p>
        </div>
        <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Option 1 — self register */}
          <button
            onClick={() => router.push("/member-portal/register")}
            style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "20px 24px", borderRadius: 12,
              border: "1.5px solid rgba(99,102,241,0.3)",
              background: "#f0f4ff",
              cursor: "pointer", textAlign: "left", width: "100%",
              transition: "all 0.15s",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#fff",
              }}
            >
              <PenSquare size={20} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1e2d5a", margin: "0 0 3px" }}>
                Register as a New Member
              </p>
              <p style={{ fontSize: 12.5, color: "#7b88a8", margin: 0, lineHeight: 1.4 }}>
                Fill out your membership form. Your application will be reviewed by the church admin.
              </p>
            </div>
          </button>

          {/* Option 2 — wait for admin */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "20px 24px", borderRadius: 12,
            border: "1.5px solid #dde3f0",
            background: "#f5f7fc",
          }}>
            
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                background: "#e8edf8",
                border: "1px solid #dde3f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#4b5563",
              }}
            >
              <Clock3 size={20} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1e2d5a", margin: "0 0 3px" }}>
                Already a Church Member?
              </p>
              <p style={{ fontSize: 12.5, color: "#7b88a8", margin: 0, lineHeight: 1.4 }}>
                If you were already registered by the admin, ask them to link your account using your email address.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .mp-root { padding: 32px; width: 100%; }

        .mp-header {
          background: linear-gradient(135deg, #1e2d5a 0%, #2d3f7a 100%);
          border-radius: 16px;
          border: 1px solid rgba(99,102,241,0.2);
          box-shadow: 0 4px 20px rgba(30,45,90,0.12);
          padding: 32px; margin-bottom: 24px;
          display: flex; align-items: center; justify-content: space-between; gap: 20px;
        }
        .mp-header-left { display: flex; align-items: center; gap: 20px; }
        .mp-avatar {
          width: 64px; height: 64px; border-radius: 16px;
          background: rgba(255,255,255,0.15);
          border: 1.5px solid rgba(255,255,255,0.25);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: #fff; font-size: 22px; font-weight: 700;
          letter-spacing: -0.02em;
        }
        .mp-name { font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 8px; letter-spacing: -0.02em; }
        .mp-meta { display: flex; gap: 8px; flex-wrap: wrap; }
        .mp-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 100px;
          font-size: 11.5px; font-weight: 600;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.85);
        }
        .mp-chip-dot { width: 5px; height: 5px; border-radius: 50%; background: #4ade80; }
        .mp-edit-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 10px;
          border: 1.5px solid rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.9); font-size: 13.5px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
          flex-shrink: 0;
        }
        .mp-edit-btn:hover {
          background: rgba(255,255,255,0.2);
          border-color: rgba(255,255,255,0.4);
        }

        .mp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media(max-width: 680px) {
          .mp-grid { grid-template-columns: 1fr; }
          .mp-root { padding: 20px; }
        }

        .mp-card {
          background: #fff;
          border-radius: 14px;
          border: 1px solid #dde3f0;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(30,45,90,0.05);
        }
        .mp-card-header {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 20px;
          border-bottom: 1px solid #dde3f0;
          background: linear-gradient(135deg, #f0f4ff 0%, #f5f7fc 100%);
        }
        .mp-card-icon {
          width: 30px; height: 30px; border-radius: 8px;
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          display: flex; align-items: center;
          justify-content: center; color: #fff; flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(79,70,229,0.25);
        }
        .mp-card-title {
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: #3730a3; margin: 0;
        }
        .mp-card-body { padding: 14px 20px; display: flex; flex-direction: column; gap: 2px; }
        .mp-row {
          display: flex; align-items: baseline;
          justify-content: space-between; gap: 12px; padding: 7px 0;
          border-bottom: 1px solid #f0f3fa;
        }
        .mp-row:last-child { border-bottom: none; }
        .mp-key { font-size: 12px; color: #9aa3bc; font-weight: 600; flex-shrink: 0; min-width: 110px; }
        .mp-val { font-size: 13px; color: #1e2d5a; font-weight: 500; text-align: right; }

        .mp-status-dot { width: 5px; height: 5px; border-radius: 50%; display: inline-block; margin-right: 5px; }
      `}</style>

      <div className="mp-root">

        {/* HEADER CARD */}
        <div className="mp-header">
          <div className="mp-header-left">
            <div className="mp-avatar">
              {member.first_name?.[0]}{member.last_name?.[0]}
            </div>
            <div>
              <p className="mp-name">
                {member.first_name} {member.middle_name ? `${member.middle_name} ` : ""}{member.last_name}{member.suffix ? ` ${member.suffix}` : ""}
              </p>
              <div className="mp-meta">
                {member.status && (
                  <span className="mp-chip">
                    <span className="mp-chip-dot" style={{
                      background: member.status === "Active" ? "#4ade80"
                        : member.status === "Inactive" ? "#f87171" : "#9ca3af"
                    }} />
                    {member.status}
                  </span>
                )}
                {member.fellowship && <span className="mp-chip">{member.fellowship}</span>}
                {member.membership_type && <span className="mp-chip">{member.membership_type}</span>}
                {member.red_book_no && <span className="mp-chip">Red Book #{member.red_book_no}</span>}
              </div>
            </div>
          </div>
          <button className="mp-edit-btn" onClick={() => router.push("/member-portal/edit")}>
            <Pencil size={14} /> Edit Profile
          </button>
        </div>

        <div className="mp-grid">

          {/* PERSONAL */}
          <div className="mp-card">
            <div className="mp-card-header">
              <div className="mp-card-icon"><User size={14} /></div>
              <h3 className="mp-card-title">Personal Information</h3>
            </div>
            <div className="mp-card-body">
              {[
                ["Civil Status", val(member.civil_status)],
                ["Sex", val(member.sex)],
                ["Blood Type", val(member.blood_type)],
                ["Citizenship", val(member.citizenship)],
                ["Birthdate", fmt(member.birthdate)],
                ["Birthplace", val(member.birthplace)],
                ["Age", val(member.age)],
                ["Age Group", val(member.age_group)],
              ].map(([k, v]) => (
                <div key={k} className="mp-row">
                  <span className="mp-key">{k}</span>
                  <span className="mp-val">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CONTACT */}
          <div className="mp-card">
            <div className="mp-card-header">
              <div className="mp-card-icon"><Phone size={14} /></div>
              <h3 className="mp-card-title">Contact Details</h3>
            </div>
            <div className="mp-card-body">
              {[
                ["Mobile", member.mobile_num ? `+63 ${member.mobile_num}` : "—"],
                ["Home Contact", val(member.home_contact)],
                ["Office Contact", val(member.office_contact)],
                ["Email", val(member.email)],
                ["Home Address", val(member.home_address)],
                ["Zone", val(member.zone)],
                ["Office Address", val(member.office_address)],
              ].map(([k, v]) => (
                <div key={k} className="mp-row">
                  <span className="mp-key">{k}</span>
                  <span className="mp-val" style={{ wordBreak: "break-word" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FAMILY */}
          <div className="mp-card">
            <div className="mp-card-header">
              <div className="mp-card-icon"><Heart size={14} /></div>
              <h3 className="mp-card-title">Family</h3>
            </div>
            <div className="mp-card-body">
              {[
                ["Father", val(member.father)],
                ["Mother", val(member.mother)],
                ["Spouse", val(member.spouse)],
                ["Spouse Citizenship", val(member.spouse_citizenship)],
                ["Wedding Date", fmt(member.wedding_date)],
                ["Years Married", member.years_married ? `${member.years_married} yrs` : "—"],
              ].map(([k, v]) => (
                <div key={k} className="mp-row">
                  <span className="mp-key">{k}</span>
                  <span className="mp-val">{v}</span>
                </div>
              ))}
              {Array.isArray(member.children) && member.children.filter((c: any) => c.name).length > 0 && (
                <div className="mp-row">
                  <span className="mp-key">Children</span>
                  <span className="mp-val" style={{ textAlign: "right" }}>
                    {member.children.filter((c: any) => c.name).map((c: any, i: number) => (
                      <div key={i}>{c.name}{c.birthdate ? ` (${fmt(c.birthdate)})` : ""}</div>
                    ))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* BAPTISM */}
          <div className="mp-card">
            <div className="mp-card-header">
              <div className="mp-card-icon"><Church size={14} /></div>
              <h3 className="mp-card-title">Baptism</h3>
            </div>
            <div className="mp-card-body">
              {[
                ["Place / Church", val(member.baptism_place)],
                ["Date", fmt(member.baptism_date)],
                ["Minister", val(member.officiating_minister)],
              ].map(([k, v]) => (
                <div key={k} className="mp-row">
                  <span className="mp-key">{k}</span>
                  <span className="mp-val">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* EDUCATION & WORK */}
          <div className="mp-card">
            <div className="mp-card-header">
              <div className="mp-card-icon"><GraduationCap size={14} /></div>
              <h3 className="mp-card-title">Education & Work</h3>
            </div>
            <div className="mp-card-body">
              {[
                ["Education", val(member.education)],
                ["School", val(member.school)],
                ["Year Graduated", val(member.year_graduated)],
                ["Occupation", val(member.occupation)],
              ].map(([k, v]) => (
                <div key={k} className="mp-row">
                  <span className="mp-key">{k}</span>
                  <span className="mp-val">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* INVOLVEMENT */}
          <div className="mp-card">
            <div className="mp-card-header">
              <div className="mp-card-icon"><BookOpen size={14} /></div>
              <h3 className="mp-card-title">Church Involvement</h3>
            </div>
            <div className="mp-card-body">
              <div className="mp-row">
                <span className="mp-key">Skills</span>
                <span className="mp-val">
                  {Array.isArray(member.interest_skills) && member.interest_skills.length > 0
                    ? member.interest_skills.join(", ") : "—"}
                </span>
              </div>
              <div className="mp-row">
                <span className="mp-key">Involvement</span>
                <span className="mp-val">
                  {Array.isArray(member.church_involvement) && member.church_involvement.length > 0
                    ? member.church_involvement.join(", ") : "—"}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}