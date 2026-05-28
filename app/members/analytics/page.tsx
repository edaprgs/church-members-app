// app/analytics/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import type { Member } from "@/app/lib/types";
import { fetchAllMembers } from "@/app/lib/api/members";
import { getAge } from "@/app/lib/utils";
import KpiCard from "@/app/components/ui/KpiCard";
import {
  Users, UserCheck, UserX, Venus, Mars, Cake
} from "lucide-react";

const FELLOWSHIP_COLORS = [
  "bg-[#1a4f7a]", "bg-teal-500", "bg-amber-400",
  "bg-rose-400",  "bg-violet-500", "bg-sky-400",
  "bg-emerald-500", "bg-orange-400",
];

const AGE_COLORS = ["bg-yellow-400", "bg-orange-400", "bg-[#1a4f7a]", "bg-teal-500"];

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ─── main ────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading]   = useState(true);
  const [chartYear, setChartYear] = useState(new Date().getFullYear());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  useEffect(() => {
    const loadMembers = async () => {
      const data = await fetchAllMembers();
      setMembers(data);
      setLoading(false);
    };

    loadMembers();
  }, []);

  /* ─── available years for the chart filter ─── */
  const availableYears = useMemo(() => {
    const yrs = new Set<number>();
    members.forEach(m => {
      if (m.created_at) yrs.add(new Date(m.created_at).getFullYear());
    });
    return [...yrs].sort((a, b) => b - a);
  }, [members]);

  /* ─── all stats ─── */
  const stats = useMemo(() => {
    const total    = members.length;
    const active   = members.filter(m => m.status === "Active").length;
    const inactive = members.filter(m => m.status === "Inactive").length;
    const male     = members.filter(m => m.sex === "Male").length;
    const female   = members.filter(m => m.sex === "Female").length;
    const activeRate = total ? Math.round((active / total) * 100) : 0;
    const malePct    = total ? Math.round((male / total) * 100) : 0;
    const femalePct  = total ? Math.round((female / total) * 100) : 0;

    // monthly growth for selected year
    const monthlyCounts = Array(12).fill(0);
    members.forEach(m => {
      if (!m.created_at) return;
      const d = new Date(m.created_at);
      if (d.getFullYear() === chartYear) monthlyCounts[d.getMonth()]++;
    });
    const maxMonthly = Math.max(...monthlyCounts, 1);
    const monthlyGrowth = MONTH_LABELS.map((month, i) => ({
      month, value: monthlyCounts[i],
      pct: Math.round((monthlyCounts[i] / maxMonthly) * 100),
    }));

    // fellowship
    const fMap: Record<string, number> = {};
    members.forEach(m => {
      if (m.fellowship) fMap[m.fellowship] = (fMap[m.fellowship] ?? 0) + 1;
    });
    const fellowshipStats = Object.entries(fMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, pct: total ? Math.round((count / total) * 100) : 0 }));

    // age groups
    const ageGroups = { "Children (0–12)": 0, "Youth (13–30)": 0, "Adults (31–60)": 0, "Seniors (61+)": 0 };

    members.forEach(m => {
      if (!m.birthdate) return;
      const age = getAge(m.birthdate);
      if (age <= 12)      ageGroups["Children (0–12)"]++;
      else if (age <= 30) ageGroups["Youth (13–30)"]++;
      else if (age <= 60) ageGroups["Adults (31–60)"]++;
      else                ageGroups["Seniors (61+)"]++;
    });
    const ageTotal = Object.values(ageGroups).reduce((a, b) => a + b, 0);
    const ageData = Object.entries(ageGroups).map(([label, count], i) => ({
      label, count, color: AGE_COLORS[i],
      pct: ageTotal ? Math.round((count / ageTotal) * 100) : 0,
    }));

    // birthday heatmap (day-of-month across all months)
    const bdMap: Record<number, number> = {};
    members.forEach(m => {
      if (!m.birthdate) return;
      const day = new Date(m.birthdate).getDate();
      bdMap[day] = (bdMap[day] ?? 0) + 1;
    });
    const maxBd = Math.max(...Object.values(bdMap), 1);

    // insights
    const insightEngagement = activeRate >= 70
      ? "Strong church engagement — most members are active."
      : "Engagement is moderate. Targeted outreach may help.";
    const insightFellowship = fellowshipStats[0]
      ? `${fellowshipStats[0].name} leads with ${fellowshipStats[0].count} members (${fellowshipStats[0].pct}%).`
      : "No fellowship data available yet.";
    const totalThisYear = monthlyCounts.reduce((a, b) => a + b, 0);
    const insightGrowth = totalThisYear >= 20
      ? `Strong growth in ${chartYear} — ${totalThisYear} new members added.`
      : totalThisYear >= 5
        ? `Steady growth in ${chartYear} — ${totalThisYear} new members.`
        : `Low intake in ${chartYear}. Consider community outreach events.`;

    return {
      total, active, inactive, male, female,
      activeRate, malePct, femalePct,
      monthlyGrowth, maxMonthly,
      fellowshipStats, ageData, ageTotal,
      bdMap, maxBd,
      insightEngagement, insightFellowship, insightGrowth,
    };
  }, [members, chartYear]);

  /* ─── loading ─── */
  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card p-5 h-28 animate-pulse bg-gray-50" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">

      {/* ─── header ─── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Analytics</h1>
        <p className="text-xs text-gray-400 mt-0.5">Church insights, trends, and demographic data</p>
      </header>

      <div className="p-6 space-y-6 max-w-screen-xl mx-auto">

        {/* ─── KPI cards ─── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KpiCard label="Total Members"  value={stats.total}    icon={Users}      colorClass="bg-slate-100 text-slate-600"  />
          <KpiCard label="Active"         value={stats.active}   icon={UserCheck}  colorClass="bg-green-100 text-green-600"  sub={`${stats.activeRate}% of total`} />
          <KpiCard label="Inactive"       value={stats.inactive} icon={UserX}      colorClass="bg-red-100 text-red-500"      />
          <KpiCard label="Male"           value={stats.male}     icon={Mars}       colorClass="bg-[#e8f1f9] text-[#1a4f7a]" sub={`${stats.malePct}%`} />
          <KpiCard label="Female"         value={stats.female}   icon={Venus}      colorClass="bg-pink-100 text-pink-500"    sub={`${stats.femalePct}%`} />
        </div>

        {/* ─── growth + insights ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* bar chart */}
          <div className="card lg:col-span-2 p-6">
            <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Membership Growth</h2>
                <p className="text-xs text-gray-400 mt-0.5">Monthly registrations — {chartYear}</p>
              </div>
              {/* year tabs */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                {(availableYears.length ? availableYears : [new Date().getFullYear()]).map(yr => (
                  <button
                    key={yr}
                    onClick={() => setChartYear(yr)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all
                      ${chartYear === yr ? "bg-white text-[#1a4f7a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            {/* y-axis reference lines */}
            <div className="relative h-52">
              {[0, 25, 50, 75, 100].map(line => (
                <div
                  key={line}
                  className="absolute w-full border-t border-dashed border-gray-100"
                  style={{ bottom: `${line}%` }}
                >
                  <span className="absolute -left-1 -top-2.5 text-[9px] text-gray-300 translate-x-[-100%]">
                    {Math.round((line / 100) * stats.maxMonthly)}
                  </span>
                </div>
              ))}

              {/* bars */}
              <div className="absolute inset-0 flex items-end gap-2 pl-4">
                {stats.monthlyGrowth.map(item => (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <span className="text-[10px] font-semibold text-[#1a4f7a] opacity-0 group-hover:opacity-100 transition">
                      {item.value}
                    </span>
                    <div
                      className="w-full rounded-t-lg bg-[#1a4f7a] hover:bg-[#163f63] transition-all duration-300 min-h-[4px]"
                      style={{ height: `${item.pct}%` }}
                    />
                    <span className="text-[9px] text-gray-400">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* insights */}
          <div className="card p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Insights</h2>
            <div className="space-y-3">
              {[
                { tag: "Engagement", text: stats.insightEngagement, tagCls: "text-[#1a4f7a] bg-[#e8f1f9]", border: "border-[#c5daf0]" },
                { tag: "Fellowship", text: stats.insightFellowship, tagCls: "text-amber-700 bg-amber-50",    border: "border-amber-200" },
                { tag: "Growth",     text: stats.insightGrowth,     tagCls: "text-green-700 bg-green-50",    border: "border-green-200" },
              ].map(c => (
                <div key={c.tag} className={`border ${c.border} rounded-xl p-4`}>
                  <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-2 ${c.tagCls}`}>
                    {c.tag}
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ─── fellowship + age + gender ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* fellowship */}
          <div className="card p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Fellowship Distribution</h2>
            {stats.fellowshipStats.length === 0 ? (
              <p className="text-sm text-gray-400">No fellowship data yet.</p>
            ) : (
              <div className="space-y-4">
                {stats.fellowshipStats.map(({ name, count, pct }, i) => (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-600 font-medium truncate pr-2">{name}</span>
                      <span className="text-gray-400 flex-shrink-0">{count} <span className="text-gray-300">({pct}%)</span></span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${FELLOWSHIP_COLORS[i % FELLOWSHIP_COLORS.length]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* age groups */}
          <div className="card p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Age Groups</h2>
            {stats.ageTotal === 0 ? (
              <p className="text-sm text-gray-400">No birthdate data yet.</p>
            ) : (
              <div className="space-y-4">
                {stats.ageData.map(({ label, count, pct, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-600 font-medium">{label}</span>
                      <span className="text-gray-400">{count} <span className="text-gray-300">({pct}%)</span></span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* gender */}
          <div className="card p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Gender Distribution</h2>
            <div className="space-y-5">

              {/* split pill bar */}
              <div>
                <div className="flex h-5 rounded-full overflow-hidden gap-0.5 mb-3">
                  <div
                    className="bg-[#1a4f7a] transition-all duration-700 rounded-l-full"
                    style={{ width: `${stats.malePct}%` }}
                  />
                  <div
                    className="bg-pink-400 transition-all duration-700 rounded-r-full"
                    style={{ width: `${stats.femalePct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1a4f7a] inline-block" />
                    <span className="text-gray-600">Male</span>
                    <span className="font-bold text-gray-900">{stats.male}</span>
                    <span className="text-gray-400">({stats.malePct}%)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-gray-400">({stats.femalePct}%)</span>
                    <span className="font-bold text-gray-900">{stats.female}</span>
                    <span className="text-gray-600">Female</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-400 inline-block" />
                  </span>
                </div>
              </div>

              {/* donut-style rings */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  { label: "Male",   value: stats.malePct,   color: "text-[#1a4f7a]", bg: "bg-[#e8f1f9]" },
                  { label: "Female", value: stats.femalePct, color: "text-pink-500",   bg: "bg-pink-50"   },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                    <p className={`text-2xl font-bold ${color}`}>{value}%</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ─── birthday heatmap ─── */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Birthday Heatmap</h2>
              <p className="text-xs text-gray-400 mt-0.5">Member birthdays by day of month</p>
            </div>
            {/* legend */}
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              {["None", "1", "2", "3+"].map((label, i) => (
                <span key={label} className="flex items-center gap-1">
                  <span className={`w-3 h-3 rounded-sm inline-block ${
                    i === 0 ? "bg-gray-100"
                    : i === 1 ? "bg-[#c5daf0]"
                    : i === 2 ? "bg-[#1a4f7a]/60"
                    :           "bg-[#1a4f7a]"
                  }`} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 sm:grid-cols-11 lg:grid-cols-16 gap-2">
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
              const count = stats.bdMap[day] ?? 0;
              const intensity =
                count === 0 ? "bg-gray-100 border-gray-100 text-gray-400"
                : count === 1 ? "bg-[#c5daf0] border-[#a8c8e8] text-[#1a4f7a]"
                : count === 2 ? "bg-[#1a4f7a]/40 border-[#1a4f7a]/30 text-[#1a4f7a]"
                :               "bg-[#1a4f7a] border-[#163f63] text-white";

              return (
                <div
                  key={day}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`relative h-14 rounded-xl border flex flex-col items-center justify-center transition-all cursor-default ${intensity}`}
                >
                  <span className="text-xs font-semibold">{day}</span>
                  {count > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold mt-0.5 opacity-80">
                      {count}
                      <Cake size={9} />
                    </span>
                  )}
                  {hoveredDay === day && count > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-1 rounded-lg whitespace-nowrap z-10">
                      {count} birthday{count > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

