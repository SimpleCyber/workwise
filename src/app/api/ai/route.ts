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

function buildAttachmentsSystemMessage(attachments: any[]): ChatMessageInput[] {
  if (!Array.isArray(attachments) || attachments.length === 0) return [];

  const sections = attachments.map((a, idx) => {
    const header = `Task ${a?.taskCode || a?.taskId || `#${idx + 1}`}${a?.title ? ` — ${a.title}` : ""}`;
    const internalId = a?.taskId ? `InternalId: ${a.taskId}` : "";
    const desc = a?.description
      ? `Description: ${stripDescription(a.description)}`
      : "";
    const meta: string[] = [];
    if (a?.priority) meta.push(`Priority: ${a.priority}`);
    const due = fmtDate(a?.dueDate);
    if (due) meta.push(`Due: ${due}`);
    if (Array.isArray(a?.labels) && a.labels.length)
      meta.push(`Labels: ${a.labels.join(", ")}`);
    const metaLine = meta.length ? meta.join("; ") : "";

    const people: string[] = [];
    if (a?.assignedTo?.name || a?.assignedTo?.email)
      people.push(
        `Assignee: ${a?.assignedTo?.name || "(unknown)"}${a?.assignedTo?.email ? ` <${a.assignedTo.email}>` : ""}`,
      );
    if (a?.assignedBy?.name || a?.assignedBy?.email)
      people.push(
        `Assigned by: ${a?.assignedBy?.name || "(unknown)"}${a?.assignedBy?.email ? ` <${a.assignedBy.email}>` : ""}`,
      );
    if (a?.createdBy?.name || a?.createdBy?.email)
      people.push(
        `Created by: ${a?.createdBy?.name || "(unknown)"}${a?.createdBy?.email ? ` <${a.createdBy.email}>` : ""}`,
      );
    const peopleLine = people.length ? people.join("; ") : "";

    let commentsBlock = "";
    if (Array.isArray(a?.comments) && a.comments.length) {
      const lines = a.comments.map((c: any) => {
        const ts = c?.createdAt
          ? new Date(Number(c.createdAt)).toISOString()
          : "";
        const who =
          c?.authorName || c?.authorEmail
            ? `${c?.authorName || ""}${c?.authorEmail ? ` <${c.authorEmail}>` : ""}`
            : "Unknown";
        return `- ${who}${ts ? ` @ ${ts}` : ""}: ${String(c?.content || "").trim()}`;
      });
      commentsBlock = `Comments:\n${lines.join("\n")}`;
    }

    return [header, internalId, desc, metaLine, peopleLine, commentsBlock]
      .filter(Boolean)
      .join("\n")
      .trim();
  });

  const content = `Use the following task context when answering.\n\n${sections.join("\n\n---\n\n")}`;
  return [{ role: "system" as any, content }];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = (body?.messages ?? []) as ChatMessageInput[];
    const _workspaceId = body?.workspaceId;
    const _boardId = body?.boardId;
    const hooks = (body?.hooks ?? []) as string[];
    const attachments = (body?.attachments ?? []) as any[];

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

    const hooksSystem: ChatMessageInput[] =
      Array.isArray(hooks) && hooks.length > 0
        ? [
            {
              role: "system" as any,
              content:
                "Use the following saved hooks as context when answering:\n" +
                hooks.map((h, i) => `- ${h}`).join("\n"),
            },
          ]
        : [];

    const attachmentsSystem = buildAttachmentsSystemMessage(attachments);

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
    const text = await service.generateReply([
      ...attachmentsSystem,
      ...hooksSystem,
      ...safeMessages,
    ]);
    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("[/api/ai] error:", err?.message || err);
    return NextResponse.json(
      { error: "Failed to generate AI response." },
      { status: 500 },
    );
  }
}
