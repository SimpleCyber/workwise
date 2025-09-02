"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, BrainCircuit } from "lucide-react";

const MODELS = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gpt-4o-mini", name: "GPT-4o mini" },
  { id: "gpt-4.1", name: "GPT-4.1" },
];

type ModelSelectorProps = {
  value?: string;
  onChange?: (id: string) => void;
};

export default function ModelSelector({
  value = "gpt-4o",
  onChange,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const active = MODELS.find((m) => m.id === value) || MODELS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm hover:border-gray-300"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <BrainCircuit className="h-4 w-4 text-gray-600" aria-hidden="true" />
        <span className="text-gray-800">{active.name}</span>
        <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute z-50 mt-2 w-48 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
        >
          {MODELS.map((m) => (
            <button
              key={m.id}
              role="menuitem"
              onClick={() => {
                onChange?.(m.id);
                setOpen(false);
              }}
              className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
