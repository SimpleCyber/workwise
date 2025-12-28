import { type NextRequest, NextResponse } from "next/server";
import { ChatService, type ChatMessageInput } from "../../../lib/chat-service";

function stripDescription(raw?: unknown) {
  if (!raw) return "";
  const s = String(raw);
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed?.ops)) {
      return parsed.ops
        .map((op: any) => (typeof op.insert === "string" ? op.insert : ""))
        .join("")
        .replace(/\s+/g, " ")
        .trim();
    }
  } catch {}
  return s;
}

function fmtDate(ts?: unknown) {
  const n = typeof ts === "number" ? ts : Number(ts);
  if (!n || Number.isNaN(n)) return "";
  const d = new Date(n);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = (body?.messages ?? []) as ChatMessageInput[];

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

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
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

