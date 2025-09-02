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
import type { Id } from "../../../../../convex/_generated/dataModel";
import { sortChatsByUpdatedAt } from "./utils";
import type { ChatPaneHandle, UIConversation } from "./types"; // import shared types

type Props = {
  workspaceId: Id<"workspaces">;
  boardId: Id<"projectBoards">;
  currentUserId: Id<"users">;
  className?: string;
};

export default function AIAssistantUI({
  workspaceId,
  boardId,
  currentUserId,
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

  const [isThinking, setIsThinking] = useState(false);
  const [thinkingConvId, setThinkingConvId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const composerRef = useRef<ChatPaneHandle | null>(null); // type the ref handle

  useEffect(() => {
    if (!selectedId && chats.length > 0) {
      setSelectedId(chats[0].id);
    }
  }, [chats, selectedId]);

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
    // prefer first sentence or up to ~60 chars
    const firstSentence = cleaned.split(/(?<=[.!?])\s/)[0] || cleaned;
    const truncated =
      firstSentence.length > 60
        ? firstSentence.slice(0, 57).trimEnd() + "…"
        : firstSentence;
    // capitalize first letter
    return truncated.charAt(0).toUpperCase() + truncated.slice(1);
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

  async function onSend(content: string) {
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
      // it's safe to ignore rename errors to not block the flow
      // console.log("[v0] auto-rename failed", e)
    }

    // 2) call AI
    setIsThinking(true);
    setThinkingConvId(chatId as any);
    try {
      const apiMessages = (messages || []).map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content as string,
      }));
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          boardId,
          messages: apiMessages.concat([{ role: "user", content }]),
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
    // Optional: add a Convex mutation to edit message content if needed.
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
              user={{ name: "User", plan: "Free" }}
            />

            <main className="relative flex min-w-0 flex-1 flex-col">
              <Header
                createNewChat={createNewChat}
                sidebarCollapsed={sidebarCollapsed}
                setSidebarOpen={setSidebarOpen}
              />
              <ChatPane
                ref={composerRef}
                conversation={selected}
                onSend={(text: string) => onSend(text)}
                onEditMessage={(messageId: string, newContent: string) =>
                  onEditMessage(messageId, newContent)
                }
                isThinking={
                  isThinking && (thinkingConvId as any) === selected?.id
                }
                onPauseThinking={pauseThinking}
                onDeleteFrom={(messageId: string) => {
                  // Optional: implement a mutation to delete from a point onward.
                }}
              />
            </main>
          </>
        )}
      </div>
    </div>
  );
}
