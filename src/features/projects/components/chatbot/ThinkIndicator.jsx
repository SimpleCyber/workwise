import { Brain } from "lucide-react";

export default function ThinkIndicator() {
  return (
    <div className="flex items-center justify-center gap-2 py-2 text-gray-500">
      <Brain
        className="h-4 w-4 animate-pulse text-gray-500"
        aria-hidden="true"
      />
      <span className="text-sm">Thinking…</span>
    </div>
  );
}
