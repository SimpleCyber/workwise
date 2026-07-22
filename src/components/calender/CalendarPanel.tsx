"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { calendarOpenAtom } from "@/lib/panel-atoms";
import { TooltipProvider } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

import type { CalendarEvent, ViewMode, PanelView } from "./types";
import { CalendarHeader } from "./CalendarHeader";
import { MiniCalendarPopover } from "./MiniCalendarPopover";
import { AgendaView } from "./AgendaView";
import { DayView } from "./DayView";
import { MonthView } from "./MonthView";
import { CalendarsView } from "./CalendarsView";
import { CreateEventForm } from "./CreateEventForm";
import { EditEventForm } from "./EditEventForm";

export const DraggableCalendarPanel = ({
  workspaceId,
}: {
  workspaceId: Id<"workspaces">;
}) => {
  const [, setOpen] = useAtom(calendarOpenAtom);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("agenda");
  const [panelView, setPanelView] = useState<PanelView>("main");
  const [showMiniCal, setShowMiniCal] = useState(false);
  const [miniCalMonth, setMiniCalMonth] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [hiddenCalendars, setHiddenCalendars] = useState<Set<string>>(
    new Set(),
  );
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const datePickerRef = useRef<HTMLDivElement>(null);

  // Storage preferences
  useEffect(() => {
    try {
      const stored = localStorage.getItem("workwise_hidden_calendars");
      if (stored) setHiddenCalendars(new Set(JSON.parse(stored)));
    } catch (e) {
      console.error("Failed to load hidden calendars", e);
    }
  }, []);

  const toggleCalendarVisibility = (id: string) => {
    setHiddenCalendars((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(
          "workwise_hidden_calendars",
          JSON.stringify(Array.from(next)),
        );
      } catch (e) {
        console.error("Failed to save hidden calendars", e);
      }
      return next;
    });
  };

  // Convex Data Queries & Mutations
  const events = (useQuery(api.calendarEvents.getEventsByWorkspace, {
    workspaceId,
  }) || []) as CalendarEvent[];
  const googleTokens = useQuery(api.googleAuth.getGoogleTokens) || [];
  const workspaceMembers =
    useQuery(api.projects.getWorkspaceMembers, { workspaceId }) || [];

  const createEvent = useMutation(api.calendarEvents.createEvent);
  const deleteEventMutation = useMutation(api.calendarEvents.deleteEvent);
  const updateEventMutation = useMutation(api.calendarEvents.updateEvent);
  const generateCalendarAuthUrl = useAction(
    api.googleCalendarActions.generateAuthUrl,
  );
  const createMeeting = useAction(api.googleCalendarActions.createMeeting);
  const syncGoogleCalendar = useAction(
    api.googleCalendarActions.syncGoogleCalendar,
  );
  const disconnectGoogle = useMutation(api.googleAuth.deleteGoogleTokens);

  // Filter events
  const visibleEvents = useMemo(() => {
    return events.filter((e) => {
      const isLocal = !e.googleAccountEmail;
      if (isLocal && hiddenCalendars.has("local")) return false;
      if (!isLocal && hiddenCalendars.has(e.googleAccountEmail!)) return false;
      return true;
    });
  }, [events, hiddenCalendars]);

  // Click outside to close mini calendar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(e.target as Node)
      ) {
        setShowMiniCal(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Handlers
  const handleSyncCalendar = async () => {
    setIsSyncing(true);
    try {
      const result = await syncGoogleCalendar({ workspaceId });
      toast.success(`Synced ${result.synced} events`);
    } catch (err: any) {
      toast.error("Sync failed", { description: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const redirectUri = `${window.location.origin}/api/calendar/google/callback`;
      const returnTo = window.location.pathname;
      const authUrl = await generateCalendarAuthUrl({ redirectUri, returnTo });
      window.location.href = authUrl;
    } catch (err: any) {
      toast.error("Connection failed", { description: err.message });
    }
  };

  const handleDisconnect = async (tokenId: Id<"googleTokens">) => {
    try {
      await disconnectGoogle({ tokenId });
      toast.success("Account disconnected");
    } catch (err: any) {
      toast.error("Failed to disconnect", { description: err.message });
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    try {
      await deleteEventMutation({ eventId: event._id });
      toast.success("Event deleted");
    } catch (err: any) {
      toast.error("Failed to delete event", { description: err.message });
    }
  };

  const handleCreateSubmit = async (data: {
    title: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
    guests: { name: string; email: string }[];
    selectedAccount: string;
  }) => {
    if (!data.title.trim()) {
      toast.error("Please add a title");
      return;
    }
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const startDateTime = new Date(`${dateStr}T${data.startTime}`);
      const endDateTime = new Date(`${dateStr}T${data.endTime}`);
      const attendees =
        data.guests.length > 0 ? data.guests.map((g) => g.email) : undefined;

      if (data.selectedAccount !== "local") {
        await createMeeting({
          title: data.title,
          description: data.description || undefined,
          startTime: startDateTime.getTime(),
          endTime: endDateTime.getTime(),
          workspaceId,
          attendees,
          email: data.selectedAccount,
        });
      } else {
        await createEvent({
          title: data.title,
          description: data.description || undefined,
          startTime: startDateTime.getTime(),
          endTime: endDateTime.getTime(),
          location: data.location || undefined,
          attendees,
          workspaceId,
        });
      }
      toast.success("Event created successfully");
      setPanelView("main");
    } catch (err: any) {
      toast.error("Failed to create event", { description: err.message });
    }
  };

  const handleUpdateSubmit = async (data: {
    title: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
    attendees: string;
  }) => {
    if (!editingEvent || !data.title.trim()) {
      toast.error("Please add a title");
      return;
    }
    try {
      const dateStr = format(new Date(editingEvent.startTime), "yyyy-MM-dd");
      const startDateTime = new Date(`${dateStr}T${data.startTime}`);
      const endDateTime = new Date(`${dateStr}T${data.endTime}`);
      const attendeesList = data.attendees
        ? data.attendees
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean)
        : undefined;

      await updateEventMutation({
        eventId: editingEvent._id,
        title: data.title,
        description: data.description || undefined,
        startTime: startDateTime.getTime(),
        endTime: endDateTime.getTime(),
        location: data.location || undefined,
        attendees: attendeesList,
      });
      toast.success("Event updated");
      setEditingEvent(null);
      setPanelView("main");
    } catch (err: any) {
      toast.error("Failed to update event", { description: err.message });
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-full flex flex-col bg-background text-foreground border-l border-border relative select-none">
        {panelView === "create" && (
          <CreateEventForm
            selectedDate={selectedDate}
            googleTokens={googleTokens}
            workspaceMembers={workspaceMembers}
            onCancel={() => setPanelView("main")}
            onSubmit={handleCreateSubmit}
          />
        )}

        {panelView === "edit" && editingEvent && (
          <EditEventForm
            event={editingEvent}
            onCancel={() => {
              setEditingEvent(null);
              setPanelView("main");
            }}
            onDelete={(ev) => {
              handleDeleteEvent(ev);
              setEditingEvent(null);
              setPanelView("main");
            }}
            onSubmit={handleUpdateSubmit}
          />
        )}

        {panelView === "main" && (
          <>
            <CalendarHeader
              eventCount={visibleEvents.length}
              hasGoogleTokens={googleTokens.length > 0}
              isSyncing={isSyncing}
              selectedDate={selectedDate}
              viewMode={viewMode}
              showMiniCal={showMiniCal}
              onSync={handleSyncCalendar}
              onCreateOpen={() => setPanelView("create")}
              onClose={() => setOpen(false)}
              onToggleMiniCal={() => {
                setMiniCalMonth(selectedDate);
                setShowMiniCal(!showMiniCal);
              }}
              onToday={() => setSelectedDate(new Date())}
              onDateChange={setSelectedDate}
              onViewModeChange={setViewMode}
            />

            {showMiniCal && (
              <MiniCalendarPopover
                miniCalMonth={miniCalMonth}
                selectedDate={selectedDate}
                onMonthChange={setMiniCalMonth}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setShowMiniCal(false);
                }}
                popoverRef={datePickerRef}
              />
            )}

            {viewMode === "agenda" && (
              <AgendaView
                events={visibleEvents}
                selectedDate={selectedDate}
                googleTokens={googleTokens}
                onEditEvent={(event) => {
                  setEditingEvent(event);
                  setPanelView("edit");
                }}
                onDeleteEvent={handleDeleteEvent}
                onCreateOpen={() => setPanelView("create")}
              />
            )}

            {viewMode === "day" && (
              <DayView
                events={visibleEvents}
                selectedDate={selectedDate}
                googleTokens={googleTokens}
                onEditEvent={(event) => {
                  setEditingEvent(event);
                  setPanelView("edit");
                }}
              />
            )}

            {viewMode === "month" && (
              <MonthView
                events={visibleEvents}
                selectedDate={selectedDate}
                googleTokens={googleTokens}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setViewMode("agenda");
                }}
              />
            )}

            {viewMode === "calendars" && (
              <CalendarsView
                googleTokens={googleTokens}
                hiddenCalendars={hiddenCalendars}
                onToggleVisibility={toggleCalendarVisibility}
                onDisconnect={handleDisconnect}
                onConnectGoogle={handleConnectGoogle}
              />
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
};
