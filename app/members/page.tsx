// app/members/page.tsx

"use client";

import "./page.css";
import { useEffect, useMemo, useState } from "react";
import { fetchAllMembers } from "@/app/lib/api/members";
import { fmtDate } from "@/app/lib/utils";
import Toast, { defaultToast, useToast, type ToastState } from "@/app/components/ui/Toast";
import { statusConfig } from "@/app/components/ui/StatusBadge";
import {
  Eye, Pencil, Trash2, MoreHorizontal, Search, X,
  UserPlus, SlidersHorizontal, SearchX,
  ChevronLeft, ChevronRight, Filter
} from "lucide-react";
import { useRouter } from "next/navigation";

const defaultColumns: Record<string, boolean> = {
  red_book_no: true, name: true, fellowship: true, membership_type: false, status: true,
  civil_status: false, sex: false, blood_type: false, citizenship: false,
  birthdate: false, birthplace: false, age: false, age_group: false,
  father: false, mother: false,
  home_address: false, zone: false, office_address: false,
  mobile_num: true, home_contact: false, office_contact: false, email: false,
  baptism_place: false, baptism_date: false, officiating_minister: false,
  education: false, school: false, year_graduated: false, occupation: false,
  spouse: false, spouse_citizenship: false, wedding_date: false, years_married: false,
  children: false, interest_skills: false, church_involvement: false, date_of_decease: false,
};

