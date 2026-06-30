// app/members/page.tsx

"use client";

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
      <style>{`
      
        * { box-sizing: border-box; }

        .ml-root {
          background: #f5f4f0;
          min-height: 100vh;
          display: flex;
          overflow: visible;
          height: 100vh;
        }

        /* ===== SIDEBAR ===== */
        .ml-sidebar {
          width: 272px;
          flex-shrink: 0;
          background: #1a2744;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .ml-sidebar-top {
          padding: 28px 24px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .ml-sidebar-logo {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.02em;
          margin: 0 0 4px;
        }

        .ml-sidebar-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          margin: 0;
          line-height: 1.4;
        }

        .ml-sidebar-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }

        .ml-add-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 11px 16px;
          border-radius: 10px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          font-size: 13.5px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.15s, border-color 0.15s;
          margin-bottom: 16px;
          letter-spacing: 0.01em;
        }
        .ml-add-btn:hover { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.25); }

        .ml-customize-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 9px 12px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.65);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          margin-bottom: 20px;
        }
        .ml-customize-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9); }

        .ml-filter-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin: 0 0 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ml-filter-badge {
          background: rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.8);
          border-radius: 100px;
          padding: 1px 7px;
          font-size: 10px;
          font-weight: 600;
        }

        .ml-filter-group { margin-bottom: 14px; }

        .ml-filter-group-label {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255,255,255,0.4);
          margin-bottom: 5px;
          display: block;
          letter-spacing: 0.02em;
        }

        .ml-filter-select {
          width: 100%;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.85);
          font-size: 13px;
          outline: none;
          cursor: pointer;
          transition: all 0.15s;
          -webkit-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 28px;
        }
        .ml-filter-select:focus { border-color: rgba(255,255,255,0.25); background-color: rgba(255,255,255,0.1); }
        .ml-filter-select option { background: #1a2744; color: #fff; }

        .ml-clear-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: rgba(255, 120, 100, 0.8);
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px 0;
          transition: color 0.15s;
        }
        .ml-clear-btn:hover { color: rgb(255, 120, 100); }

        /* ===== MAIN ===== */
        .ml-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: visible;
          min-width: 0;
        }

        .ml-topbar {
          background: #fff;
          border-bottom: 1px solid #e8e5df;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .ml-search-wrap {
          flex: 1;
          max-width: 480px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 14px;
          border-radius: 10px;
          border: 1.5px solid #e2ddd8;
          background: #fdfcfb;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .ml-search-wrap:focus-within {
          border-color: #1a2744;
          box-shadow: 0 0 0 3px rgba(26,39,68,0.07);
        }
        .ml-search-icon { color: #a09890; flex-shrink: 0; }
        .ml-search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 13.5px;
          color: #1a1714;
          outline: none;
        }
        .ml-search-input::placeholder { color: #c0b8b0; }

        .ml-sort-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
        }
        .ml-sort-label {
          font-size: 12px;
          color: #a09890;
          white-space: nowrap;
          font-weight: 500;
        }
        .ml-sort-select {
          padding: 8px 32px 8px 12px;
          border-radius: 8px;
          border: 1.5px solid #e2ddd8;
          background: #fdfcfb;
          font-size: 13px;
          color: #1a1714;
          outline: none;
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23a09890' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
        }

        .ml-count-chip {
          padding: 5px 12px;
          border-radius: 100px;
          background: #f0ede8;
          font-size: 12px;
          font-weight: 600;
          color: #6b6560;
          white-space: nowrap;
        }

        /* ===== TABLE AREA ===== */
        .ml-table-area {
          position: relative;
          z-index: 1;
          flex: 1;
          overflow-x: auto;
          overflow-y: visible;
          padding: 20px 24px;
        }

        .ml-table-card {
          background: #fff;
          border-radius: 14px;
          border: 1px solid #e8e5df;
          overflow-x: auto;
          overflow-y: visible;
        }

        .ml-table {
          width: 100%;
          min-width: max-content;
          border-collapse: collapse;
          font-size: 13.5px;
        }

        .ml-table thead tr {
          background: #faf9f7;
          border-bottom: 1px solid #e8e5df;
        }

        .ml-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #8c8480;
          white-space: nowrap;
        }

        .ml-table tbody tr {
          border-bottom: 1px solid #f5f3f0;
          transition: background 0.12s;
        }
        .ml-table tbody tr:last-child { border-bottom: none; }
        .ml-table tbody tr:hover { background: #faf9f7; }

        .ml-table td {
          padding: 13px 16px;
          color: #2a2420;
          white-space: nowrap;
        }

        .ml-name-cell {
          font-weight: 600;
          color: #1a1714;
        }

        .ml-status-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 100px;
          font-size: 11.5px;
          font-weight: 600;
          border: 1px solid;
        }
        .ml-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .ml-empty {
          text-align: center;
          padding: 64px 24px;
        }
        .ml-empty-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #f0ede8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          color: #a09890;
        }
        .ml-empty-title { font-size: 14px; font-weight: 600; color: #5a5450; margin: 0 0 4px; }
        .ml-empty-sub { font-size: 13px; color: #a09890; margin: 0; }

        /* SPINNER */
        .ml-spinner {
          width: 28px; height: 28px;
          border: 3px solid #e8e5df;
          border-top-color: #1a2744;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
          margin: 0 auto 12px;
        }

        /* ===== ACTION MENU ===== */
        .ml-action-btn {
          padding: 6px;
          border-radius: 7px;
          border: none;
          background: transparent;
          color: #a09890;
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ml-action-btn:hover { background: #f0ede8; color: #2a2420; }

        .ml-menu-dropdown {
          width: 156px;
          background: #fff;
          border: 1px solid #e8e5df;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06);
          z-index: 9999;
          overflow: hidden;
          padding: 4px;
        }

        .ml-menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 10px;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-size: 13px;
          color: #2a2420;
          cursor: pointer;
          text-align: left;
          transition: background 0.1s;
        }
        .ml-menu-item:hover { background: #f5f3f0; }
        .ml-menu-item.danger { color: #c0392b; }
        .ml-menu-item.danger:hover { background: #fef2f2; }

        /* ===== PAGINATION ===== */
        .ml-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          background: #fff;
          border-top: 1px solid #e8e5df;
          flex-shrink: 0;
        }

        .ml-page-info { font-size: 12.5px; color: #8c8480; }
        .ml-page-info strong { color: #2a2420; font-weight: 600; }

        .ml-page-btns { display: flex; gap: 6px; align-items: center; }

        .ml-page-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1.5px solid #e2ddd8;
          background: #fdfcfb;
          font-size: 13px;
          font-weight: 500;
          color: #2a2420;
          cursor: pointer;
          transition: all 0.12s;
        }
        .ml-page-btn:hover:not(:disabled) { border-color: #1a2744; color: #1a2744; }
        .ml-page-btn:disabled { opacity: 0.38; cursor: not-allowed; }

        .ml-page-number {
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #1a2744;
          background: #eef0f5;
        }

        /* ===== DRAWER ===== */
        .ml-drawer {
          width: 320px;
          flex-shrink: 0;
          background: #fff;
          border-left: 1px solid #e8e5df;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .ml-drawer-header {
          padding: 20px 20px 16px;
          border-bottom: 1px solid #f0ede8;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .ml-drawer-name {
          font-size: 17px;
          font-weight: 600;
          color: #1a1714;
          margin: 0 0 2px;
          line-height: 1.3;
        }

        .ml-drawer-redbook {
          font-size: 11.5px;
          color: #a09890;
          font-weight: 500;
        }

        .ml-drawer-close {
          padding: 5px;
          border-radius: 7px;
          border: none;
          background: transparent;
          color: #a09890;
          cursor: pointer;
          transition: all 0.12s;
          flex-shrink: 0;
        }
        .ml-drawer-close:hover { background: #f0ede8; color: #2a2420; }

        .ml-drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
          scrollbar-width: thin;
          scrollbar-color: #e8e5df transparent;
        }

        .ml-drawer-section {
          margin-bottom: 20px;
        }

        .ml-drawer-section-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #c0b8b0;
          margin: 0 0 10px;
          padding-bottom: 6px;
          border-bottom: 1px solid #f0ede8;
        }

        .ml-drawer-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          padding: 5px 0;
        }

        .ml-drawer-key {
          font-size: 12px;
          color: #a09890;
          font-weight: 500;
          flex-shrink: 0;
          min-width: 100px;
        }

        .ml-drawer-val {
          font-size: 13px;
          color: #1a1714;
          font-weight: 500;
          text-align: right;
        }

        .ml-drawer-edit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 10px;
          margin: 0 20px 16px;
          width: calc(100% - 40px);
          border-radius: 9px;
          border: 1.5px solid #e2ddd8;
          background: #fdfcfb;
          font-size: 13px;
          font-weight: 600;
          color: #1a2744;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .ml-drawer-edit-btn:hover { background: #1a2744; color: #fff; border-color: #1a2744; }

        /* ===== COLUMN PANEL ===== */
        .ml-col-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0,0,0,0.3);
        }

        .ml-col-panel {
          position: fixed;
          left: 272px;
          top: 0;
          height: 100%;
          width: 288px;
          background: #fff;
          z-index: 101;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #e8e5df;
          box-shadow: 4px 0 20px rgba(0,0,0,0.08);
        }

        .ml-col-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid #e8e5df;
        }

        .ml-col-title {
          font-size: 14px;
          font-weight: 700;
          color: #1a1714;
        }

        .ml-col-close {
          padding: 4px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: #a09890;
          cursor: pointer;
          transition: all 0.12s;
        }
        .ml-col-close:hover { background: #f0ede8; color: #2a2420; }

        .ml-col-list { flex: 1; overflow-y: auto; padding: 8px 12px; }

        .ml-col-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.1s;
        }
        .ml-col-item:hover { background: #f5f3f0; }

        .ml-col-item-label {
          font-size: 13px;
          color: #2a2420;
          text-transform: capitalize;
        }

        .ml-col-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #1a2744;
          cursor: pointer;
          flex-shrink: 0;
        }

        .ml-col-footer {
          padding: 14px 20px;
          border-top: 1px solid #e8e5df;
        }

        .ml-col-reset {
          width: 100%;
          padding: 9px;
          border-radius: 8px;
          border: 1.5px solid #e2ddd8;
          background: transparent;
          font-size: 13px;
          font-weight: 500;
          color: #6b6560;
          cursor: pointer;
          transition: all 0.12s;
        }
        .ml-col-reset:hover { border-color: #1a2744; color: #1a2744; }

        /* ===== DELETE MODAL ===== */
        .ml-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .ml-modal {
          background: #fff;
          border-radius: 18px;
          padding: 32px 28px 28px;
          width: 100%;
          max-width: 360px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18);
        }

        .ml-modal-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: #fef2f2;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
          color: #c0392b;
        }

        .ml-modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1714;
          margin: 0 0 8px;
        }

        .ml-modal-desc {
          font-size: 13.5px;
          color: #8c8480;
          margin: 0 0 24px;
          line-height: 1.5;
        }

        .ml-modal-btns {
          display: flex;
          gap: 10px;
        }

        .ml-modal-cancel {
          flex: 1;
          padding: 11px;
          border-radius: 10px;
          border: 1.5px solid #e2ddd8;
          background: #fdfcfb;
          font-size: 13.5px;
          font-weight: 600;
          color: #5a5450;
          cursor: pointer;
          transition: all 0.12s;
        }

        .ml-modal-confirm {
          flex: 1;
          padding: 11px;
          border-radius: 10px;
          border: none;
          background: #c0392b;
          font-size: 13.5px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: background 0.12s;
          box-shadow: 0 2px 8px rgba(192,57,43,0.3);
        }
      `}</style>

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
