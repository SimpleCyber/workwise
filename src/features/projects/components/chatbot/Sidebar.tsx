"use client";
import { motion, AnimatePresence } from "framer-motion";
import type React from "react";

import {
  PanelLeftClose,
  SearchIcon,
  Plus,
  MoreHorizontal,
  Star,
  Sparkles,
  Pin,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cls } from "./utils";
import { useMemo, useState, useEffect, useRef } from "react";
import SearchModal from "./SearchModal";
import type { UIConversation } from "./types"; // add shared UI types
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: { pinned: boolean; recent: boolean };
  setCollapsed: React.Dispatch<
    React.SetStateAction<{ pinned: boolean; recent: boolean }>
  >;
  conversations: UIConversation[];
  pinned: UIConversation[];
  recent: UIConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  togglePin: (id: string) => void;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  searchRef?: React.RefObject<HTMLInputElement> | null;
  createNewChat: () => void | Promise<void>;
  sidebarCollapsed?: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  onRename: (id: string, title: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  user?: { name?: string; email?: string; image?: string };
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq =
      typeof window !== "undefined"
        ? window.matchMedia("(min-width: 768px)")
        : null;
    const apply = () => setIsDesktop(!!mq?.matches);
    apply();
    mq?.addEventListener?.("change", apply);
    return () => mq?.removeEventListener?.("change", apply);
  }, []);
  return isDesktop;
}

