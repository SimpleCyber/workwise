"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ChatPane from "./ChatPanel";
import { useGetProjectChats } from "../../api/use-get-project-chats";
import { useGetProjectChatMessages } from "../../api/use-get-project-chat-messages";
import { useCreateProjectChat } from "../../api/use-create-project-chat";
import { useAppendProjectMessage } from "../../api/use-append-project-message";
import { useRenameProjectChat } from "../../api/use-rename-project-chat";
import { useTogglePinProjectChat } from "../../api/use-toggle-pin-project-chat";
import { useDeleteProjectChat } from "../../api/use-delete-project-chat";
import { useDeleteMessagesFrom } from "../../api/use-delete-project-messages-from"; // new hook
import { useGetProjectHooks } from "../../api/use-get-project-hooks"; // new hook
import {
  useToggleProjectHook,
  useSetProjectHookSelected,
} from "../../api/use-toggle-project-hook"; // new hook
import type { Id } from "../../../../../convex/_generated/dataModel";
import { sortChatsByUpdatedAt } from "./utils";
import type {
  ChatPaneHandle,
  UIConversation,
  UIMessage,
  TaskAttachment,
  ChatSendPayload,
} from "./types"; // import shared types

type Props = {
  workspaceId: Id<"workspaces">;
  boardId: Id<"projectBoards">;
  currentUserId: Id<"users">;
  currentUser?: { name?: string; email?: string; image?: string }; //
  className?: string;
};

