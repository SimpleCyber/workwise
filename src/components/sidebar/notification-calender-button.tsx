"use client";

import React from "react";
import { Bell, CalendarClock } from "lucide-react";
import { useAtom } from "jotai";
import { calendarOpenAtom, notificationOpenAtom } from "@/lib/panel-atoms";
import { SidebarButton } from "./sidebar-button";

interface PanelButtonProps {
  className?: string;
}

export const PanelButtons: React.FC<PanelButtonProps> = ({
  className = "",
}) => {
  const [calendarOpen, setCalendarOpen] = useAtom(calendarOpenAtom);
  const [notificationOpen, setNotificationOpen] = useAtom(notificationOpenAtom);

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <SidebarButton
        icon={Bell}
        label="Notifications"
        isActive={notificationOpen}
        onClick={() => {
          setNotificationOpen((prev) => {
            const next = !prev;
            if (next) setCalendarOpen(false);
            return next;
          });
        }}
      />

      <SidebarButton
        icon={CalendarClock}
        label="Calendar"
        isActive={calendarOpen}
        onClick={() => {
          setCalendarOpen((prev) => {
            const next = !prev;
            if (next) setNotificationOpen(false);
            return next;
          });
        }}
      />
    </div>
  );
};
