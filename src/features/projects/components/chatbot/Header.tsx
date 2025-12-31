"use client";
import { useState } from "react";
import { Menu, BrainCircuit, ChevronDown } from "lucide-react";

type ModelDropdownProps = {
  value: string;
  onChange?: (id: string) => void;
};

function ModelDropdown({ value, onChange }: ModelDropdownProps) {
  const [open, setOpen] = useState(false);
  const models = [
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
  ];
  const active = models.find((m) => m.id === value) ?? models[0];
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <BrainCircuit className="h-4 w-4 text-primary" />
        <span>{active.name}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute z-50 mt-2 w-44 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg"
        >
          {models.map((m) => (
            <button
              key={m.id}
              role="menuitem"
              onClick={() => {
                onChange?.(m.id);
                setOpen(false);
              }}
              className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
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
  compact?: boolean;
};

export default function Header({
  sidebarCollapsed,
  setSidebarOpen,
  compact = false,
}: HeaderProps) {
  const [model, setModel] = useState("gemini-1.5-flash");

  return (
    <div
      className={`sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/80 backdrop-blur ${compact ? "px-2 py-2" : "px-4 py-3"}`}
    >
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <ModelDropdown value={model} onChange={setModel} />
    </div>
  );
}
