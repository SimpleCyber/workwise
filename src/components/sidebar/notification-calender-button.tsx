"use client";

import type React from "react";
import { Bell, CalendarClock, NotebookTabs } from "lucide-react";
import { useAtom } from "jotai";
import {
  calendarOpenAtom,
  notificationOpenAtom,
  notesOpenAtom,
  selectedProjectTaskAtom,
  selectedTodoCardAtom,
} from "@/lib/panel-atoms";
import { SidebarButton } from "./sidebar-button";
import { DraggableNotificationPanel } from "../notification/NotificationPanel";
import { DraggableCalendarPanel } from "../calender/CalendarPanel";
import { useGetUnreadCount } from "@/hooks/use-notifications";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info";

import { useFeatureFlags } from "@/components/feature-flags";

interface PanelButtonProps {
  className?: string;
}

export const PanelButtons: React.FC<PanelButtonProps> = ({
  className = "",
}) => {
  const { isEnabled } = useFeatureFlags();
  const [calendarOpen, setCalendarOpen] = useAtom(calendarOpenAtom);
  const [notificationOpen, setNotificationOpen] = useAtom(notificationOpenAtom);
  const [notesOpen, setNotesOpen] = useAtom(notesOpenAtom);
  const [, setProjectTask] = useAtom(selectedProjectTaskAtom);
  const [, setTodoCard] = useAtom(selectedTodoCardAtom);
  const unreadCount = useGetUnreadCount();

  const workspaceId = useWorkspaceId();
  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspaceInfo({
    id: workspaceId,
  });

  const showNotifications = isEnabled("header_notifications");
  const showCalendar = isEnabled("header_calendar");
  const showNotes = isEnabled("header_notes");

  if (!showNotifications && !showCalendar && !showNotes) {
    return null;
  }

  return (
    <>
      <div className={`flex flex-col items-center gap-1 ${className}`}>
        {showNotifications && (
          <SidebarButton
            icon={Bell}
            label="Notifications"
            isActive={notificationOpen}
            onClick={() => {
              setNotificationOpen((prev) => {
                const next = !prev;
                if (next) {
                  setCalendarOpen(false);
                  setNotesOpen(false);
                  setProjectTask(null);
                  setTodoCard(null);
                }
                return next;
              });
            }}
            badgeCount={unreadCount! > 0 ? unreadCount : undefined}
          />
        )}
        {showCalendar && (
          <SidebarButton
            icon={CalendarClock}
            label="Calendar"
            isActive={calendarOpen}
            onClick={() => {
              setCalendarOpen((prev) => {
                const next = !prev;
                if (next) {
                  setNotificationOpen(false);
                  setNotesOpen(false);
                  setProjectTask(null);
                  setTodoCard(null);
                }
                return next;
              });
            }}
          />
        )}
        {showNotes && (
          <SidebarButton
            icon={NotebookTabs}
            label="Notes"
            isActive={notesOpen}
            onClick={() => {
              setNotesOpen((prev) => {
                const next = !prev;
                if (next) {
                  setNotificationOpen(false);
                  setCalendarOpen(false);
                  setProjectTask(null);
                  setTodoCard(null);
                }
                return next;
              });
            }}
          />
        )}
      </div>
    </>
  );
};
