import { GoogleGenAI } from "@google/genai"
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/app/lib/supabase-server"

// Builds safe aggregate stats — never sends names, contacts, or UUIDs
function buildStats(members: any[]) {
  const total = members.length
  const byStatus:     Record<string, number> = {}
  const byFellowship: Record<string, number> = {}
  const byAgeGroup:   Record<string, number> = {}
  const byZone:       Record<string, number> = {}
  const bySex:        Record<string, number> = {}
  const byCivilStatus:Record<string, number> = {}

  for (const m of members) {
    if (m.status)      byStatus[m.status]           = (byStatus[m.status]           || 0) + 1
    if (m.fellowship)  byFellowship[m.fellowship]   = (byFellowship[m.fellowship]   || 0) + 1
    if (m.age_group)   byAgeGroup[m.age_group]      = (byAgeGroup[m.age_group]      || 0) + 1
    if (m.zone)        byZone[m.zone]               = (byZone[m.zone]               || 0) + 1
    if (m.sex)         bySex[m.sex]                 = (bySex[m.sex]                 || 0) + 1
    if (m.civil_status)byCivilStatus[m.civil_status]= (byCivilStatus[m.civil_status]|| 0) + 1
  }

  return { total, byStatus, byFellowship, byAgeGroup, byZone, bySex, byCivilStatus }
}

export async function POST(req: NextRequest) {
  // Auth check — must be logged in as admin
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { members, filters } = await req.json()
  if (!members || members.length === 0)
    return NextResponse.json({ summary: 'No members match the current filters.' })

  const stats = buildStats(members)

  const prompt = `You are an assistant for a church administrator at the United Church of Christ in the Philippines, Iligan City. Below are aggregate statistics from a filtered membership report.

Active filters: ${JSON.stringify(filters)}
Statistics:
- Total members in this report: ${stats.total}
- By membership status: ${JSON.stringify(stats.byStatus)}
- By fellowship: ${JSON.stringify(stats.byFellowship)}
- By age group: ${JSON.stringify(stats.byAgeGroup)}
- By zone: ${JSON.stringify(stats.byZone)}
- By sex: ${JSON.stringify(stats.bySex)}
- By civil status: ${JSON.stringify(stats.byCivilStatus)}

Write a 3–5 sentence plain-English summary for a non-technical church administrator. Include:
- What the filter captured and the total count
- The most notable demographic patterns (fellowship, age group, or zone)
- One practical pastoral observation or recommendation

Be warm, respectful, and conversational. No bullet points. Use terms like "congregation" and "fellowship" naturally.`

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })
    return NextResponse.json({ summary: response.text })
  } catch (err) {
    console.error('Gemini error:', err)
    return NextResponse.json({ error: 'AI summary failed. Please try again.' }, { status: 500 })
  }
}