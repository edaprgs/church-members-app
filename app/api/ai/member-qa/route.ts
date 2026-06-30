import { GoogleGenAI } from "@google/genai"
import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/app/lib/supabase-server"

export async function POST(req: NextRequest) {
  const session = await requireAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { question, stats } = await req.json()

  const prompt = `You are an assistant for a church membership database administrator at the United Church of Christ in the Philippines, Iligan City. Answer the question using only the aggregate statistics provided. Do not make up numbers. If the statistics don't contain enough information, say so clearly.

Church membership statistics:
${JSON.stringify(stats, null, 2)}

Administrator's question: "${question}"

Answer in 1–3 sentences. Be specific and include exact numbers when available. Use terms like "members", "fellowship", and "congregation" naturally.`

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })
    return NextResponse.json({ answer: response.text })
  } catch (err) {
    console.error('Gemini error:', err)
    return NextResponse.json({ error: 'Could not get an answer. Please try again.' }, { status: 500 })
  }
}