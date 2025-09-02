import { type NextRequest, NextResponse } from "next/server";
import { ChatService, type ChatMessageInput } from "../../../lib/chat-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = (body?.messages ?? []) as ChatMessageInput[];
    const _workspaceId = body?.workspaceId;
    const _boardId = body?.boardId;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 },
      );
    }

    const safeMessages: ChatMessageInput[] = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Missing Gemini API key. Please set GEMINI_API_KEY in Project Settings (server-only).",
        },
        { status: 500 },
      );
    }

    const service = new ChatService(apiKey);
    const text = await service.generateReply(safeMessages);
    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("[/api/ai] error:", err?.message || err);
    return NextResponse.json(
      { error: "Failed to generate AI response." },
      { status: 500 },
    );
  }
}
