// components/CalendarPanel.tsx
"use client";

import { useAtom } from "jotai";
import { calendarOpenAtom } from "@/lib/panel-atoms";

export const CalendarPanel = () => {
  const [open] = useAtom(calendarOpenAtom);

  if (!open) return null;

  return (
    <div className="fixed top-10 right-0 z-50 w-96 h-full bg-gray-300  p-4">
      <h2 className="text-xl font-bold">Calendar Panel</h2>
      <div className="mt-4">[Calendar content goes here]</div>
    </div>
  );
};