export default function MembersListPage() {
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fellowshipFilter, setFellowshipFilter] = useState("");
  const [birthdayMonth, setBirthdayMonth] = useState("");
  const [weddingMonth, setWeddingMonth] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [showColumnPanel, setShowColumnPanel] = useState(false);
  const [sortBy, setSortBy] = useState("az");
  const [menuPos, setMenuPos] = useState<{top: number; right: number} | null>(null);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<ToastState>(defaultToast);
  const showToast = useToast(setToast);

  type ColumnState = Record<string, boolean>;

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const data = await fetchAllMembers();
        setMembers(data);
      } catch (err) {
        showToast("error", "Failed to Load Members", err instanceof Error ? err.message : "Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [search, statusFilter, fellowshipFilter, birthdayMonth, weddingMonth]);

  useEffect(() => {
    const saved = localStorage.getItem("member_columns");
    if (saved) setVisibleColumns(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("member_columns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu]")) setOpenMenu(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const toggleColumn = (key: keyof ColumnState) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filtered = useMemo(() => {
    let data = members.filter((m) => {
      const birthdate = m.birthdate ? new Date(m.birthdate) : null;
      const weddingDate = m.wedding_date ? new Date(m.wedding_date) : null;
      const normalizeSex = (sex?: string | null) => {
        const value = (sex ?? "").toLowerCase().trim();
        if (value === "m" || value === "male") return "male";
        if (value === "f" || value === "female") return "female";
        return value;
      };
      const searchable = [
        m.red_book_no, m.fellowship, m.membership_type, m.status,
        m.first_name, m.middle_name, m.last_name, m.suffix,
        m.civil_status, normalizeSex(m.sex), m.blood_type, m.citizenship,
        m.birthdate, m.birthplace, m.age, m.age_group,
        m.father, m.mother, m.home_address, m.office_address, m.zone,
        m.mobile_num, m.home_contact, m.office_contact, m.email,
        m.baptism_place, m.baptism_date, m.officiating_minister,
        m.education, m.school, m.year_graduated, m.occupation,
        m.spouse, m.wedding_date, m.years_married, m.spouse_citizenship,
        ...(Array.isArray(m.interest_skills) ? m.interest_skills : []),
        m.date_of_decease,
        ...(Array.isArray(m.church_involvement) ? m.church_involvement : []),
      ].filter(Boolean).join(" ").toLowerCase();
      const keyword = debouncedSearch.trim().toLowerCase();
      const matchesSearch = keyword === "" ? true : keyword.split(" ").every((word) => searchable.includes(word));
      const matchesStatus = statusFilter ? m.status === statusFilter : true;
      const matchesFellowship = fellowshipFilter ? m.fellowship === fellowshipFilter : true;
      const matchesBirthday = birthdayMonth === "" ? true : birthdate && birthdate.toLocaleString("default", { month: "long" }) === birthdayMonth;
      const matchesWedding = weddingMonth === "" ? true : weddingDate && weddingDate.toLocaleString("default", { month: "long" }) === weddingMonth;
      return matchesSearch && matchesStatus && matchesFellowship && matchesBirthday && matchesWedding;
    });

    switch (sortBy) {
      case "az": return data.sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`));
      case "za": return data.sort((a, b) => `${b.last_name} ${b.first_name}`.localeCompare(`${a.last_name} ${a.first_name}`));
      case "red_book_no": return data.sort((a, b) => (a.red_book_no || "").localeCompare(b.red_book_no || ""));
      case "birthdate": return data.sort((a, b) => {
        if (!a.birthdate) return 1; if (!b.birthdate) return -1;
        const dA = new Date(a.birthdate), dB = new Date(b.birthdate);
        return ((dA.getMonth() + 1) * 100 + dA.getDate()) - ((dB.getMonth() + 1) * 100 + dB.getDate());
      });
      case "wedding_date": return data.sort((a, b) => {
        if (!a.wedding_date) return 1; if (!b.wedding_date) return -1;
        const dA = new Date(a.wedding_date), dB = new Date(b.wedding_date);
        return ((dA.getMonth() + 1) * 100 + dA.getDate()) - ((dB.getMonth() + 1) * 100 + dB.getDate());
      });
      default: return data;
    }
  }, [members, debouncedSearch, statusFilter, fellowshipFilter, birthdayMonth, weddingMonth, sortBy]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const deleteMember = async (id: string) => {
    const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Delete failed." }));
      showToast("error", "Delete Failed", error);
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setSelected((prev: any) => prev?.id === id ? null : prev);
    showToast("success", "Member Deleted", "Record permanently removed.");  

    window.dispatchEvent(new CustomEvent("member-count-changed"));
  };

  const activeFilterCount = [statusFilter, fellowshipFilter, birthdayMonth, weddingMonth].filter(Boolean).length;
  const visibleColCount = Object.values(visibleColumns).filter(Boolean).length;

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <>
      <div className="ml-root">

        {/* ===== SIDEBAR ===== */}
        <aside className="ml-sidebar">
          <div className="ml-sidebar-top">
            <h1 className="ml-sidebar-logo">Members</h1>
            <p className="ml-sidebar-sub">Church membership directory</p>
          </div>

          <div className="ml-sidebar-body">
            <a href="/members/new" className="ml-add-btn">
              <UserPlus size={16} strokeWidth={2.5} />
              Add New Member
            </a>

            <button className="ml-customize-btn" onClick={() => setShowColumnPanel(true)}>
              <SlidersHorizontal size={14} />
              Customize Columns
            </button>

            <p className="ml-filter-label">
              <Filter size={10} />
              Filters
              {activeFilterCount > 0 && <span className="ml-filter-badge">{activeFilterCount}</span>}
            </p>

            <div className="ml-filter-group">
              <span className="ml-filter-group-label">Status</span>
              <select className="ml-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
                <option value="Deceased">Deceased</option>
              </select>
            </div>

            <div className="ml-filter-group">
              <span className="ml-filter-group-label">Fellowship</span>
              <select className="ml-filter-select" value={fellowshipFilter} onChange={(e) => setFellowshipFilter(e.target.value)}>
                <option value="">All Fellowships</option>
                {[...new Set(members.map((m) => m.fellowship).filter(Boolean))].sort().map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="ml-filter-group">
              <span className="ml-filter-group-label">Birthday Month</span>
              <select className="ml-filter-select" value={birthdayMonth} onChange={(e) => setBirthdayMonth(e.target.value)}>
                <option value="">All Months</option>
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="ml-filter-group">
              <span className="ml-filter-group-label">Wedding Anniversary</span>
              <select className="ml-filter-select" value={weddingMonth} onChange={(e) => setWeddingMonth(e.target.value)}>
                <option value="">All Months</option>
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {activeFilterCount > 0 && (
              <button className="ml-clear-btn" onClick={() => { setStatusFilter(""); setFellowshipFilter(""); setBirthdayMonth(""); setWeddingMonth(""); }}>
                <X size={11} /> Clear all filters
              </button>
            )}
          </div>
        </aside>

        {/* ===== MAIN ===== */}
        <div className="ml-main">

          {/* TOPBAR */}
          <div className="ml-topbar">
            <div className="ml-search-wrap">
              <Search size={15} className="ml-search-icon" />
              <input className="ml-search-input" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch("")} style={{border:"none",background:"none",cursor:"pointer",color:"#a09890",padding:0,display:"flex"}}><X size={14} /></button>}
            </div>

            <div className="ml-sort-wrap">
              <span className="ml-sort-label">Sort by</span>
              <select className="ml-sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="az">Name (A–Z)</option>
                <option value="za">Name (Z–A)</option>
                <option value="red_book_no">Red Book No.</option>
                <option value="birthdate">Birthdate</option>
                <option value="wedding_date">Wedding Date</option>
              </select>
              <span className="ml-count-chip">{filtered.length} members</span>
            </div>
          </div>

          {/* TABLE */}
          <div className="ml-table-area">
            <div className="ml-table-card">
              <table className="ml-table">
                <thead>
                  <tr>
                    {visibleColumns.red_book_no && <th>Red Book No.</th>}
                    {visibleColumns.name && <th>Name</th>}
                    {visibleColumns.fellowship && <th>Fellowship</th>}
                    {visibleColumns.membership_type && <th>Membership Type</th>}
                    {visibleColumns.status && <th>Status</th>}
                    {visibleColumns.civil_status && <th>Civil Status</th>}
                    {visibleColumns.sex && <th>Sex</th>}
                    {visibleColumns.blood_type && <th>Blood Type</th>}
                    {visibleColumns.citizenship && <th>Citizenship</th>}
                    {visibleColumns.birthdate && <th>Birthdate</th>}
                    {visibleColumns.birthplace && <th>Birthplace</th>}
                    {visibleColumns.age && <th>Age</th>}
                    {visibleColumns.age_group && <th>Age Group</th>}
                    {visibleColumns.father && <th>Father</th>}
                    {visibleColumns.mother && <th>Mother</th>}
                    {visibleColumns.home_address && <th>Home Address</th>}
                    {visibleColumns.zone && <th>Zone</th>}
                    {visibleColumns.office_address && <th>Office Address</th>}
                    {visibleColumns.mobile_num && <th>Mobile No.</th>}
                    {visibleColumns.home_contact && <th>Home Contact</th>}
                    {visibleColumns.office_contact && <th>Office Contact</th>}
                    {visibleColumns.email && <th>Email</th>}
                    {visibleColumns.baptism_place && <th>Baptism Place</th>}
                    {visibleColumns.baptism_date && <th>Baptism Date</th>}
                    {visibleColumns.officiating_minister && <th>Officiating Minister</th>}
                    {visibleColumns.education && <th>Education</th>}
                    {visibleColumns.school && <th>School</th>}
                    {visibleColumns.year_graduated && <th>Year Graduated</th>}
                    {visibleColumns.occupation && <th>Occupation</th>}
                    {visibleColumns.spouse && <th>Spouse</th>}
                    {visibleColumns.spouse_citizenship && <th>Spouse Citizenship</th>}
                    {visibleColumns.wedding_date && <th>Wedding Date</th>}
                    {visibleColumns.years_married && <th>Years Married</th>}
                    {visibleColumns.children && <th>Children</th>}
                    {visibleColumns.interest_skills && <th>Interest / Skills</th>}
                    {visibleColumns.church_involvement && <th>Church Involvement</th>}
                    {visibleColumns.date_of_decease && <th>Date of Decease</th>}
                    <th style={{textAlign:"right"}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={visibleColCount + 1}>
                      <div className="ml-empty">
                        <div className="ml-spinner" />
                        <p className="ml-empty-sub">Loading members...</p>
                      </div>
                    </td></tr>
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={visibleColCount + 1}>
                      <div className="ml-empty">
                        <div className="ml-empty-icon"><SearchX size={22} /></div>
                        <p className="ml-empty-title">No records found</p>
                        <p className="ml-empty-sub">Try adjusting your filters or search query</p>
                      </div>
                    </td></tr>
                  ) : paginated.map((m) => {
                    const sc = statusConfig(m.status);
                    return (
                      <tr key={m.id}>
                        {visibleColumns.red_book_no && <td style={{color:"#8c8480",fontWeight:500}}>{m.red_book_no || "—"}</td>}
                        {visibleColumns.name && <td className="ml-name-cell">{m.last_name}, {m.first_name}{m.middle_name ? ` ${m.middle_name}` : ""} {m.suffix ? ` ${m.suffix}` : ""}</td>}
                        {visibleColumns.fellowship && <td>{m.fellowship || "—"}</td>}
                        {visibleColumns.membership_type && <td>{m.membership_type || "—"}</td>}
                        {visibleColumns.status && <td>
                          <span className="ml-status-chip" style={{background:sc.bg,color:sc.text,borderColor:sc.border}}>
                            <span className="ml-status-dot" style={{background:sc.dot}} />
                            {m.status || "—"}
                          </span>
                        </td>}
                        {visibleColumns.civil_status && <td>{m.civil_status || "—"}</td>}
                        {visibleColumns.sex && <td>{m.sex || "—"}</td>}
                        {visibleColumns.blood_type && <td>{m.blood_type || "—"}</td>}
                        {visibleColumns.citizenship && <td>{m.citizenship || "—"}</td>}
                        {visibleColumns.birthdate && <td>{fmtDate(m.birthdate)}</td>}
                        {visibleColumns.birthplace && <td>{m.birthplace || "—"}</td>}
                        {visibleColumns.age && <td>{m.age || "—"}</td>}
                        {visibleColumns.age_group && <td>{m.age_group || "—"}</td>}
                        {visibleColumns.father && <td>{m.father || "—"}</td>}
                        {visibleColumns.mother && <td>{m.mother || "—"}</td>}
                        {visibleColumns.home_address && <td>{m.home_address || "—"}</td>}
                        {visibleColumns.zone && <td>{m.zone || "—"}</td>}
                        {visibleColumns.office_address && <td>{m.office_address || "—"}</td>}
                        {visibleColumns.mobile_num && <td>{m.mobile_num || "—"}</td>}
                        {visibleColumns.home_contact && <td>{m.home_contact || "—"}</td>}
                        {visibleColumns.office_contact && <td>{m.office_contact || "—"}</td>}
                        {visibleColumns.email && <td>{m.email || "—"}</td>}
                        {visibleColumns.baptism_place && <td>{m.baptism_place || "—"}</td>}
                        {visibleColumns.baptism_date && <td>{fmtDate(m.baptism_date)}</td>}
                        {visibleColumns.officiating_minister && <td>{m.officiating_minister || "—"}</td>}
                        {visibleColumns.education && <td>{m.education || "—"}</td>}
                        {visibleColumns.school && <td>{m.school || "—"}</td>}
                        {visibleColumns.year_graduated && <td>{m.year_graduated || "—"}</td>}
                        {visibleColumns.occupation && <td>{m.occupation || "—"}</td>}
                        {visibleColumns.spouse && <td>{m.spouse || "—"}</td>}
                        {visibleColumns.spouse_citizenship && <td>{m.spouse_citizenship || "—"}</td>}
                        {visibleColumns.wedding_date && <td>{fmtDate(m.wedding_date)}</td>}
                        {visibleColumns.years_married && <td>{m.years_married || "—"}</td>}
                        {visibleColumns.children && <td>{Array.isArray(m.children) ? m.children.map((c: any, i: number) => <div key={i}>{c.name} ({fmtDate(c.birthdate)})</div>) : m.children || "—"}</td>}
                        {visibleColumns.interest_skills && <td>{Array.isArray(m.interest_skills) ? m.interest_skills.join(", ") : m.interest_skills || "—"}</td>}
                        {visibleColumns.church_involvement && <td>{Array.isArray(m.church_involvement) ? m.church_involvement.join(", ") : m.church_involvement || "—"}</td>}
                        {visibleColumns.date_of_decease && <td>{fmtDate(m.date_of_decease)}</td>}

                        {/* ACTIONS */}
                        <td style={{textAlign:"right"}}>
                          <div style={{position:"relative",display:"inline-block"}} data-menu>
                            <button className="ml-action-btn" 
                              onClick={(e) => {
                                if (openMenu === m.id) {
                                  setOpenMenu(null);
                                  setMenuPos(null);
                                } else {
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
                                  setOpenMenu(m.id);
                                }
                              }}>
                              <MoreHorizontal size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINATION */}
          <div className="ml-pagination">
            <p className="ml-page-info">
              Showing <strong>{paginated.length > 0 ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> members
            </p>
            <div className="ml-page-btns">
              <button className="ml-page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="ml-page-number">{page} / {totalPages || 1}</span>
              <button className="ml-page-btn" disabled={page === totalPages || totalPages === 0} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ===== DRAWER ===== */}
        {selected && (
          <aside className="ml-drawer">
            <div className="ml-drawer-header">
              <div>
                <p className="ml-drawer-name">
                  {selected.first_name} {selected.middle_name ? `${selected.middle_name} ` : ""}{selected.last_name}{selected.suffix ? ` ${selected.suffix}` : ""}
                </p>
                <p className="ml-drawer-redbook">Red Book No. {selected.red_book_no || "—"}</p>
              </div>
              <button className="ml-drawer-close" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>

            <div className="ml-drawer-body">
              {/* CHURCH */}
              <div className="ml-drawer-section">
                <p className="ml-drawer-section-title">Church Records</p>
                {[["Fellowship", selected.fellowship],["Membership Type", selected.membership_type],["Status", selected.status],["Date of Decease", fmtDate(selected.date_of_decease)]].map(([k,v]) => (
                  <div className="ml-drawer-row" key={k}><span className="ml-drawer-key">{k}</span><span className="ml-drawer-val">{v || "—"}</span></div>
                ))}
              </div>

              {/* PERSONAL */}
              <div className="ml-drawer-section">
                <p className="ml-drawer-section-title">Personal</p>
                {[["Civil Status", selected.civil_status],["Sex", selected.sex],["Blood Type", selected.blood_type],["Citizenship", selected.citizenship],["Birthdate", fmtDate(selected.birthdate)],["Birthplace", selected.birthplace],["Age", selected.age],["Age Group", selected.age_group]].map(([k,v]) => (
                  <div className="ml-drawer-row" key={k}><span className="ml-drawer-key">{k}</span><span className="ml-drawer-val">{v || "—"}</span></div>
                ))}
              </div>

              {/* FAMILY */}
              <div className="ml-drawer-section">
                <p className="ml-drawer-section-title">Family</p>
                {[["Father", selected.father],["Mother", selected.mother],["Spouse", selected.spouse],["Spouse Citizenship", selected.spouse_citizenship],["Wedding Date", fmtDate(selected.wedding_date)],["Years Married", selected.years_married]].map(([k,v]) => (
                  <div className="ml-drawer-row" key={k}><span className="ml-drawer-key">{k}</span><span className="ml-drawer-val">{v || "—"}</span></div>
                ))}
                {Array.isArray(selected.children) && selected.children.length > 0 && (
                  <div className="ml-drawer-row">
                    <span className="ml-drawer-key">Children</span>
                    <span className="ml-drawer-val" style={{textAlign:"right"}}>
                      {selected.children.map((c: any, i: number) => <div key={i}>{c.name}</div>)}
                    </span>
                  </div>
                )}
              </div>

              {/* CONTACT */}
              <div className="ml-drawer-section">
                <p className="ml-drawer-section-title">Contact</p>
                {[["Mobile", selected.mobile_num],["Home", selected.home_contact],["Office", selected.office_contact],["Email", selected.email],["Home Address", selected.home_address],["Zone", selected.zone],["Office Address", selected.office_address]].map(([k,v]) => (
                  <div className="ml-drawer-row" key={k}><span className="ml-drawer-key">{k}</span><span className="ml-drawer-val">{v || "—"}</span></div>
                ))}
              </div>

              {/* BAPTISM */}
              <div className="ml-drawer-section">
                <p className="ml-drawer-section-title">Baptism</p>
                {[["Place / Church", selected.baptism_place],["Baptism Date", fmtDate(selected.baptism_date)],["Minister", selected.officiating_minister]].map(([k,v]) => (
                  <div className="ml-drawer-row" key={k}><span className="ml-drawer-key">{k}</span><span className="ml-drawer-val">{v || "—"}</span></div>
                ))}
              </div>

              {/* EDUCATION */}
              <div className="ml-drawer-section">
                <p className="ml-drawer-section-title">Education & Work</p>
                {[["Education", selected.education],["School", selected.school],["Year Graduated", selected.year_graduated],["Occupation", selected.occupation]].map(([k,v]) => (
                  <div className="ml-drawer-row" key={k}><span className="ml-drawer-key">{k}</span><span className="ml-drawer-val">{v || "—"}</span></div>
                ))}
              </div>

              {/* INVOLVEMENT */}
              {(selected.interest_skills?.length > 0 || selected.church_involvement?.length > 0) && (
                <div className="ml-drawer-section">
                  <p className="ml-drawer-section-title">Involvement</p>
                  {selected.interest_skills?.length > 0 && (
                    <div className="ml-drawer-row"><span className="ml-drawer-key">Skills</span><span className="ml-drawer-val">{Array.isArray(selected.interest_skills) ? selected.interest_skills.join(", ") : selected.interest_skills}</span></div>
                  )}
                  {selected.church_involvement?.length > 0 && (
                    <div className="ml-drawer-row"><span className="ml-drawer-key">Church</span><span className="ml-drawer-val">{Array.isArray(selected.church_involvement) ? selected.church_involvement.join(", ") : selected.church_involvement}</span></div>
                  )}
                </div>
              )}
            </div>

            <button className="ml-drawer-edit-btn" onClick={() => router.push(`/members/edit/${selected.id}`)}>
              <Pencil size={14} /> Edit Profile
            </button>
          </aside>
        )}

        {/* ===== COLUMN PANEL ===== */}
        {showColumnPanel && (
          <>
            <div className="ml-col-backdrop" onClick={() => setShowColumnPanel(false)} />
            <div className="ml-col-panel">
              <div className="ml-col-header">
                <span className="ml-col-title">Visible Columns</span>
                <button className="ml-col-close" onClick={() => setShowColumnPanel(false)}><X size={16} /></button>
              </div>
              <div className="ml-col-list">
                {Object.entries(visibleColumns).map(([key, value]) => (
                  <label key={key} className="ml-col-item">
                    <span className="ml-col-item-label">{key.replace(/_/g, " ")}</span>
                    <input type="checkbox" checked={value} onChange={() => toggleColumn(key as keyof ColumnState)} className="ml-col-checkbox" />
                  </label>
                ))}
              </div>
              <div className="ml-col-footer">
                <button className="ml-col-reset" onClick={() => setVisibleColumns(defaultColumns)}>Reset to defaults</button>
              </div>
            </div>
            
          </>
        )}

        {/* ===== DELETE MODAL ===== */}
        {deleteConfirmId && (
          <div className="ml-modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
            <div className="ml-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ml-modal-icon"><Trash2 size={22} /></div>
              <h2 className="ml-modal-title">Delete Member</h2>
              <p className="ml-modal-desc">This action cannot be undone. The member record will be permanently removed from the database.</p>
              <div className="ml-modal-btns">
                <button className="ml-modal-cancel" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                <button className="ml-modal-confirm" onClick={() => { deleteMember(deleteConfirmId); setDeleteConfirmId(null); }}>Yes, Delete</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ===== ACTION MENU PORTAL ===== */}
      {openMenu && menuPos && (
        <div
          className="ml-menu-dropdown"
          data-menu
          style={{
            position: "fixed",
            top: menuPos.top,
            right: menuPos.right,
          }}
        >
          <button className="ml-menu-item" onClick={() => {
            setSelected(paginated.find(m => m.id === openMenu) ?? null);
            setOpenMenu(null);
          }}>
            <Eye size={14} /> View Profile
          </button>
          <button className="ml-menu-item" onClick={() => {
            router.push(`/members/edit/${openMenu}`);
            setOpenMenu(null);
          }}>
            <Pencil size={14} /> Edit
          </button>
          <button className="ml-menu-item danger" onClick={() => {
            setDeleteConfirmId(openMenu);
            setOpenMenu(null);
          }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      <Toast {...toast} onClose={() => setToast((p) => ({ ...p, show: false }))} />
    </>
  );
}
