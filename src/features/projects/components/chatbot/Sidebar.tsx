"use client"

import { useState, useMemo } from "react"
import ConversationRow from "./ConversationRow"
import SearchModal from "./SearchModal"

export default function Sidebar({
  open,
  onClose,
  collapsed,
  setCollapsed,
  sidebarCollapsed,
  setSidebarCollapsed,
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
  onRename,
  onDelete,
  user,
}: any) {
  const [searchOpen, setSearchOpen] = useState(false)

  const lists = useMemo(
    () => [
      { label: "Pinned", items: pinned || [] },
      { label: "Recent", items: recent || [] },
    ],
    [pinned, recent],
  )

  return (
    <>
      <aside
        className={[
          "border-r border-zinc-200 bg-white",
          "w-80 shrink-0 overflow-y-auto",
          sidebarCollapsed ? "hidden md:block md:w-16" : "block",
          open ? "fixed inset-y-0 left-0 z-40 w-80 md:static" : "md:static",
        ].join(" ")}
      >
        <div className="p-3">
          <button
            onClick={createNewChat}
            className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            New chat
          </button>
          <div className="mt-3">
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats…"
              className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none"
            />
          </div>

          <div className="mt-4 space-y-4">
            {lists.map((group) =>
              group.items.length ? (
                <div key={group.label}>
                  <div className="px-2 py-1 text-xs font-medium text-zinc-500">{group.label}</div>
                  <div className="space-y-1">
                    {group.items.map((c: any) => (
                      <ConversationRow
                        key={c.id}
                        data={c}
                        active={selectedId === c.id}
                        onSelect={() => onSelect?.(c.id)}
                        onTogglePin={() => togglePin?.(c.id)}
                        onRename={(t: string) => onRename?.(c.id, t)}
                        onDelete={() => onDelete?.(c.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </div>
      </aside>

      {open && (
        <button className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} aria-label="Close sidebar" />
      )}

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        conversations={conversations}
        selectedId={selectedId}
        onSelect={onSelect}
        togglePin={togglePin}
        createNewChat={createNewChat}
      />
    </>
  )
}
