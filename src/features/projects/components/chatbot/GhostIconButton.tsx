import type React from "react";

export default function GhostIconButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      className="hidden rounded-full border border-border bg-card/70 p-2 text-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:inline-flex transition-colors"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
