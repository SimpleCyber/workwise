"use client";
import { useState } from "react";
import { MoreHorizontal, Menu, BrainCircuit, ChevronDown } from "lucide-react";
import GhostIconButton from "./GhostIconButton";

type ModelDropdownProps = {
  value: string;
  onChange?: (id: string) => void;
};

function ModelDropdown({ value, onChange }: ModelDropdownProps) {
  const [open, setOpen] = useState(false);
  const models = [
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o mini" },
    { id: "gpt-4.1", name: "GPT-4.1" },
  ];
  const active = models.find((m) => m.id === value) ?? models[0];
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50 focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <BrainCircuit className="h-4 w-4 text-zinc-700" />
        <span>{active.name}</span>
        <ChevronDown className="h-4 w-4 text-zinc-500" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute z-50 mt-2 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white p-1 shadow-lg"
        >
          {models.map((m) => (
            <button
              key={m.id}
              role="menuitem"
              onClick={() => {
                onChange?.(m.id);
                setOpen(false);
              }}
              className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-zinc-100"
            >
              {m.name}
            </button>
          ))}
        </div>
      )}
      {open && (
        <button
          aria-hidden
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 cursor-default"
          tabIndex={-1}
        />
      )}
    </div>
  );
}

type HeaderProps = {
  createNewChat: () => void;
  sidebarCollapsed: boolean;
  setSidebarOpen: (open: boolean) => void;
};

export default function Header({
  createNewChat,
  sidebarCollapsed,
  setSidebarOpen,
}: HeaderProps) {
  const [model, setModel] = useState("gpt-4o");

  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur">
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <ModelDropdown value={model} onChange={setModel} />

      <div className="ml-auto flex items-center gap-2">
        <GhostIconButton label="More">
          <MoreHorizontal className="h-4 w-4" />
        </GhostIconButton>
      </div>
    </div>
  );
}