export default function Sidebar(props: SidebarProps) {
  const {
    open,
    onClose,
    collapsed,
    setCollapsed,
    conversations,
    pinned,
    recent,
    selectedId,
    onSelect,
    togglePin,
    query,
    setQuery,
    searchRef,
    createNewChat,
    sidebarCollapsed = false,
    setSidebarCollapsed,
    onRename,
    onDelete,
    user = { name: "User", email: "", image: "" },
  } = props;

  const isDesktop = useIsDesktop(); // use media check
  const rootRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null); // ref to scroll recent list to top on updates

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (
        rootRef.current &&
        target &&
        !target.closest("[data-conv-menu]") &&
        !target.closest("[data-conv-menu-trigger]")
      ) {
        setOpenMenuForId(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (navRef.current) {
      navRef.current.scrollTop = 0; // navRef typed, safe access
    }
  }, [conversations, selectedId]);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [openMenuForId, setOpenMenuForId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [flashId, setFlashId] = useState<string | null>(null);

  const allChats = useMemo(() => {
    const all = Array.isArray(conversations) ? conversations.slice() : [];
    return all.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [conversations]);

  async function handleNewChat() {
    try {
      const res = createNewChat?.();
      if (res && typeof (res as Promise<void>).then === "function") {
        await (res as Promise<void>);
      }
    } finally {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("new-chat"));
      }
    }
  }

  function handleRenameAndFlash(id: string, title: string) {
    onRename?.(id, title);
    setEditingId(null);
    setDraftTitle("");
    setFlashId(id);
    setTimeout(() => setFlashId(null), 900);
  }

  if (sidebarCollapsed) {
    return (
      <motion.aside
        ref={rootRef}
        initial={{ width: 320 }}
        animate={{ width: 64 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="z-50 flex h-full shrink-0 flex-col border-r border-border bg-sidebar"
      >
        <div className="flex items-center justify-center px-3 py-3">
          <div className="relative">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="group relative rounded-xl p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <Sparkles className="h-5 w-5 text-sidebar-foreground transition-colors group-hover:text-primary" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-col items-center gap-2">
          <div className="relative group">
            <button
              onClick={() => setShowSearchModal(true)}
              className="rounded-lg p-2 hover:bg-accent transition-colors"
              aria-label="Search"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
            <span className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-[10px] text-popover-foreground opacity-0 group-hover:opacity-100 border shadow-sm">
              Search
            </span>
          </div>

          <div className="relative group">
            <button
              onClick={handleNewChat}
              className="rounded-lg p-2 hover:bg-accent transition-colors"
              aria-label="New chat"
            >
              <Plus className="h-4 w-4" />
            </button>
            <span className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-[10px] text-popover-foreground opacity-0 group-hover:opacity-100 border shadow-sm">
              New chat
            </span>
          </div>

          <div className="relative group">
            <button
              onClick={() => setShowSearchModal(true)}
              className="rounded-lg p-2 hover:bg-accent transition-colors"
              aria-label="Starred"
            >
              <Pin className="h-4 w-4" />
            </button>
            <span className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-[10px] text-popover-foreground opacity-0 group-hover:opacity-100 border shadow-sm">
              Starred
            </span>
          </div>
        </div>

        <SearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          conversations={conversations}
          selectedId={selectedId}
          onSelect={onSelect}
          togglePin={togglePin}
          createNewChat={createNewChat}
        />
      </motion.aside>
    );
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(open || typeof window !== "undefined") && (
          <motion.aside
            key="sidebar"
            ref={rootRef}
            initial={{ x: isDesktop ? 0 : -340 }}
            animate={{ x: isDesktop ? 0 : open ? 0 : -340 }}
            exit={{ x: isDesktop ? 0 : -340 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            className={cls(
              "z-50 flex h-full w-80 shrink-0 flex-col border-r border-border bg-sidebar",
              "fixed inset-y-0 left-0 md:static md:translate-x-0",
            )}
          >
            <div className="flex items-center gap-2 px-3 py-3">
              <div className="relative group">
                <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-40" />
                <Sparkles className="relative h-5 w-5 text-sidebar-foreground group-hover:text-primary" />
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden md:block rounded-xl p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
                <button
                  onClick={onClose}
                  className="md:hidden rounded-xl p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Close sidebar"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-2 pt-1">
              <button
                onClick={handleNewChat}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent"
              >
                <Plus className="h-4 w-4 text-sidebar-foreground/80" />
                <span className="text-sm">New chat</span>
              </button>
              <button
                onClick={() => setShowSearchModal(true)}
                className="mt-1 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent"
              >
                <SearchIcon className="h-4 w-4 text-sidebar-foreground/80" />
                <span className="text-sm">Search chats</span>
              </button>

              {allChats.some((c) => c.pinned) && (
                <button
                  onClick={() =>
                    setCollapsed((s) => ({ ...s, pinned: !s.pinned }))
                  }
                  className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-sidebar-foreground/60 hover:bg-accent"
                  aria-expanded={!collapsed.pinned}
                >
                  {collapsed.pinned ? (
                    <ChevronRight className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  <Pin className="h-3.5 w-3.5" />
                  <span>Starred</span>
                </button>
              )}
            </div>

            <nav
              ref={navRef}
              className="mt-2 flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-4"
            >
              {allChats.filter((c) => c.pinned).length > 0 &&
                !collapsed.pinned && (
                  <ul className="mb-2 space-y-1">
                    {allChats
                      .filter((c) => c.pinned)
                      .map((c) => (
                        <li key={c.id}>
                          <div className="group relative">
                            <button
                              onClick={() => onSelect(c.id)}
                              className={cls(
                                "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                                c.id === selectedId
                                  ? "bg-accent"
                                  : "hover:bg-accent",
                              )}
                              title={c.title}
                            >
                              {editingId === c.id ? (
                                <input
                                  autoFocus
                                  value={draftTitle}
                                  onChange={(e) =>
                                    setDraftTitle(e.target.value)
                                  }
                                  onBlur={() =>
                                    handleRenameAndFlash(c.id, draftTitle)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleRenameAndFlash(c.id, draftTitle);
                                    else if (e.key === "Escape") {
                                      setEditingId(null);
                                      setDraftTitle("");
                                    }
                                  }}
                                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm outline-none"
                                />
                              ) : (
                                <span
                                  className={cls(
                                    "truncate text-sm",
                                    flashId === c.id &&
                                      "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600",
                                  )}
                                >
                                  {c.title}
                                </span>
                              )}
                              <button
                                type="button"
                                data-conv-menu-trigger
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuForId((id) =>
                                    id === c.id ? null : c.id,
                                  );
                                }}
                                className="ml-auto rounded-md p-1 text-sidebar-foreground/60 opacity-0 transition group-hover:opacity-100 hover:bg-accent"
                                aria-label="Conversation options"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </button>

                            {openMenuForId === c.id && (
                              <div
                                data-conv-menu
                                className="absolute right-1 top-8 z-50 w-44 rounded-lg border border-border bg-popover p-1 shadow-lg"
                              >
                                <button
                                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuForId(null);
                                    setEditingId(c.id);
                                    setDraftTitle(c.title);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" /> Rename
                                </button>
                                <button
                                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuForId(null);
                                    togglePin(c.id);
                                  }}
                                >
                                  <Star
                                    className={cls(
                                      "h-4 w-4",
                                      c.pinned
                                        ? "fill-sidebar-foreground text-sidebar-foreground"
                                        : "",
                                    )}
                                  />
                                  {c.pinned ? "Unstar" : "Star"}
                                </button>
                                <button
                                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 hover:bg-red-500/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuForId(null);
                                    onDelete(c.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                )}

              <button
                onClick={() =>
                  setCollapsed((s) => ({ ...s, recent: !s.recent }))
                }
                className="mt-2 mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-sidebar-foreground/60 hover:bg-accent"
                aria-expanded={!collapsed.recent}
              >
                {collapsed.recent ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                <Clock className="h-3.5 w-3.5" /> <span>Recent</span>
              </button>

              {!collapsed.recent && (
                <ul className="space-y-1">
                  {allChats
                    .filter((c) => !c.pinned)
                    .map((c) => (
                      <li key={c.id}>
                        <div className="group relative">
                          <button
                            onClick={() => onSelect(c.id)}
                            className={cls(
                              "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                              c.id === selectedId
                                ? "bg-accent"
                                : "hover:bg-accent",
                            )}
                            title={c.title}
                          >
                            {editingId === c.id ? (
                              <input
                                autoFocus
                                value={draftTitle}
                                onChange={(e) => setDraftTitle(e.target.value)}
                                onBlur={() =>
                                  handleRenameAndFlash(c.id, draftTitle)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleRenameAndFlash(c.id, draftTitle);
                                  else if (e.key === "Escape") {
                                    setEditingId(null);
                                    setDraftTitle("");
                                  }
                                }}
                                className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm outline-none"
                              />
                            ) : (
                              <span
                                className={cls(
                                  "truncate text-sm",
                                  flashId === c.id &&
                                    "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600",
                                )}
                              >
                                {c.title}
                              </span>
                            )}
                            <button
                              type="button"
                              data-conv-menu-trigger
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuForId((id) =>
                                  id === c.id ? null : c.id,
                                );
                              }}
                              className="ml-auto rounded-md p-1 text-sidebar-foreground/60 opacity-0 transition group-hover:opacity-100 hover:bg-accent"
                              aria-label="Conversation options"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </button>

                          {openMenuForId === c.id && (
                            <div
                              data-conv-menu
                              className="absolute right-1 top-8 z-50 w-44 rounded-lg border border-border bg-popover p-1 shadow-lg"
                            >
                              <button
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuForId(null);
                                  setEditingId(c.id);
                                  setDraftTitle(c.title);
                                }}
                              >
                                <Pencil className="h-4 w-4" /> Rename
                              </button>
                              <button
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuForId(null);
                                  togglePin(c.id);
                                }}
                              >
                                <Star
                                  className={cls(
                                    "h-4 w-4",
                                    c.pinned
                                      ? "fill-sidebar-foreground text-sidebar-foreground"
                                      : "",
                                  )}
                                />
                                {c.pinned ? "Unstar" : "Star"}
                              </button>
                              <button
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 hover:bg-red-500/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuForId(null);
                                  onDelete(c.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </nav>

            <div className="border-t border-border px-3 py-3">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user?.image || undefined}
                            alt={user?.name || user?.email || "User"}
                          />
                          <AvatarFallback>
                            {
                              (user?.name?.[0]?.toUpperCase() ||
                                user?.email?.[0]?.toUpperCase() ||
                                "U") as string
                            }
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <div className="font-medium">
                          {user?.name || "User"}
                        </div>
                        {user?.email && (
                          <div className="text-muted-foreground">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {user?.name || (user?.email ?? "User")}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {user?.email || ""}
                  </div>
                </div>
              </div>
            </div>

            <SearchModal
              isOpen={showSearchModal}
              onClose={() => setShowSearchModal(false)}
              conversations={conversations}
              selectedId={selectedId}
              onSelect={onSelect}
              togglePin={togglePin}
              createNewChat={createNewChat}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
