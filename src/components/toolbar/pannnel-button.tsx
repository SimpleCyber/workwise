"use client";

import React from "react";
import { Bell, CalendarClock } from "lucide-react";
import { useAtom } from "jotai";
import { calendarOpenAtom, notificationOpenAtom } from "@/lib/panel-atoms";
import { Tooltip } from "@/components/Tooltip";

interface PanelButtonProps {
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "center"
    | "custom";
  orientation?: "horizontal" | "vertical";
  className?: string;
  style?: React.CSSProperties;
  showNotifications?: boolean;
  showCalendar?: boolean;
}

export const PanelButton: React.FC<PanelButtonProps> = ({
  position = "top-right",
  orientation = "horizontal",
  className = "",
  style = {},
  showNotifications = true,
  showCalendar = true,
}) => {
  const [calendarOpen, setCalendarOpen] = useAtom(calendarOpenAtom);
  const [notificationOpen, setNotificationOpen] = useAtom(notificationOpenAtom);

  const tooltipDirection = (() => {
    switch (position) {
      case "top-left":
      case "bottom-left":
        return "right"; // Panel on left → show tooltip to right

      case "top-right":
      case "bottom-right":
        return "left"; // Panel on right → show tooltip to left

      case "center":
      case "custom":
        return "right"; // Default safe side

      default:
        return "right";
    }
  })();

  const positionClasses = {
    "top-right": "fixed top-4 right-4",
    "top-left": "fixed top-4 left-4",
    "bottom-right": "fixed bottom-4 right-4",
    "bottom-left": "fixed bottom-4 left-4",
    center:
      "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
    custom: "",
  };

  const orientationClasses = {
    horizontal: "flex flex-row gap-2",
    vertical: "flex flex-col gap-2",
  };

  const containerClasses = `
    ${position !== "custom" ? positionClasses[position] : ""}
    ${orientationClasses[orientation]}
    z-50
    ${className}
  `.trim();

  return (
    <div className={containerClasses} style={style}>
      {showNotifications && (
        <div className="relative group">
          <button
            onClick={() => {
              setNotificationOpen((prev) => {
                const next = !prev;
                if (next && showCalendar) setCalendarOpen(false);
                return next;
              });
            }}
            className={`
              p-2 rounded-md border transition-colors
              ${
                notificationOpen
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }
            `}
          >
            <Bell className="h-4 w-4" />
          </button>
          <Tooltip text="Notifications" direction={tooltipDirection} />
        </div>
      )}

      {showCalendar && (
        <div className="relative group">
          <button
            onClick={() => {
              setCalendarOpen((prev) => {
                const next = !prev;
                if (next && showNotifications) setNotificationOpen(false);
                return next;
              });
            }}
            className={`
              p-2 rounded-md border transition-colors
              ${
                calendarOpen
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }
            `}
          >
            <CalendarClock className="h-4 w-4" />
          </button>
          <Tooltip text="Calendar" direction={tooltipDirection} />
        </div>
      )}
    </div>
  );
};
