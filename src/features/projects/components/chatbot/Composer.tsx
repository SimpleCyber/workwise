"use client";

import {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { Send, Loader2, Plus, Mic } from "lucide-react";
import ComposerActionsPopover from "./ComposerActionsPopover";
import { cls } from "./utils";
import type { ChatSendPayload } from "./types";

export type ComposerHandle = {
  insertTemplate: (templateContent: string) => void;
  focus: () => void;
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

  async function handleSend() {
    if (!value.trim() || sending) return;
    setSending(true);
    try {
      await onSend?.({ text: value.trim() });
      setValue("");
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-4">
      <div
        className={cls(
          "mx-auto flex flex-col rounded-2xl border bg-card shadow-sm transition-all duration-200",
          "max-w-3xl p-3 border-border",
        )}
      >
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask anything"
            rows={1}
            className={cls(
              "w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground transition-all duration-200",
              "px-0 py-2 min-h-[40px] text-left text-foreground",
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
              className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Add attachment"
            >
              <Plus className="h-4 w-4" />
            </button>
          </ComposerActionsPopover>

          <div className="flex shrink-0 items-center gap-1">
            <button
              className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Voice input"
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !!busy || !value.trim()}
              className={cls(
                "inline-flex shrink-0 items-center gap-2 rounded-full bg-rose-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500",
                (sending || busy || !value.trim()) &&
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
