"use client";

import {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import {
  Pencil,
  Check,
  X,
  Copy,
  RefreshCcw,
  Volume2,
  Webhook,
  Brain,
  Trash2,
} from "lucide-react";
import Message from "./Message";
import Composer from "./Composer";
import { cls } from "./utils";
import type {
  ChatPaneHandle,
  UIConversation,
  UIMessage,
  TaskAttachment,
  ChatSendPayload,
} from "./types"; //

function ThinkingMessage() {
  return (
    <Message role="assistant">
      <div className="flex items-center gap-3">
        <Brain className="h-4 w-4 text-zinc-700" />
        <span className="text-sm text-zinc-500">Thinking…</span>
      </div>
    </Message>
  );
}

type ChatPaneProps = {
  conversation: UIConversation | null;
  onSend?: (payload: ChatSendPayload) => void | Promise<void>; //
  onEditMessage?: (messageId: string, newContent: string) => void;
  isThinking?: boolean;
  onPauseThinking?: () => void;
  onRegenerate?: (m: UIMessage) => void;
  onSpeak?: (m: UIMessage) => void;
  onHook?: (m: UIMessage) => void;
  onDeleteFrom?: (messageId: string) => void;
  currentUser?: { name?: string; email?: string; image?: string }; // new
  selectedHookMessageIds?: Set<string> | string[]; // new
};

type ComposerHandle = {
  insertTemplate: (templateContent: string) => void;
  focus: () => void;
  addAttachmentFromTask: (task: TaskAttachment) => void; // new
};

const ChatPane = forwardRef<ChatPaneHandle, ChatPaneProps>(function ChatPane(
  {
    conversation,
    onSend,
    onEditMessage,
    isThinking,
    onPauseThinking,
    onRegenerate,
    onSpeak,
    onHook,
    onDeleteFrom,
    currentUser,
    selectedHookMessageIds,
  },
  ref,
) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const composerRef = useRef<ComposerHandle | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null); // container ref for auto-scroll

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent: string) => {
        composerRef.current?.insertTemplate(templateContent);
      },
      // new
      addAttachmentFromTask: (task: TaskAttachment) => {
        composerRef.current?.addAttachmentFromTask(task);
      },
    }),
    [],
  );

  const msgCount = Array.isArray(conversation?.messages)
    ? conversation!.messages.length
    : 0;

  const scrollToBottom = () => {
    if (listRef.current) {
      const el = listRef.current;
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else if (typeof window !== "undefined") {
      const doc = document.documentElement || (document.body as HTMLElement);
      window.scrollTo({ top: doc.scrollHeight, behavior: "smooth" });
    }
  };

  useEffect(() => {
    function handleNewChatScroll() {
      scrollToBottom();
    }
    // listen once per mount
    window.addEventListener("new-chat", handleNewChatScroll);
    return () => window.removeEventListener("new-chat", handleNewChatScroll);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [msgCount, isThinking, conversation?.id]);

  const messages: UIMessage[] = Array.isArray(conversation?.messages)
    ? (conversation.messages as any)
    : [];

  function startEdit(m: UIMessage) {
    if (m.role !== "user") return;
    setEditingId(m.id);
    setDraft(m.content);
  }
  function cancelEdit() {
    setEditingId(null);
    setDraft("");
  }
  function saveEdit() {
    if (!editingId) return;
    onEditMessage?.(editingId, draft);
    cancelEdit();
  }

  async function copyToClipboard(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 900);
    } catch {}
  }

  if (!conversation || !conversation.messages?.length) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <div className="grid flex-1 place-items-center px-4">
          <div className="w-full max-w-3xl">
            <h1 className="mb-6 text-center text-3xl font-semibold text-zinc-800">
              What are you working on?
            </h1>
            <Composer
              ref={composerRef as any}
              onSend={async (payload) => {
                const text = payload?.text || "";
                if (!text.trim()) return;
                setBusy(true);
                await onSend?.(payload as any);
                setBusy(false);
              }}
              busy={busy}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div
        ref={listRef}
        className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-8"
      >
        {messages.map((m) => (
          <div key={m.id} className="space-y-2 group/message">
            {editingId === m.id ? (
              <div className={cls("rounded-2xl border p-2", "border-zinc-200")}>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full resize-y rounded-xl bg-transparent p-2 text-sm outline-none"
                  rows={3}
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={saveEdit}
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-white"
                  >
                    <Check className="h-3.5 w-3.5" /> Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Message role={m.role} currentUser={currentUser}>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </Message>

                {m.role === "user" ? (
                  <div
                    className={cls(
                      "mt-1 flex gap-2 text-[11px] text-zinc-500 opacity-0 transition-opacity group-hover/message:opacity-100",
                      "justify-end mr-10", // align with bubble, not avatar
                    )}
                  >
                    <div className="relative group">
                      <button
                        className="inline-flex items-center rounded-md p-1 hover:bg-zinc-100"
                        aria-label="Edit"
                        title="Edit"
                        onClick={() => startEdit(m)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <span className="pointer-events-none absolute top-full mt-1 -translate-x-1/2 left-1/2 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
                        Edit
                      </span>
                    </div>

                    <div className="relative group">
                      <button
                        className={cls(
                          "inline-flex items-center rounded-md p-1 hover:bg-zinc-100",
                          copiedId === m.id ? "animate-pulse" : "",
                        )}
                        aria-label="Copy"
                        title="Copy"
                        onClick={() => copyToClipboard(m.id, m.content)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <span className="pointer-events-none absolute top-full mt-1 -translate-x-1/2 left-1/2 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
                        {copiedId === m.id ? "Copied" : "Copy"}
                      </span>
                    </div>

                    <div className="relative group">
                      <button
                        className="inline-flex items-center rounded-md p-1 hover:bg-zinc-100 text-red-600"
                        aria-label="Delete from here"
                        title="Delete from here"
                        onClick={() => onDeleteFrom?.(m.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <span className="pointer-events-none absolute top-full mt-1 -translate-x-1/2 left-1/2 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
                        Delete from here
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cls(
                      "mt-1 flex gap-2 text-[11px] text-zinc-500 justify-start ml-10",
                    )}
                  >
                    <div className="relative group">
                      <button
                        className={cls(
                          "inline-flex items-center rounded-md p-1 hover:bg-zinc-100",
                          copiedId === m.id ? "animate-pulse" : "",
                        )}
                        aria-label="Copy"
                        title="Copy"
                        onClick={() => copyToClipboard(m.id, m.content)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <span className="pointer-events-none absolute top-full mt-1 -translate-x-1/2 left-1/2 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
                        {copiedId === m.id ? "Copied" : "Copy"}
                      </span>
                    </div>

                    <div className="relative group">
                      <button
                        className="inline-flex items-center rounded-md p-1 hover:bg-zinc-100"
                        aria-label="Regenerate"
                        title="Regenerate"
                        onClick={() => onRegenerate?.(m)}
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                      </button>
                      <span className="pointer-events-none absolute top-full mt-1 -translate-x-1/2 left-1/2 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
                        Regenerate
                      </span>
                    </div>

                    <div className="relative group">
                      <button
                        className="inline-flex items-center rounded-md p-1 hover:bg-zinc-100"
                        aria-label="Speak"
                        title="Speak"
                        onClick={() => {
                          if (onSpeak) return onSpeak(m);
                          if (
                            typeof window !== "undefined" &&
                            "speechSynthesis" in window
                          ) {
                            const u = new SpeechSynthesisUtterance(m.content);
                            window.speechSynthesis.cancel();
                            window.speechSynthesis.speak(u);
                          }
                        }}
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                      <span className="pointer-events-none absolute top-full mt-1 -translate-x-1/2 left-1/2 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
                        Speak
                      </span>
                    </div>

                    <div className="relative group">
                      <button
                        className={cls(
                          "inline-flex items-center rounded-md p-1 hover:bg-zinc-100",
                          (Array.isArray(selectedHookMessageIds)
                            ? (selectedHookMessageIds as string[]).includes(
                                m.id,
                              )
                            : (selectedHookMessageIds as Set<string>)?.has?.(
                                m.id,
                              )) && "text-green-600",
                        )}
                        aria-label="Hook"
                        title="Hook"
                        onClick={() => onHook?.(m)}
                      >
                        <Webhook className="h-3.5 w-3.5" />
                      </button>
                      <span className="pointer-events-none absolute top-full mt-1 -translate-x-1/2 left-1/2 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
                        Hook
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {isThinking && <ThinkingMessage />}
      </div>

      <Composer
        ref={composerRef as any}
        onSend={async (payload) => {
          const text = payload?.text || "";
          if (!text.trim()) return;
          setBusy(true);
          await onSend?.(payload as any);
          setBusy(false);
        }}
        busy={busy}
      />
    </div>
  );
});

export default ChatPane;
