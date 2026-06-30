// app/dashboard/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchAllMembers } from "@/app/lib/api/members";
import type { Member } from "@/app/lib/types";
import { getAge, getInitials, fmtShort, fmtDate } from "@/app/lib/utils";
import KpiCard from "@/app/components/ui/KpiCard";
import MemberLinkPanel from "@/app/members/dashboard/components/MemberLinkPanel"; 
import MemberQA from "@/app/members/dashboard/components/MemberQA";
import { useRouter } from "next/navigation";
import {
  UserPlus, BarChart3, ArrowRight, Cake, Heart,
  Users, UserCheck, UserX, Skull, TrendingUp,
  Phone, Droplets, CalendarDays, Copy,
} from "lucide-react";

function SegBar({
  label, value, total, colorClass,
}: {
  label: string; value: number; total: number; colorClass: string;
}) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-700">{value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── main page ──────────────────────────────────────── */
export default function HomePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const router = useRouter();
  const [showDuplicates, setShowDuplicates] = useState(false);


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

  /* ─── memoised stats ─── */
  const stats = useMemo(() => {
    const now = new Date();
    const thisM = now.getMonth(), thisY = now.getFullYear();

    const total     = members.length;
    const active    = members.filter(m => m.status === "Active").length;
    const inactive  = members.filter(m => m.status === "Inactive").length;
    const deceased  = members.filter(m => m.status === "Deceased").length;

    const newThisMonth = members.filter(m => {
      if (!m.created_at) return false;
      const d = new Date(m.created_at);
      return d.getMonth() === thisM && d.getFullYear() === thisY;
    }).length;

    const lastMonthCount = members.filter(m => {
      if (!m.created_at) return false;
      const d = new Date(m.created_at);
      const lm = thisM === 0 ? 11 : thisM - 1;
      const ly = thisM === 0 ? thisY - 1 : thisY;
      return d.getMonth() === lm && d.getFullYear() === ly;
    }).length;

    const growthRate = lastMonthCount === 0
      ? (newThisMonth > 0 ? "+100%" : "—")
      : `${newThisMonth >= lastMonthCount ? "+" : ""}${(((newThisMonth - lastMonthCount) / lastMonthCount) * 100).toFixed(1)}%`;

    const fellowshipCounts: Record<string, number> = {};
    members.forEach(m => {
      if (m.fellowship) fellowshipCounts[m.fellowship] = (fellowshipCounts[m.fellowship] ?? 0) + 1;
    });
    const topFellowship = Object.entries(fellowshipCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    const upcomingBirthdays = members
      .filter(m => m.birthdate)
      .map(m => {
        const b = new Date(m.birthdate!);
        let next = new Date(thisY, b.getMonth(), b.getDate());
        if (next < now) next = new Date(thisY + 1, b.getMonth(), b.getDate());
        const diff = Math.floor((next.getTime() - now.getTime()) / 86_400_000);
        return { m, diff };
      })
      .filter(x => x.diff >= 0 && x.diff <= 7)
      .sort((a, b) => a.diff - b.diff);

    let children = 0, youth = 0, adults = 0, seniors = 0;
    members.forEach(m => {
      if (!m.birthdate) return;
      const age = getAge(m.birthdate);
      if (age <= 12) children++;
      else if (age <= 30) youth++;
      else if (age <= 60) adults++;
      else seniors++;
    });
    const segTotal = children + youth + adults + seniors;

    const missingBirthdate  = members.filter(m => !m.birthdate).length;
    const missingBloodType  = members.filter(m => !m.blood_type).length;
    const missingMobileNum  = members.filter(m => !m.mobile_num).length;
    const counts = members.reduce<Record<string, number>>((acc, member) => {
      const key = [
        member.first_name,
        member.middle_name || "",
        member.last_name,
        member.suffix || ""
      ].join(" ");

      acc[key] = (acc[key] || 0) + 1;

      return acc;
    }, {});

    const duplicateNames = Object.entries(counts)
      .filter(([_, count]) => count > 1)
      .map(([name, count]) => ({
        name,
        count
      }));

    const duplicateNameCount = duplicateNames.length;

    const activeRate = total ? Math.round((active / total) * 100) : 0;
    const insightMembership =
      activeRate >= 80 ? "Strong active membership rate — healthy engagement and retention across all fellowships."
      : activeRate >= 50 ? "Moderate activity rate. Consider targeted re-engagement programs for inactive members."
      : "A large portion are inactive. Focus on outreach and community revival activities.";

    const insightFellowship = topFellowship !== "—"
      ? `${topFellowship} leads in participation — a strong community anchor worth celebrating.`
      : "No fellowship data available yet. Assign fellowships to members to unlock insights.";

    const insightGrowth = newThisMonth >= 10
      ? "Strong intake this month — your church is growing steadily."
      : newThisMonth >= 3
        ? "Moderate growth this month. Consistent onboarding is being maintained."
        : "Low new member intake this month. Consider outreach or community events.";

    return {
      total, active, inactive, deceased, newThisMonth,
      growthRate, topFellowship, upcomingBirthdays,
      children, youth, adults, seniors, segTotal,
      missingBirthdate, missingBloodType, missingMobileNum, duplicateNames, duplicateNameCount,
      insightMembership, insightFellowship, insightGrowth,
      activeRate,
    };
  }, [members]);

  /* ─── calendar data ─── */
  const calData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear(), month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const bdMap: Record<number, Member[]> = {};
    const wdMap: Record<number, Member[]> = {};

    members.forEach(m => {
      if (m.birthdate) {
        const d = new Date(m.birthdate);
        if (d.getMonth() === month) {
          bdMap[d.getDate()] = [...(bdMap[d.getDate()] ?? []), m];
        }
      }
      if (m.wedding_date) {
        const d = new Date(m.wedding_date);
        if (d.getMonth() === month) {
          wdMap[d.getDate()] = [...(wdMap[d.getDate()] ?? []), m];
        }
      }
    });

    return { firstDay, daysInMonth, bdMap, wdMap, year, month };
  }, [members]);

  /* ─── recent activity ─── */
  const recentActivity = useMemo(() => {
    return [...members]
      .filter((m): m is Member & { created_at: string } => !!m.created_at)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
      .slice(0, 6);
  }, [members]);
  
  const todayStr = fmtDate(new Date().toISOString());

  /* ─── loading skeleton ─── */
  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <div className="h-6 w-32 bg-gray-100 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
      </header>
      <main className="p-6 space-y-6">
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-5 h-28 animate-pulse bg-gray-50" />
          ))}
        </div>
      </main>
    </div>
  );

  if (loadError) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm text-gray-600">Failed to load members: {loadError}</p>
      <button
        className="text-sm px-4 py-2 rounded bg-gray-900 text-white"
        onClick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">

      {/* ─── header ─── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">Overview & analytics</p>
        </div>
        <div className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
          {todayStr}
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-screen-xl mx-auto w-full">

        {/* ─── KPI cards ─── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KpiCard label="Total Members"  value={stats.total}        icon={Users}       colorClass="bg-slate-100 text-slate-600"  />
          <KpiCard label="Active"         value={stats.active}       icon={UserCheck}   colorClass="bg-green-100 text-green-600"  sub={`${stats.activeRate}% of total`} />
          <KpiCard label="Inactive"       value={stats.inactive}     icon={UserX}       colorClass="bg-red-100 text-red-500"      />
          <KpiCard label="Deceased"       value={stats.deceased}     icon={Skull}       colorClass="bg-gray-100 text-gray-500"    />
          <KpiCard label="New This Month" value={stats.newThisMonth} icon={TrendingUp}  colorClass="bg-[#e8f1f9] text-[#1a4f7a]" sub={`Growth: ${stats.growthRate}`} />
        </div>

        {/* ─── middle row ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* welcome + mini insights */}
          <div className="card lg:col-span-2 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Welcome back!</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Manage members, track demographics, and organize church activities —
              baptisms, weddings, and events — all in one place.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Top Fellowship",
                  value: stats.topFellowship,
                  color: "bg-[#e8f1f9]",
                  text: "text-[#1a4f7a]",
                },
                {
                  label: "Birthdays This Month",
                  value: members.filter(m => {
                    if (!m.birthdate) return false;
                    return new Date(m.birthdate).getMonth() === new Date().getMonth();
                  }).length,
                  color: "bg-amber-50",
                  text: "text-amber-700",
                },
                {
                  label: "Growth Rate",
                  value: stats.growthRate,
                  color: "bg-green-50",
                  text: "text-green-700",
                },
              ].map(item => (
                <div key={item.label} className={`${item.color} rounded-xl p-4`}>
                  <p className="text-[11px] text-gray-500 font-medium mb-1.5">{item.label}</p>
                  <p className={`text-base font-bold ${item.text} truncate`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* quick actions */}
          <div className="card p-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Quick Actions</h3>
            <div className="space-y-2.5">

              <a
              
                href="/members/new"
                className="flex items-center justify-between p-3 rounded-xl bg-[#1a4f7a] text-white hover:bg-[#163f63] transition">
                <span className="text-sm font-semibold">Add Member</span>
                <UserPlus size={16} strokeWidth={2.5} />
              </a>
              
              <a
                href="/members"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition text-gray-700">
              
                <span className="text-sm font-medium">View All Members</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </a>
              <button
                onClick={() => router.push("/members/reports")}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition w-full text-gray-700"
              >
                <span className="text-sm font-medium">Reports</span>
                <BarChart3 size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

        </div>

        {/* ─── insights ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              tag: "Membership",
              text: stats.insightMembership,
              tagColor: "text-[#1a4f7a] bg-[#e8f1f9]",
              border: "border-[#c5daf0]",
            },
            {
              tag: "Fellowship",
              text: stats.insightFellowship,
              tagColor: "text-amber-700 bg-amber-50",
              border: "border-amber-200",
            },
            {
              tag: "Growth",
              text: stats.insightGrowth,
              tagColor: "text-green-700 bg-green-50",
              border: "border-green-200",
            },
          ].map(card => (
            <div key={card.tag} className={`bg-white border ${card.border} p-5 rounded-2xl`}>
              <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-3 ${card.tagColor}`}>
                {card.tag}
              </span>
              <p className="text-sm text-gray-600 leading-relaxed">{card.text}</p>
            </div>
          ))}
        </div>

        {/* ─── segmentation + data quality ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* segmentation */}
          <div className="card p-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
              Member Segmentation by Age
            </h2>
            <div className="space-y-4">
              <SegBar label="Children (0–12)"  value={stats.children} total={stats.segTotal} colorClass="bg-yellow-400" />
              <SegBar label="Youth (13–30)"    value={stats.youth}    total={stats.segTotal} colorClass="bg-orange-400" />
              <SegBar label="Adults (31–60)"   value={stats.adults}   total={stats.segTotal} colorClass="bg-[#1a4f7a]"  />
              <SegBar label="Seniors (61+)"    value={stats.seniors}  total={stats.segTotal} colorClass="bg-teal-500"   />
            </div>
            {stats.segTotal === 0 && (
              <p className="text-sm text-gray-400 mt-4">No birthdate data available yet.</p>
            )}
          </div>

          {/* data quality */}
          <div className="card p-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
              Data Quality
            </h2>
            <div className="space-y-3">
              {[
                { label: "Missing Birthdates",      value: stats.missingBirthdate,   icon: CalendarDays, color: "text-red-500",    bg: "bg-red-50"    },
                { label: "Missing Blood Type",       value: stats.missingBloodType,   icon: Droplets,    color: "text-blue-500",   bg: "bg-blue-50"   },
                { label: "Missing Contact Number",   value: stats.missingMobileNum,   icon: Phone,       color: "text-amber-600",  bg: "bg-amber-50"  },
                { label: "Possible Duplicate Names", value: stats.duplicateNameCount, icon: Copy,        color: "text-purple-600", bg: "bg-purple-50" },
              ].map(({ label, value, icon: Icon, color, bg }) => {
                const isDuplicateRow = label === "Possible Duplicate Names";
                const isToggled = isDuplicateRow && showDuplicates;

                return (
                  <div key={label}>
                    <div
                      className={`flex items-center gap-3 p-3 rounded-xl bg-gray-50 ${isDuplicateRow && value > 0 ? "cursor-pointer hover:bg-gray-100 transition" : ""}`}
                      onClick={() => isDuplicateRow && value > 0 && setShowDuplicates(prev => !prev)}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg} ${color}`}>
                        <Icon size={15} strokeWidth={2} />
                      </span>
                      <span className="text-sm text-gray-600 flex-1">{label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold ${value > 0 ? color : "text-green-500"}`}>
                          {value > 0 ? value : "✓"}
                        </span>
                        {isDuplicateRow && value > 0 && (
                          <span className={`text-purple-400 text-xs transition-transform duration-200 inline-block ${isToggled ? "rotate-180" : ""}`}>
                            ▾
                          </span>
                        )}
                      </div>
                    </div>

                    {isDuplicateRow && isToggled && (
                      <ul className="mt-1 mb-1 space-y-1.5 px-1">
                        {stats.duplicateNames.map((dup) => (
                          <li
                            key={dup.name}
                            className="flex justify-between items-center bg-purple-50 px-3 py-2 rounded-lg text-sm"
                          >
                            <span>{dup.name}</span>
                            <span className="font-semibold text-purple-600">{dup.count} records</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* ─── member account linking ─── */}
        <div className="card p-6">
          <MemberLinkPanel />   
        </div>

        {/* ─── birthday calendar ─── */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Birthday & Anniversary Calendar
            </h3>
            <span className="text-xs text-gray-400 font-medium">
              {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
            </span>
          </div>

          {/* day labels */}
          <div className="grid grid-cols-7 gap-1.5 text-center mb-1.5">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} className="text-[10px] font-semibold text-gray-400 pb-1">{d}</div>
            ))}
          </div>

          {/* day cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: calData.firstDay }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: calData.daysInMonth }, (_, i) => i + 1).map(day => {
              const bds = calData.bdMap[day]?.length ?? 0;
              const wds = calData.wdMap[day]?.length ?? 0;
              const isToday = day === new Date().getDate();
              const selected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(selected ? null : day)}
                  className={`h-14 rounded-xl border text-left p-1.5 flex flex-col justify-between transition-all
                    ${selected ? "ring-2 ring-[#1a4f7a] border-[#1a4f7a]" : ""}
                    ${isToday ? "border-[#1a4f7a] bg-[#e8f1f9]" : bds > 0 || wds > 0 ? "border-sky-200 bg-sky-50" : "border-gray-100 bg-white hover:bg-gray-50"}
                  `}
                >
                  <span className={`text-[11px] font-semibold ${isToday ? "text-[#1a4f7a]" : "text-gray-600"}`}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {bds > 0 && (
                      <div className="flex items-center gap-0.5 text-[9px] text-sky-600 font-semibold">
                        <Cake size={9} /> {bds}
                      </div>
                    )}
                    {wds > 0 && (
                      <div className="flex items-center gap-0.5 text-[9px] text-rose-500 font-semibold">
                        <Heart size={9} /> {wds}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* day detail */}
          {selectedDay && (
            <div className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                {new Date().toLocaleString("en-US", { month: "long" })} {selectedDay}
              </h4>

              {/* birthdays */}
              {(calData.bdMap[selectedDay]?.length ?? 0) > 0 ? (
                <div>
                  <p className="text-[11px] font-bold text-sky-600 uppercase tracking-wider mb-2">Birthdays</p>
                  <div className="space-y-1.5">
                    {calData.bdMap[selectedDay].map(m => (
                      <div key={m.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center text-[9px] font-bold text-sky-700 flex-shrink-0">
                          {getInitials(m.first_name, m.last_name)}
                        </div>
                        <span className="text-sm text-gray-700">
                          {m.first_name} {m.middle_name} {m.last_name} {m.suffix}
                        </span>
                        {m.birthdate && (
                          <span className="ml-auto text-xs text-gray-400">Age {getAge(m.birthdate)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No birthdays on this day.</p>
              )}

              {/* anniversaries */}
              {(calData.wdMap[selectedDay]?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider mb-2">Anniversaries</p>
                  <div className="space-y-1.5">
                    {calData.wdMap[selectedDay].map(m => (
                      <div key={m.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                          <Heart size={10} className="text-rose-500" />
                        </div>
                        <span className="text-sm text-gray-700">
                          {m.first_name} {m.middle_name} {m.last_name} {m.suffix}
                        </span>
                        {m.wedding_date && (
                          <span className="ml-auto text-xs text-gray-400">
                            {new Date().getFullYear() - new Date(m.wedding_date).getFullYear()} yrs
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── upcoming birthdays ─── */}
        <div className="card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Upcoming Birthdays <span className="text-gray-300 font-normal">(next 7 days)</span>
          </h3>

          {stats.upcomingBirthdays.length === 0 ? (
            <p className="text-sm text-gray-400">No birthdays in the next 7 days.</p>
          ) : (
            <div className="space-y-2">
              {stats.upcomingBirthdays.map(({ m, diff }) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                  <div className="w-8 h-8 rounded-full bg-[#e8f1f9] flex items-center justify-center text-xs font-bold text-[#1a4f7a] flex-shrink-0">
                    {getInitials(m.first_name, m.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {m.first_name} {m.middle_name} {m.last_name} {m.suffix}
                    </p>
                    {m.birthdate && (
                      <p className="text-xs text-gray-400">Turns {getAge(m.birthdate) + 1}</p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                    ${diff === 0 ? "bg-amber-100 text-amber-700" : "bg-[#e8f1f9] text-[#1a4f7a]"}`}>
                    {diff === 0 ? "Today!" : `in ${diff}d`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── recent activity ─── */}
        <div className="card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Recent Activity</h3>

          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400">No recent activity.</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                    {getInitials(m.first_name, m.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {m.first_name} {m.middle_name} {m.last_name} {m.suffix}
                    </p>
                    <p className="text-xs text-gray-400">Member record added</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0
                    ${m.status === "Active"   ? "bg-green-50 text-green-600"
                    : m.status === "Inactive" ? "bg-red-50 text-red-500"
                    :                           "bg-gray-100 text-gray-500"}`}>
                    {m.status}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                    {fmtShort(m.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Ask About Your Congregation
          </h3>
          <MemberQA />
        </div>

      </main>
    </div>
  );
}