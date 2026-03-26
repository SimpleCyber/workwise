"use client";
import { useMemo, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, SearchIcon, Plus, Clock } from "lucide-react";

type ConversationListItem = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string; // ISO
};
type TimeGroup = "Today" | "Yesterday" | "Previous 7 Days" | "Older";

function getTimeGroup(dateString: string): TimeGroup {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= sevenDaysAgo) return "Previous 7 Days";
  return "Older";
}

type SearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  togglePin: (id: string) => void;
  createNewChat: () => void;
};

export default function SearchModal({
  isOpen,
  onClose,
  conversations,
  selectedId,
  onSelect,
  togglePin,
  createNewChat,
}: SearchModalProps) {
  const [query, setQuery] = useState("");

  const filteredConversations = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter(
      (c) =>
        (c.title || "").toLowerCase().includes(q) ||
        (c.preview || "").toLowerCase().includes(q),
    );
  }, [conversations, query]);

  const groupedConversations = useMemo(() => {
    const groups: Record<TimeGroup, ConversationListItem[]> = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };
    filteredConversations
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .forEach((conv) => {
        const group = getTimeGroup(conv.updatedAt);
        groups[group].push(conv);
      });
    return groups;
  }, [filteredConversations]);

  const handleClose = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-popover shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-border p-4">
              <SearchIcon className="h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chats..."
                className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground text-foreground"
                autoFocus
              />
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              <div className="border-b border-border p-2">
                <button
                  onClick={createNewChat}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-accent"
                >
                  <Plus className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">New chat</span>
                </button>
              </div>

              {Object.entries(groupedConversations).map(
                ([groupName, convs]) => {
                  if (!convs.length) return null;
                  return (
                    <div
                      key={groupName}
                      className="border-b border-border p-2 last:border-b-0"
                    >
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                        {groupName}
                      </div>
                      <div className="space-y-1">
                        {convs.map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => {
                              onSelect(conv.id);
                              handleClose();
                            }}
                            className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-accent"
                          >
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">
                                {conv.title}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                },
              )}

              {filteredConversations.length === 0 && query.trim() && (
                <div className="p-8 text-center">
                  <SearchIcon className="mx-auto h-12 w-12 text-muted" />
                  <div className="mt-4 text-lg font-medium text-foreground">
                    No chats found
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Try searching with different keywords
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
