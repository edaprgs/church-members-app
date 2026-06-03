'use client'

import { useState, useEffect } from "react"
import { fetchAllMembers } from "@/app/lib/api/members"  
import type { Member } from "@/app/lib/types"    
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
} from "lucide-react"         

// Builds safe aggregate stats from your Member type
function computeStats(members: Member[]) {
  const count = (key: keyof Member) =>
    members.reduce((acc: Record<string, number>, m) => {
      const val = (m[key] as string) || 'Unknown'
      acc[val] = (acc[val] || 0) + 1
      return acc
    }, {})

  return {
    totalMembers:   members.length,
    byStatus:       count('status'),
    byFellowship:   count('fellowship'),
    byAgeGroup:     count('age_group'),
    byZone:         count('zone'),
    bySex:          count('sex'),
    byCivilStatus:  count('civil_status'),
  }
}

type QAPair = { question: string; answer: string }

export default function MemberQA() {
  const [stats,        setStats]        = useState<object | null>(null)
  const [question,     setQuestion]     = useState('')
  const [history,      setHistory]      = useState<QAPair[]>([])
  const [loading,      setLoading]      = useState(false)
  const [loadingStats, setLoadingStats] = useState(true)

  // Load and cache stats once on mount using your existing fetchAllMembers()
  useEffect(() => {
    fetchAllMembers()
      .then(members => { setStats(computeStats(members)); setLoadingStats(false) })
      .catch(() => setLoadingStats(false))
  }, [])

  async function ask() {
    if (!question.trim() || !stats || loading) return
    const q = question.trim()
    setQuestion('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/member-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, stats }),
      })
      const data = await res.json()
      setHistory(prev => [...prev, {
        question: q,
        answer: data.answer || data.error || 'No answer received.',
      }])
    } catch {
      setHistory(prev => [...prev, { question: q, answer: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  if (loadingStats) return (
    <div className="card p-6">
      <p className="text-sm text-gray-500">Loading member data...</p>
    </div>
  )

  return (
    <div className="card overflow-hidden"> 

        {/* Privacy Notice */}
        <div className="mx-5 mt-5 rounded-xl border border-[#c5daf0] bg-[#e8f1f9] p-4">
        <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={18} className="text-[#1a4f7a]" />
            <h3 className="text-sm font-semibold text-[#1a2744]">
            Privacy & Data Safety
            </h3>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-4">
            This AI assistant only receives anonymous aggregate statistics from the
            congregation database. No personally identifiable member information is
            sent to the AI provider.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
            {/* Safe */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-green-600" />
                <p className="text-sm font-semibold text-green-700">
                Safe to Send
                </p>
            </div>

            <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 text-green-500 shrink-0" />
                <span>Counts by status, fellowship, age group, and zone</span>
                </li>

                <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 text-green-500 shrink-0" />
                <span>Aggregate breakdowns (e.g. 40 active, 12 inactive)</span>
                </li>

                <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 text-green-500 shrink-0" />
                <span>Fellowship and zone distribution</span>
                </li>

                <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 text-green-500 shrink-0" />
                <span>Civil status and sex counts</span>
                </li>
            </ul>
            </div>

            {/* Not Sent */}
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-2 mb-2">
                <XCircle size={16} className="text-red-600" />
                <p className="text-sm font-semibold text-red-700">
                Never Sent
                </p>
            </div>

            <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                <Lock size={14} className="mt-0.5 text-red-500 shrink-0" />
                <span>Full names and email addresses</span>
                </li>

                <li className="flex items-start gap-2">
                <Lock size={14} className="mt-0.5 text-red-500 shrink-0" />
                <span>Phone numbers and home addresses</span>
                </li>

                <li className="flex items-start gap-2">
                <Lock size={14} className="mt-0.5 text-red-500 shrink-0" />
                <span>Member UUIDs or Supabase Auth IDs</span>
                </li>

                <li className="flex items-start gap-2">
                <Lock size={14} className="mt-0.5 text-red-500 shrink-0" />
                <span>Full birthdates, family records, and children data</span>
                </li>
            </ul>
            </div>
        </div>
        </div>

        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                ✦ Ask About Your Members
            </p>
            <p className="text-sm text-gray-500">
                Ask questions about membership statistics and congregation data.
            </p>
        </div>

      {/* Q&A history */}
      {history.length > 0 && (
        <div className="max-h-[320px] overflow-y-auto p-5">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.map((item, i) => (
              <div key={i}>
                <p className="text-xs font-semibold text-gray-500 mb-1">
                    {item.question}
                </p>
                <div className="pl-3 border-l-2 border-[#c5daf0]">
                    <p className="text-sm text-[#1a2744] leading-relaxed">
                        {item.answer}
                    </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div
                        className="w-3 h-3 rounded-full border-2 border-[#c5daf0] border-t-[#1a2744]"
                        style={{
                        animation: "spin .8s linear infinite",
                        }}
                    />
                    Thinking...
                </div>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div
            className={`p-5 flex gap-3 ${
                history.length > 0 ? "border-t border-gray-100" : ""
            }`}
            >
        <div className="flex-1">
            <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask()}
                placeholder="Ask a question about your congregation..."
                disabled={loading}
                className="reg-input"
            />
        </div>
        <button
            onClick={ask}
            disabled={loading || !question.trim()}
            className="reg-submit"
            style={{
                width: "auto",
                minWidth: "120px",
                padding: "0 20px",
            }}
            >
            {loading ? "Thinking..." : "Ask"}
        </button>
      </div>

    </div>
  )
}