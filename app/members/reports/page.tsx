// app/reports/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAllMembers } from "@/app/lib/api/members";
import type { Member } from "@/app/lib/types";
import KpiCard from "@/app/components/ui/KpiCard";
import StatusBadge from "@/app/components/ui/StatusBadge";
import { fmtDate, escapeCSV } from "@/app/lib/utils";
import {
  SearchX, Download, Users, UserCheck, UserX, Skull,
  CalendarDays, Droplets, Phone, Copy, Check, Search, ChevronLeft, ChevronRight,
} from "lucide-react";


/* ─── constants ───────────────────────────────────────── */
const COLUMN_LABELS: Record<string, string> = {
  red_book_no:  "Red Book No.",
  name:         "Name",
  sex:          "Sex",
  status:       "Status",
  fellowship:   "Fellowship",
  birthdate:    "Birthdate",
  mobile_num:   "Contact Number",
  civil_status: "Civil Status",
  age_group:    "Age Group",
  home_address: "Home Address",
  zone:         "Zone",
  email:        "Email Address",
  occupation:   "Occupation",
  spouse:       "Spouse Name",
  wedding_date: "Wedding Date",
};

const DEFAULT_COLUMNS = ["red_book_no","name","sex","status","fellowship","birthdate","mobile_num"];
const OPTIONAL_COLUMNS = ["civil_status","age_group","home_address","zone","email","occupation","spouse","wedding_date"];
const ALL_COLUMNS = [...DEFAULT_COLUMNS, ...OPTIONAL_COLUMNS];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/* ─── main ─────────────────────────────────────────────── */
export default function ReportsPage() {
  const [members, setMembers]               = useState<Member[]>([]);
  const [loading, setLoading]               = useState(true);
  const [loadError, setLoadError]           = useState<string | null>(null);
  const [sortBy, setSortBy]                 = useState("az");
  const [birthMonth, setBirthMonth]         = useState("all");
  const [weddingMonth, setWeddingMonth]     = useState("all");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [search, setSearch]                 = useState("");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [page, setPage]                     = useState(1);
  const [rowsPerPage, setRowsPerPage]       = useState(10);

  const [aiSummary,   setAiSummary]   = useState('')
  const [summarizing, setSummarizing] = useState(false)

  async function handleSummarize() {
    if (processedMembers.length === 0) return
    setSummarizing(true)
    setAiSummary('')
    try {
      const res = await fetch('/api/ai/summarize-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          members: processedMembers,
          // pass your existing active filters so the summary knows context
          filters: { statusFilter, sortBy, birthMonth, weddingMonth },
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAiSummary(data.summary)
    } catch (err) {
      setAiSummary('Could not generate summary. Please try again.')
    } finally {
      setSummarizing(false)
    }
  }

  /* ─── fetch ─── */
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const data = await fetchAllMembers();
        setMembers(data);
        setLoadError(null);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load members.");
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  /* ─── reset month filters when sort changes ─── */
  useEffect(() => {
    if (sortBy !== "birthdate")    setBirthMonth("all");
    if (sortBy !== "wedding_date") setWeddingMonth("all");
    setPage(1);
  }, [sortBy]);

  useEffect(() => { setPage(1); }, [search, statusFilter, birthMonth, weddingMonth]);

  /* ─── stats ─── */
  const stats = useMemo(() => {
    const total    = members.length;
    const active   = members.filter(m => m.status === "Active").length;
    const inactive = members.filter(m => m.status === "Inactive").length;
    const deceased = members.filter(m => m.status === "Deceased").length;
    const activeRate = total ? Math.round((active / total) * 100) : 0;

    return { total, active, inactive, deceased, activeRate };
  }, [members]);

  /* ─── filtered + sorted members ─── */
  const processedMembers = useMemo(() => {
    let data = [...members];

    // search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(m => {
        const fullName = `${m.last_name} ${m.first_name} ${m.middle_name ?? ""} ${m.suffix ?? ""}`.toLowerCase();
        return (
          fullName.includes(q) ||
          (m.red_book_no ?? "").toLowerCase().includes(q) ||
          (m.fellowship ?? "").toLowerCase().includes(q) ||
          (m.zone ?? "").toLowerCase().includes(q) ||
          (m.occupation ?? "").toLowerCase().includes(q)
        );
      });
    }

    // status filter
    if (statusFilter !== "all") {
      data = data.filter(m => m.status === statusFilter);
    }

    // birth month filter
    if (birthMonth !== "all") {
      data = data.filter(m => {
        if (!m.birthdate) return false;
        const d = new Date(m.birthdate);
        return !isNaN(d.getTime()) && d.getMonth() + 1 === Number(birthMonth);
      });
    }

    // wedding month filter
    if (weddingMonth !== "all") {
      data = data.filter(m => {
        if (!m.wedding_date) return false;
        const d = new Date(m.wedding_date);
        return !isNaN(d.getTime()) && d.getMonth() + 1 === Number(weddingMonth);
      });
    }

    // sort
    const mmdd = (date: string) => {
      const d = new Date(date);
      return (d.getMonth() + 1) * 100 + d.getDate();
    };
    const fullName = (m: Member) =>
      `${m.last_name ?? ""} ${m.first_name ?? ""} ${m.middle_name ?? ""} ${m.suffix ?? ""}`;

    switch (sortBy) {
      case "az":          return data.sort((a, b) => fullName(a).localeCompare(fullName(b)));
      case "za":          return data.sort((a, b) => fullName(b).localeCompare(fullName(a)));
      case "red_book_no": return data.sort((a, b) => (a.red_book_no ?? "").localeCompare(b.red_book_no ?? ""));
      case "birthdate":   return data.sort((a, b) => {
        if (!a.birthdate) return 1; if (!b.birthdate) return -1;
        return mmdd(a.birthdate) - mmdd(b.birthdate);
      });
      case "wedding_date": return data.sort((a, b) => {
        if (!a.wedding_date) return 1; if (!b.wedding_date) return -1;
        return mmdd(a.wedding_date) - mmdd(b.wedding_date);
      });
      default: return data;
    }
  }, [members, search, statusFilter, sortBy, birthMonth, weddingMonth]);

  /* ─── pagination ─── */
  const totalPages = rowsPerPage === -1 ? 1 : Math.max(1, Math.ceil(processedMembers.length / rowsPerPage));
  const paginatedMembers = rowsPerPage === -1
    ? processedMembers
    : processedMembers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  /* ─── column toggle ─── */
  const toggleColumn = (col: string) => {
    setSelectedColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  // ordered by ALL_COLUMNS so table header always matches
  const orderedColumns = ALL_COLUMNS.filter(c => selectedColumns.includes(c));

  /* ─── export CSV ─── */
  const exportCSV = () => {
    const header = ["No.", ...orderedColumns.map(c => COLUMN_LABELS[c])];
    const rows = processedMembers.map((m, i) => {
      const cells = orderedColumns.map(col => {
        switch (col) {
          case "name": return escapeCSV(`${m.last_name ?? ""}, ${m.first_name ?? ""} ${m.middle_name ?? ""} ${m.suffix ?? ""}`.trim());
          case "birthdate":    return escapeCSV(fmtDate(m.birthdate));
          case "wedding_date": return escapeCSV(fmtDate(m.wedding_date));
          default: return escapeCSV((m as Record<string, unknown>)[col]);
        }
      });
      return [i + 1, ...cells];
    });

    const csv = [header, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "uccp-members-report.csv";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  /* ─── cell renderer ─── */
  const renderCell = (m: Member, col: string) => {
    switch (col) {
      case "name":         return `${m.last_name ?? ""}${m.last_name ? ", " : ""}${m.first_name ?? ""} ${m.middle_name ?? ""} ${m.suffix ?? ""}`.trim();
      case "status":       return <StatusBadge status={m.status} />;
      case "birthdate":    return <span className="text-gray-600">{fmtDate(m.birthdate)}</span>;
      case "wedding_date": return <span className="text-gray-600">{fmtDate(m.wedding_date)}</span>;
      default: {
        const val = (m as Record<string, unknown>)[col];
        return <span className="text-gray-600">{val ? String(val) : "—"}</span>;
      }
    }
  };

  /* ─── render ─── */
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">

      {/* ─── header ─── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Reports</h1>
          <p className="text-xs text-gray-400 mt-0.5">Export data, summaries, and member reports</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1a4f7a] text-white rounded-xl text-sm font-semibold hover:bg-[#163f63] transition"
        >
          <Download size={15} strokeWidth={2.5} />
          Export CSV
          {processedMembers.length !== members.length && (
            <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              {processedMembers.length}
            </span>
          )}
        </button>
      </header>

      <main className="p-6 space-y-6 max-w-screen-xl mx-auto w-full">

        {/* ─── KPI cards ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Members" value={stats.total}    icon={Users}      colorClass="bg-slate-100 text-slate-600"  />
          <KpiCard label="Active"        value={stats.active}   icon={UserCheck}  colorClass="bg-green-100 text-green-600"  sub={`${stats.activeRate}% of total`} />
          <KpiCard label="Inactive"      value={stats.inactive} icon={UserX}      colorClass="bg-red-100 text-red-500"      />
          <KpiCard label="Deceased"      value={stats.deceased} icon={Skull}      colorClass="bg-gray-100 text-gray-500"    />
        </div>


        {/* ─── AI Summary button ─── */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Member Report Preview
          </h2>
          <button
            onClick={handleSummarize}
            disabled={summarizing || processedMembers.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl
                      border border-[#c5daf0] bg-[#e8f1f9] text-[#1a4f7a]
                      hover:bg-[#d0e6f5] disabled:opacity-40 transition"
          >
            {summarizing ? (
              <>
                <div style={{width:13,height:13,border:"2px solid rgba(26,79,122,0.2)",
                    borderTopColor:"#1a4f7a",borderRadius:"50%",
                    animation:"spin 0.7s linear infinite"}} />
                Summarizing…
              </>
            ) : (
              <>✦ Summarize with AI</>
            )}
          </button>
        </div>

        {/* ─── AI Summary result ─── */}
        {aiSummary && (
          <div className="mb-5 p-4 bg-[#e8f1f9] border border-[#c5daf0] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a4f7a]">
                AI Summary
              </p>
              <button onClick={() => setAiSummary('')}
                className="text-xs text-[#1a4f7a] hover:underline">Dismiss</button>
            </div>
            <p className="text-sm text-[#1a2744] leading-relaxed">{aiSummary}</p>
          </div>
        )}


        {/* ─── report table ─── */}
        <div className="card p-6">

          {/* toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-5">

            {/* search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a4f7a]/20 focus:border-[#1a4f7a] w-56 transition"
              />
            </div>

            {/* status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a4f7a]/20 focus:border-[#1a4f7a] transition"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Deceased">Deceased</option>
            </select>

            {/* sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a4f7a]/20 focus:border-[#1a4f7a] transition"
            >
              <option value="az">Name (A–Z)</option>
              <option value="za">Name (Z–A)</option>
              <option value="red_book_no">Red Book No.</option>
              <option value="birthdate">Birthdate</option>
              <option value="wedding_date">Wedding Date</option>
            </select>

            {/* conditional month pickers */}
            {sortBy === "birthdate" && (
              <select value={birthMonth} onChange={e => setBirthMonth(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a4f7a]/20 transition">
                <option value="all">All Months</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            )}
            {sortBy === "wedding_date" && (
              <select value={weddingMonth} onChange={e => setWeddingMonth(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a4f7a]/20 transition">
                <option value="all">All Months</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            )}
          </div>

          {/* column toggles */}
          <div className="flex flex-wrap gap-2 mb-5 pb-5 border-b border-gray-100">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 self-center mr-1">Columns</span>
            {OPTIONAL_COLUMNS.map(col => {
              const on = selectedColumns.includes(col);
              return (
                <button
                  key={col}
                  onClick={() => toggleColumn(col)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all
                    ${on
                      ? "bg-[#e8f1f9] text-[#1a4f7a] border-[#c5daf0]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                >
                  {on && <Check size={11} strokeWidth={2.5} />}
                  {COLUMN_LABELS[col]}
                </button>
              );
            })}
          </div>

          {/* table */}
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 w-10">#</th>
                  {orderedColumns.map(col => (
                    <th key={col} className="pb-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">
                      {COLUMN_LABELS[col]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={orderedColumns.length + 1} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-[#c5daf0] border-t-[#1a4f7a] rounded-full animate-spin" />
                        <p className="text-sm text-gray-500">Loading members…</p>
                      </div>
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={orderedColumns.length + 1} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-sm text-gray-500">Failed to load members: {loadError}</p>
                        <button
                          className="text-sm px-4 py-2 rounded bg-gray-900 text-white"
                          onClick={() => window.location.reload()}
                        >
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={orderedColumns.length + 1} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <SearchX size={28} className="opacity-50" />
                        <p className="text-sm font-medium text-gray-500">No records found</p>
                        <p className="text-xs">Try adjusting your filters or search query</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((m, i) => {
                    const rowNum = rowsPerPage === -1 ? i + 1 : (page - 1) * rowsPerPage + i + 1;
                    return (
                      <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 pr-4 text-xs text-gray-400 font-medium">{rowNum}</td>
                        {orderedColumns.map(col => (
                          <td key={col} className="py-3 pr-4 text-sm text-gray-800 whitespace-nowrap">
                            {renderCell(m, col)}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          {!loading && processedMembers.length > 0 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Rows per page</span>
                <select
                  value={rowsPerPage}
                  onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={-1}>All</option>
                </select>
                <span className="ml-2">
                  {rowsPerPage === -1
                    ? `${processedMembers.length} records`
                    : `${Math.min((page - 1) * rowsPerPage + 1, processedMembers.length)}–${Math.min(page * rowsPerPage, processedMembers.length)} of ${processedMembers.length}`}
                </span>
              </div>

              {rowsPerPage !== -1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pg = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page + i - 2;
                    if (pg < 1 || pg > totalPages) return null;
                    return (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold border transition
                          ${pg === page ? "bg-[#1a4f7a] text-white border-[#1a4f7a]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                      >
                        {pg}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}