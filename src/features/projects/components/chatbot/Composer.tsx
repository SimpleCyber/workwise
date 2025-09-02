"use client";

import {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  type DragEvent,
} from "react";
import { Send, Loader2, Plus, Mic, Clover as Close } from "lucide-react";
import ComposerActionsPopover from "./ComposerActionsPopover";
import { cls } from "./utils";

type TaskAttachment = {
  taskId: string;
  taskCode?: string;
  title?: string;
  description?: string;
};

export type ComposerHandle = {
  insertTemplate: (templateContent: string) => void;
  focus: () => void;
};
type ComposerProps = {
  onSend?: (text: string) => void | Promise<void>;
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

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }
  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    try {
      const json = e.dataTransfer.getData("application/json");
      if (!json) return;
      const data = JSON.parse(json);
      if (data?.type === "project-task" && data?.task) {
        const t = data.task as TaskAttachment;
        setAttachments((prev) => {
          // de-dupe by taskId or taskCode
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
    }
  }

  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSend() {
    if ((!value.trim() && attachments.length === 0) || sending) return;
    setSending(true);
    try {
      const context =
        attachments.length > 0
          ? `\n\n---\nContext:\n${attachments
              .map(
                (a) =>
                  `Task ${a.taskCode || a.taskId}${a.title ? ` — ${a.title}` : ""}${
                    a.description
                      ? `\nDescription: ${stripDescription(a.description)}`
                      : ""
                  }`,
              )
              .join("\n\n")}`
          : "";
      const payload = `${value.trim()}${context}`;
      await onSend?.(payload);
      setValue("");
      setAttachments([]);
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-4" onDragOver={handleDragOver} onDrop={handleDrop}>
      <div
        className={cls(
          "mx-auto flex flex-col rounded-2xl border bg-white shadow-sm transition-all duration-200",
          "max-w-3xl border-zinc-300 p-3",
        )}
      >
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((a, idx) => (
              <span
                key={(a.taskCode || a.taskId || String(idx)) + idx}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs"
                title={a.title || a.taskCode || a.taskId}
              >
                <span className="font-mono">{a.taskCode || a.taskId}</span>
                {a.title && (
                  <span className="max-w-[180px] truncate">{a.title}</span>
                )}
                <button
                  onClick={() => removeAttachment(idx)}
                  className="rounded-full p-1 hover:bg-zinc-200"
                  aria-label="Remove attachment"
                  title="Remove"
                >
                  <Close className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
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
