import { type NextRequest, NextResponse } from "next/server"
import { chatService, type ChatMessageInput } from "../../../lib/chat-service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages = (body?.messages ?? []) as ChatMessageInput[]

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 })
    }

    // Ensure we only pass role/content to the service
    const safeMessages: ChatMessageInput[] = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }))

    // Basic env guard (the singleton already has fallback, this provides clearer error)
    const hasKey = !!process.env.NEXT_PUBLIC_GEMINI_API_KEY || !!process.env.GEMINI_API_KEY
    if (!hasKey) {
      return NextResponse.json(
        {
          error:
            "Missing Gemini API key. Please set NEXT_PUBLIC_GEMINI_API_KEY (or GEMINI_API_KEY) in Project Settings.",
        },
        { status: 500 },
      )
    }

    const text = await chatService.generateReply(safeMessages)
    return NextResponse.json({ text })
  } catch (err: any) {
    console.error("[/api/ai] error:", err?.message || err)
    return NextResponse.json({ error: "Failed to generate AI response." }, { status: 500 })
  }
}