export default function AIAssistantUI({
  workspaceId,
  boardId,
  currentUserId,
  currentUser,
  className = "",
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState({ pinned: true, recent: false });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"projectChats"> | null>(null);

  const { chats, isLoading: loadingChats } = useGetProjectChats(boardId);
  const { messages, isLoading: loadingMsgs } = useGetProjectChatMessages(
    selectedId as any,
  );
  const { createChat } = useCreateProjectChat();
  const { appendMessage } = useAppendProjectMessage();
  const { renameChat } = useRenameProjectChat();
  const { togglePin } = useTogglePinProjectChat();
  const { deleteChat } = useDeleteProjectChat();
  const { deleteFrom } = useDeleteMessagesFrom(); //
  const { hooks } = useGetProjectHooks(selectedId as any);
  const { toggleHook } = useToggleProjectHook();
  const { setHookSelected } = useSetProjectHookSelected();

  const [isThinking, setIsThinking] = useState(false);
  const [thinkingConvId, setThinkingConvId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const composerRef = useRef<ChatPaneHandle | null>(null); // type the ref handle

  useEffect(() => {
    if (!selectedId && chats.length > 0) {
      setSelectedId(chats[0].id);
    }
  }, [chats, selectedId]);

  useEffect(() => {
    function onTaskDragStart(ev: any) {
      const detail = ev?.detail;
      // accept either { task } or full payload with type === "project-task"
      const candidate =
        detail?.task ??
        (detail?.type === "project-task" ? detail.task : detail);
      if (candidate) {
        (window as any).__lastDraggedTask = candidate;
      }
    }
    window.addEventListener("kanban:task-drag-start", onTaskDragStart);
    return () =>
      window.removeEventListener("kanban:task-drag-start", onTaskDragStart);
  }, []);

  useEffect(() => {
    function onTaskDropToChat(e: any) {
      // accept both shapes: { detail: { task } } and { detail: { type: 'project-task', task } }
      const incoming = (e?.detail?.task ??
        (e?.detail?.type === "project-task"
          ? e.detail.task
          : e?.detail)) as TaskAttachment | null;

      let enriched: TaskAttachment | null = incoming;
      try {
        const cached = (window as any).__lastDraggedTask as
          | TaskAttachment
          | undefined;

        if (cached) {
          const sameId =
            (incoming &&
              cached &&
              incoming.taskId &&
              cached.taskId &&
              String(incoming.taskId) === String(cached.taskId)) ||
            (incoming &&
              cached &&
              (incoming as any).taskCode &&
              (cached as any).taskCode &&
              (incoming as any).taskCode === (cached as any).taskCode);

          if (!incoming && cached) {
            enriched = cached;
          } else if (incoming && cached && sameId) {
            enriched = { ...cached, ...incoming };
          }
        }
      } catch {}

      if (enriched) {
        composerRef.current?.addAttachmentFromTask(enriched);
      }
    }

    window.addEventListener("kanban:task-drop-to-chat", onTaskDropToChat);
    return () =>
      window.removeEventListener("kanban:task-drop-to-chat", onTaskDropToChat);
  }, []);

  const filtered = useMemo(() => {
    const base = chats.map((c) => ({ ...c }));
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(
      (c) =>
        (c.title || "").toLowerCase().includes(q) ||
        (c.preview || "").toLowerCase().includes(q),
    );
  }, [chats, query]);

  const pinned = filtered.filter((c) => c.pinned);
  const recent = filtered.filter((c) => !c.pinned);
  sortChatsByUpdatedAt(pinned);
  sortChatsByUpdatedAt(recent);

  const selectedChatId = selectedId ?? (chats[0]?.id as any) ?? null;

  function deriveChatTitle(text: string) {
    const cleaned = (text || "").replace(/\s+/g, " ").trim();
    if (!cleaned) return "New chat";
    const stop = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "to",
      "of",
      "in",
      "for",
      "with",
      "on",
      "at",
      "from",
      "by",
      "about",
      "as",
      "is",
      "are",
      "be",
      "can",
      "could",
      "should",
      "would",
      "how",
      "what",
      "why",
      "when",
      "which",
      "this",
      "that",
      "these",
      "those",
      "please",
      "make",
      "create",
      "help",
      "need",
    ]);
    const tokens = cleaned
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .split(/\s+/)
      .filter((t) => t && !stop.has(t));
    const words = tokens.slice(0, 3);
    if (words.length === 0) {
      // fallback to first two words from the original sentence
      const fallback = cleaned.split(/\s+/).slice(0, 3).join(" ");
      return fallback.replace(/\b\w/g, (m) => m.toUpperCase());
    }
    const title = words.join(" ").replace(/\b\w/g, (m) => m.toUpperCase());
    return title;
  }

  async function createNewChat() {
    const id = await createChat({
      workspaceId,
      boardId,
      title: "New chat",
      createdBy: currentUserId,
    });
    setSelectedId(id as any);
    setSidebarOpen(false);
    try {
      window.dispatchEvent(new Event("v0:new-chat"));
    } catch {}
  }

  async function onSend(payload: ChatSendPayload) {
    const content = payload.text;
    const attachments = payload.attachments || [];

    // ensure a chat exists
    const willCreateNew = !selectedChatId;
    const existingMsgCount = Array.isArray(messages)
      ? (messages as any[]).length
      : 0;

    const chatId =
      (selectedChatId as Id<"projectChats">) ??
      ((await createChat({
        workspaceId,
        boardId,
        title: "New chat",
        createdBy: currentUserId,
      })) as Id<"projectChats">);

    // 1) append user message
    await appendMessage({
      chatId,
      role: "user",
      content,
      userId: currentUserId,
    });

    try {
      if (willCreateNew || existingMsgCount === 0) {
        const newTitle = deriveChatTitle(content);
        await renameChat(chatId, newTitle);
      }
    } catch (e) {
      // ignore rename errors
    }

    // 2) call AI
    setIsThinking(true);
    setThinkingConvId(chatId as any);
    try {
      const apiMessages = (messages || []).map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content as string,
      }));

      const selectedHooks = (hooks || [])
        .filter((h: any) => h.selected)
        .map((h: any) => h.content as string);

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          boardId,
          messages: apiMessages.concat([{ role: "user", content }]),
          hooks: selectedHooks,
          attachments,
        }),
      });
      const data = await res.json().catch(() => ({}) as any);
      const text = res.ok
        ? data?.text || "Sorry, I couldn’t generate a reply."
        : `Error: ${data?.error || "AI request failed"}`;

      // 3) append assistant message
      await appendMessage({
        chatId,
        role: "assistant",
        content: text,
      });
    } finally {
      setIsThinking(false);
      setThinkingConvId(null);
    }
  }

  async function onEditMessage(messageId: string, newContent: string) {
    if (!selectedChatId) return;
    // delete from the edited message and resend the new content
    try {
      await deleteFrom({
        chatId: selectedChatId as any,
        fromMessageId: messageId as any,
      });
    } catch {}
    await onSend({ text: newContent });
  }

  function pauseThinking() {
    setIsThinking(false);
    setThinkingConvId(null);
  }

  async function onRename(id: Id<"projectChats">, title: string) {
    await renameChat(id, title);
  }

  async function onDelete(id: Id<"projectChats">) {
    if (selectedId === id) setSelectedId(null);
    await deleteChat(id);
  }

  async function onDeleteFrom(messageId: string) {
    if (!selectedChatId) return;
    await deleteFrom({
      chatId: selectedChatId as any,
      fromMessageId: messageId as any,
    });
  }

  async function onRegenerateMessage(m: UIMessage) {
    if (!selectedChatId || !Array.isArray(messages)) return;
    // find the previous user message before this assistant message
    const idx = (messages as any[]).findIndex((x) => x.id === (m as any).id);
    if (idx === -1) return;
    let prevUser: any = null;
    for (let i = idx - 1; i >= 0; i--) {
      if ((messages as any[])[i]?.role === "user") {
        prevUser = (messages as any[])[i];
        break;
      }
    }
    if (!prevUser) return;
    // delete from the assistant message
    await deleteFrom({
      chatId: selectedChatId as any,
      fromMessageId: (m as any).id,
    });
    // resend the previous user prompt
    await onSend({ text: prevUser.content as string });
  }

  const selectedHookMessageIds = useMemo(() => {
    const set = new Set<string>();
    for (const h of hooks || []) {
      if (h.selected && h.messageId) set.add(h.messageId as any);
    }
    return set;
  }, [hooks]);

  const selected: UIConversation | null = selectedChatId
    ? {
        id: selectedChatId as any,
        title: chats.find((c: any) => c.id === selectedChatId)?.title ?? "Chat",
        updatedAt:
          chats.find((c: any) => c.id === selectedChatId)?.updatedAt ??
          new Date().toISOString(),
        messages: messages as any,
        preview:
          ((messages &&
            (messages as any[])[(messages as any[]).length - 1]
              ?.content) as string) ?? "Ask anything…",
        pinned:
          chats.find((c: any) => c.id === selectedChatId)?.pinned ?? false,
      }
    : null;

  const missingIds = !workspaceId || !boardId || !currentUserId;

  return (
    <div className={"h-full w-full bg-zinc-50 text-zinc-900 " + className}>
      <div className="flex h-full w-full overflow-hidden">
        {missingIds ? (
          <div className="grid flex-1 place-items-center text-sm text-zinc-500">
            Preparing your board chat…
          </div>
        ) : (
          <>
            <Sidebar
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
              conversations={filtered}
              pinned={pinned}
              recent={recent}
              selectedId={selectedChatId}
              onSelect={(id: any) => setSelectedId(id)}
              togglePin={(id: any) => togglePin(id)}
              query={query}
              setQuery={setQuery}
              searchRef={null}
              createNewChat={createNewChat}
              onRename={(id: any, t: string) => onRename(id, t)}
              onDelete={(id: any) => onDelete(id)}
              user={{
                name: currentUser?.name || "User",
                email: currentUser?.email,
                image: currentUser?.image,
              }} //
            />

            <main className="relative flex min-w-0 flex-1 flex-col">
              <Header
                createNewChat={createNewChat}
                sidebarCollapsed={sidebarCollapsed}
                setSidebarOpen={setSidebarOpen}
                hooks={(hooks || []).map((h: any) => ({
                  id: h.id,
                  content: h.content,
                  selected: !!h.selected,
                }))}
                onToggleHookSelected={async (hookId, selected) => {
                  await setHookSelected(hookId as any, selected);
                }}
              />
              <ChatPane
                ref={composerRef}
                conversation={selected}
                onSend={(payload: ChatSendPayload) => onSend(payload)} //
                onEditMessage={(messageId: string, newContent: string) =>
                  onEditMessage(messageId, newContent)
                }
                isThinking={
                  isThinking && (thinkingConvId as any) === selected?.id
                }
                onPauseThinking={pauseThinking}
                onDeleteFrom={(messageId: string) => onDeleteFrom(messageId)}
                onRegenerate={(m) => onRegenerateMessage(m)} //
                currentUser={currentUser} //
                selectedHookMessageIds={selectedHookMessageIds}
                onHook={async (m) => {
                  if (!selectedId) return;
                  await toggleHook({
                    chatId: selectedId as any,
                    messageId: m.id as any,
                    content: m.content,
                  });
                }}
              />
            </main>
          </>
        )}
      </div>
    </div>
  );
}
