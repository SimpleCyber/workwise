"use client";

import React, { useEffect, useRef } from "react";
import { format, isSameDay } from "date-fns";
import {
  CalendarEvent,
  HOURS,
  HOUR_HEIGHT,
  formatHour,
  getEventTopAndHeight,
  getEventColor,
} from "./types";

interface DayViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  googleTokens?: any[];
  onEditEvent: (event: CalendarEvent) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  events,
  selectedDate,
  googleTokens = [],
  onEditEvent,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);

  const dayEvents = events.filter((e) =>
    isSameDay(new Date(e.startTime), selectedDate),
  );

  const now = new Date();
  const isViewingToday = isSameDay(selectedDate, now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentLineTop = (currentMinutes / 60) * HOUR_HEIGHT;

  useEffect(() => {
    if (timelineRef.current) {
      const scrollTo = Math.max(0, (now.getHours() - 1) * HOUR_HEIGHT);
      timelineRef.current.scrollTop = scrollTo;
    }
  }, [selectedDate]);

  return (
    <div
      ref={timelineRef}
      className="flex-1 overflow-y-auto relative bg-background border-t border-border/40"
    >
      <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="absolute w-full flex items-start"
            style={{ top: hour * HOUR_HEIGHT }}
          >
            <div className="w-14 text-right pr-2 text-[11px] text-muted-foreground/70 font-mono -mt-2 select-none">
              {hour === 0 ? "" : formatHour(hour)}
            </div>
            <div className="flex-1 border-t border-border/40" />
          </div>
        ))}

        {isViewingToday && (
          <div
            className="absolute left-12 right-0 z-20 pointer-events-none flex items-center"
            style={{ top: currentLineTop }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shrink-0" />
            <div className="flex-1 h-[2px] bg-red-500" />
          </div>
        )}

        {dayEvents.map((event) => {
          const { top, height } = getEventTopAndHeight(
            event.startTime,
            event.endTime,
          );
          const color = getEventColor(event, googleTokens);

          return (
            <div
              key={event._id}
              onClick={() => onEditEvent(event)}
              className="absolute left-14 right-3 z-10 rounded-lg px-2.5 py-1.5 cursor-pointer overflow-hidden transition-all shadow-sm hover:shadow-md border"
              style={{
                top,
                height: Math.max(height, 28),
                backgroundColor: `${color}15`,
                borderColor: `${color}40`,
                borderLeft: `4px solid ${color}`,
              }}
            >
              <p className="text-xs font-semibold text-foreground truncate leading-tight">
                {event.title}
              </p>
              {height > 35 && (
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  {format(new Date(event.startTime), "h:mm a")} -{" "}
                  {format(new Date(event.endTime), "h:mm a")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
