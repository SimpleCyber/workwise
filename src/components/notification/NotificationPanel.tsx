// components/panels/NotificationPanel.tsx
"use client";

import { useAtom } from "jotai";
import { notificationOpenAtom } from "@/lib/panel-atoms";

export const NotificationPanel = () => {
  const [open] = useAtom(notificationOpenAtom);

  if (!open) return null;

  return (
    <div className="fixed top-10 right-0 z-50 w-96 h-full bg-white shadow-xl p-4">
      <h2 className="text-xl font-bold">Notification Panel</h2>
      <div className="mt-4">[Notification content goes here]</div>
    </div>
  );
};
