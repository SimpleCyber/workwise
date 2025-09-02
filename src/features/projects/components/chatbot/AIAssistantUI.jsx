"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ChatPane from "./ChatPanel";
import { INITIAL_CONVERSATIONS } from "./mockData";

export default function AIAssistantUI({ className = "" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem("sidebar-collapsed");
      return raw ? JSON.parse(raw) : { pinned: true, recent: false };
    } catch {
      return { pinned: true, recent: false };
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar-collapsed-state");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(
        "sidebar-collapsed-state",
        JSON.stringify(sidebarCollapsed),
      );
    } catch {}
  }, [sidebarCollapsed]);

  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState(null);

  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  const [isThinking, setIsThinking] = useState(false);
  const [thinkingConvId, setThinkingConvId] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        createNewChat();
      }
      if (!e.metaKey && !e.ctrlKey && e.key === "/") {
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen, conversations]);

  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      createNewChat();
    }
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.preview.toLowerCase().includes(q),
    );
  }, [conversations, query]);

  const pinned = filtered
    .filter((c) => c.pinned)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const recent = filtered
    .filter((c) => !c.pinned)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 50);

  function togglePin(id) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
    );
  }

  function createNewChat() {
    const id = Math.random().toString(36).slice(2);
    const item = {
      id,
      title: "New chat",
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      preview: "Ask anything…",
      pinned: false,
      folder: null,
      messages: [],
    };
    setConversations((prev) => [item, ...prev]);
    setSelectedId(id);
    setSidebarOpen(false);
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}
  }

  function renameConversationInline(id, newTitle) {
    const title = (newTitle || "").trim();
    if (!title) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c,
      ),
    );
  }

  function deleteConversation(id) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) {
      const next = conversations.find((c) => c.id !== id)?.id || null;
      setSelectedId(next);
    }
  }

  function sendMessage(convId, content) {
    if (!content.trim()) return;
    const now = new Date().toISOString();
    const userMsg = {
      id: Math.random().toString(36).slice(2),
      role: "user",
      content,
      createdAt: now,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const msgs = [...(c.messages || []), userMsg];
        return {
          ...c,
          messages: msgs,
          updatedAt: now,
          messageCount: msgs.length,
          preview: content.slice(0, 80),
        };
      }),
    );

    setIsThinking(true);
    setThinkingConvId(convId);

    const currentConvId = convId;
    setTimeout(() => {
      setIsThinking(false);
      setThinkingConvId(null);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== currentConvId) return c;
          const ack = `Got it — I’ll help with that.`;
          const asstMsg = {
            id: Math.random().toString(36).slice(2),
            role: "assistant",
            content: ack,
            createdAt: new Date().toISOString(),
          };
          const msgs = [...(c.messages || []), asstMsg];
          return {
            ...c,
            messages: msgs,
            updatedAt: new Date().toISOString(),
            messageCount: msgs.length,
            preview: asstMsg.content.slice(0, 80),
          };
        }),
      );
    }, 1200);
  }

  function editMessage(convId, messageId, newContent) {
    const now = new Date().toISOString();
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const msgs = (c.messages || []).map((m) =>
          m.id === messageId ? { ...m, content: newContent, editedAt: now } : m,
        );
        return {
          ...c,
          messages: msgs,
          preview: msgs[msgs.length - 1]?.content?.slice(0, 80) || c.preview,
        };
      }),
    );
  }

  function pauseThinking() {
    setIsThinking(false);
    setThinkingConvId(null);
  }

  function deleteFromMessage(convId, messageId) {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const idx = (c.messages || []).findIndex((m) => m.id === messageId);
        if (idx === -1) return c;
        const msgs = (c.messages || []).slice(0, idx); // keep above, remove this and below
        return {
          ...c,
          messages: msgs,
          messageCount: msgs.length,
          preview:
            msgs[msgs.length - 1]?.content?.slice(0, 80) || "Ask anything…",
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }

  const composerRef = useRef(null);
  const selected = conversations.find((c) => c.id === selectedId) || null;

  return (
    <div className="h-full w-full bg-zinc-50 text-zinc-900">
      <div className="flex h-full w-full overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          conversations={conversations}
          pinned={pinned}
          recent={recent}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          togglePin={togglePin}
          query={query}
          setQuery={setQuery}
          searchRef={null}
          createNewChat={createNewChat}
          onRename={renameConversationInline}
          onDelete={deleteConversation}
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
            onSend={(content) => selected && sendMessage(selected.id, content)}
            onEditMessage={(messageId, newContent) =>
              selected && editMessage(selected.id, messageId, newContent)
            }
            isThinking={isThinking && thinkingConvId === selected?.id}
            onPauseThinking={pauseThinking}
            onDeleteFrom={(messageId) =>
              selected && deleteFromMessage(selected.id, messageId)
            }
          />
        </main>
      </div>
    </div>
  );
}
