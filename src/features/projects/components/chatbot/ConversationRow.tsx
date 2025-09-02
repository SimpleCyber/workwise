"use client"

import { useState, useRef, useEffect } from "react"
import { Star, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { cls } from "./utils"

export default function ConversationRow({ data, active, onSelect, onTogglePin, onRename, onDelete }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(data.title || "")
  const rowRef = useRef(null)

  useEffect(() => {
    function onDoc(e) {
      if (open && rowRef.current && !rowRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  function commitRename() {
    const t = (title || "").trim()
    if (!t) {
      setEditing(false)
      return
    }
    onRename?.(t)
    setEditing(false)
  }

  return (
    <div className="group relative" ref={rowRef}>
      <button
        onClick={onSelect}
        className={cls(
          "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left",
          active ? "bg-zinc-100" : "hover:bg-zinc-100",
        )}
        title={data.title}
      >
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename()
              else if (e.key === "Escape") setEditing(false)
            }}
            className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none"
          />
        ) : (
          <span className="truncate text-sm">{data.title}</span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation()
            setOpen((s) => !s)
          }}
          title="Options"
          className="ml-auto rounded-md p-1 text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:bg-zinc-200/50"
          aria-label="Conversation options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </button>

      {open && !editing && (
        <div className="absolute right-1 top-8 z-50 w-44 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
          <div className="relative group">
            <button
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-100"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                setTitle(data.title || "")
                setEditing(true)
              }}
            >
              <Pencil className="h-4 w-4" /> Rename
            </button>
            <span className="pointer-events-none absolute left-2 top-full mt-1 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
              Rename
            </span>
          </div>

          <div className="relative group">
            <button
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-100"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                onTogglePin?.()
              }}
            >
              <Star className={cls("h-4 w-4", data.pinned ? "fill-zinc-800 text-zinc-800" : "")} />
              {data.pinned ? "Unstar" : "Star"}
            </button>
            <span className="pointer-events-none absolute left-2 top-full mt-1 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
              {data.pinned ? "Unstar" : "Star"}
            </span>
          </div>

          <div className="relative group">
            <button
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                onDelete?.()
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
            <span className="pointer-events-none absolute left-2 top-full mt-1 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
              Delete
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
