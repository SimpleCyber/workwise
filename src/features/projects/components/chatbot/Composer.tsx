"use client";

import {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  type DragEvent,
} from "react";
import { Send, Loader2, Plus, Mic, X } from "lucide-react";
import ComposerActionsPopover from "./ComposerActionsPopover";
import { cls } from "./utils";
import type { TaskAttachment, ChatSendPayload } from "./types";

export type ComposerHandle = {
  insertTemplate: (templateContent: string) => void;
  focus: () => void;
  addAttachmentFromTask: (task: TaskAttachment) => void;
};
type ComposerProps = {
  onSend?: (payload: ChatSendPayload) => void | Promise<void>;
  busy?: boolean;
};

const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  { onSend, busy },
  ref,
) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (inputRef.current) {
      const textarea = inputRef.current;
      const lineHeight = 20;
      const minHeight = 40;
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const calculatedLines = Math.max(
        1,
        Math.floor((scrollHeight - 16) / lineHeight),
      );
      if (calculatedLines <= 12) {
        textarea.style.height = `${Math.max(minHeight, scrollHeight)}px`;
        textarea.style.overflowY = "hidden";
      } else {
        textarea.style.height = `${minHeight + 11 * lineHeight}px`;
        textarea.style.overflowY = "auto";
      }
    }
  }, [value]);

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent: string) => {
        setValue((prev) => {
          const newValue = prev
            ? `${prev}\n\n${templateContent}`
            : templateContent;
          setTimeout(() => {
            inputRef.current?.focus();
            const length = newValue.length;
            inputRef.current?.setSelectionRange(length, length);
          }, 0);
          return newValue;
        });
      },
      focus: () => {
        inputRef.current?.focus();
      },
      addAttachmentFromTask: (task: TaskAttachment) => {
        setAttachments((prev) => {
          const exists = prev.some(
            (a) =>
              a.taskId === String(task.taskId) ||
              (task.taskCode && a.taskCode === task.taskCode),
          );
          return exists ? prev : prev.concat([{ ...task }]);
        });
      },
    }),
    [],
  );

  function stripDescription(raw?: string) {
    if (!raw) return "";
    try {
      const parsed = JSON.parse(raw as string);
      if (Array.isArray(parsed?.ops)) {
        return parsed.ops
          .map((op: any) => (typeof op.insert === "string" ? op.insert : ""))
          .join("")
          .replace(/\s+/g, " ")
          .trim();
      }
    } catch {}
    return String(raw);
  }

  function fmtDate(ts?: number | null) {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return "";
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = "copy";
    } catch {}
    if (!isDragOver) setIsDragOver(true);
  }

  function handleDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    try {
      const json =
        e.dataTransfer.getData("application/json") ||
        e.dataTransfer.getData("text/plain");
      if (!json) return;
      const data = JSON.parse(json);
      if (data?.type === "project-task" && data?.task) {
        const t = data.task as TaskAttachment;
        setAttachments((prev) => {
          const exists = prev.some(
            (a) =>
              a.taskId === String(t.taskId) ||
              (t.taskCode && a.taskCode === t.taskCode),
          );
          return exists ? prev : prev.concat([{ ...t }]);
        });
      }
    } catch {
      // ignore malformed drops
    } finally {
      setIsDragOver(false);
    }
  }

  function removeAttachment(idx: number) {
    console.log(attachments);
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSend() {
    if ((!value.trim() && attachments.length === 0) || sending) return;
    setSending(true);
    try {
      const context =
        attachments.length > 0
          ? `

---

Context:
${attachments
  .map((a) => {
    const parts: string[] = [];
    const header = `Task ${a.taskCode || ""}${a.taskCode && a.title ? ` — ${a.title}` : a.title ? a.title : a.taskId || ""}`;
    parts.push(header);
    if (a.description)
      parts.push(`Description: ${stripDescription(a.description)}`);
    const meta: string[] = [];
    if (a.priority) meta.push(`Priority: ${a.priority}`);
    const due = fmtDate(a.dueDate ?? null);
    if (due) meta.push(`Due: ${due}`);
    if (a.labels && a.labels.length)
      meta.push(`Labels: ${a.labels.join(", ")}`);
    if (meta.length) parts.push(meta.join("; "));
    const people: string[] = [];
    if (a.assignedTo?.name || a.assignedTo?.email) {
      people.push(
        `Assignee: ${a.assignedTo?.name || "(unknown)"}${a.assignedTo?.email ? ` <${a.assignedTo.email}>` : ""}`,
      );
    }
    if (a.assignedBy?.name || a.assignedBy?.email) {
      people.push(
        `Assigned by: ${a.assignedBy?.name || "(unknown)"}${a.assignedBy?.email ? ` <${a.assignedBy.email}>` : ""}`,
      );
    }
    if (a.createdBy?.name || a.createdBy?.email) {
      people.push(
        `Created by: ${a.createdBy?.name || "(unknown)"}${a.createdBy?.email ? ` <${a.createdBy.email}>` : ""}`,
      );
    }
    if (people.length) parts.push(people.join("; "));

    if (a.comments && a.comments.length) {
      const cmts = a.comments
        .map((c) => {
          const ts = c.createdAt ? new Date(c.createdAt).toISOString() : "";
          const who =
            c.authorName || c.authorEmail
              ? `${c.authorName || ""}${c.authorEmail ? ` <${c.authorEmail}>` : ""}`
              : "Unknown";
          return `- ${who}${ts ? ` @ ${ts}` : ""}: ${c.content}`;
        })
        .join("\n");
      parts.push(`Comments:\n${cmts}`);
    }

    return parts.join("\n");
  })
  .join("\n\n")}`
          : "";
      const text = `${value.trim()}${context}`;

      await onSend?.({ text, attachments });
      setValue("");
      setAttachments([]);
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="p-4"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      aria-label="Chat composer drop zone"
    >
      <div
        className={cls(
          "mx-auto flex flex-col rounded-2xl border bg-white shadow-sm transition-all duration-200",
          "max-w-3xl p-3",
          isDragOver
            ? "border-blue-500 ring-2 ring-blue-200"
            : "border-zinc-300",
        )}
      >
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((a, idx) => (
              <span
                key={(a.taskCode || a.taskId || String(idx)) + idx}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs"
                title={
                  (a.taskCode
                    ? `${a.taskCode}${a.title ? ` — ${a.title}` : ""}`
                    : a.title) || a.taskId
                }
              >
                <span className="font-mono">
                  {a.taskCode ? a.taskCode : ""}
                  {a.title ? (a.taskCode ? ` ${a.title}` : a.title) : ""}
                  {!a.taskCode && !a.title ? a.taskId : ""}
                </span>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="rounded-full p-1 hover:bg-zinc-200"
                  aria-label="Remove attachment"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {isDragOver && attachments.length === 0 && (
          <div className="mb-2 text-center text-xs text-zinc-500">
            Drop a task here to attach it as context
          </div>
        )}

        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask anything"
            rows={1}
            className={cls(
              "w-full resize-none bg-transparent text-sm outline-none placeholder:text-zinc-400 transition-all duration-200",
              "px-0 py-2 min-h-[40px] text-left",
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <ComposerActionsPopover>
            <button
              className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
              title="Add attachment"
            >
              <Plus className="h-4 w-4" />
            </button>
          </ComposerActionsPopover>

          <div className="flex shrink-0 items-center gap-1">
            <button
              className="inline-flex items-center justify-center rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
              title="Voice input"
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={
                sending || !!busy || (!value.trim() && attachments.length === 0)
              }
              className={cls(
                "inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                (sending ||
                  busy ||
                  (!value.trim() && attachments.length === 0)) &&
                  "opacity-50 cursor-not-allowed",
              )}
            >
              {sending || busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Composer;
