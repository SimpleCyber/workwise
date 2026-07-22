"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus } from "lucide-react";
import { format, isToday, startOfDay, isBefore } from "date-fns";
import { CalendarEvent } from "./types";
import { AgendaEventCard } from "./AgendaEventCard";

interface AgendaViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  googleTokens?: any[];
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (event: CalendarEvent) => void;
  onCreateOpen: () => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  events,
  selectedDate,
  googleTokens = [],
  onEditEvent,
  onDeleteEvent,
  onCreateOpen,
}) => {
  const selectedDayStart = startOfDay(selectedDate);

  const upcomingEvents = events
    .filter((e) => {
      const eventDate = startOfDay(new Date(e.startTime));
      return !isBefore(eventDate, selectedDayStart);
    })
    .sort((a, b) => a.startTime - b.startTime);

  const grouped: Record<string, CalendarEvent[]> = {};
  upcomingEvents.forEach((e) => {
    const key = format(new Date(e.startTime), "yyyy-MM-dd");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  const dateKeys = Object.keys(grouped).sort();

  if (dateKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mb-3 text-muted-foreground">
          <CalendarDays className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          No upcoming events
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
          No scheduled events starting from {format(selectedDate, "MMM d")}.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-1.5 text-xs rounded-full"
          onClick={onCreateOpen}
        >
          <Plus className="w-3.5 h-3.5" />
          Create an event
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      {dateKeys.map((dateKey) => {
        const date = new Date(dateKey + "T00:00:00");
        const dayEvents = grouped[dateKey];
        const isCurrentDay = isToday(date);

        return (
          <div key={dateKey} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isCurrentDay
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCurrentDay ? "Today" : format(date, "EEE, MMM d")}
                </span>
                {!isCurrentDay && (
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {format(date, "yyyy")}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
              </span>
            </div>

            <div className="space-y-2">
              {dayEvents.map((event) => (
                <AgendaEventCard
                  key={event._id}
                  event={event}
                  googleTokens={googleTokens}
                  onEdit={onEditEvent}
                  onDelete={onDeleteEvent}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
