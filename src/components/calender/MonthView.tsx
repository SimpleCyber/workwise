"use client";

import React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { CalendarEvent, getEventColor } from "./types";

interface MonthViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  googleTokens?: any[];
  onSelectDate: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  events,
  selectedDate,
  googleTokens = [],
  onSelectDate,
}) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="flex-1 flex flex-col p-3 overflow-hidden">
      <div className="grid grid-cols-7 mb-2 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="text-[11px] font-semibold text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 gap-1 bg-muted/20 p-1 rounded-xl border border-border/50 overflow-y-auto">
        {days.map((day) => {
          const dayEvents = events.filter((e) =>
            isSameDay(new Date(e.startTime), day),
          );
          const isSel = isSameDay(day, selectedDate);
          const isTod = isToday(day);
          const isCurrMonth = isSameMonth(day, selectedDate);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`flex flex-col items-center justify-start p-1 rounded-lg transition-all min-h-[54px] border ${
                !isCurrMonth
                  ? "opacity-40 border-transparent"
                  : "border-border/30"
              } ${
                isSel
                  ? "bg-primary/10 border-primary/40 text-primary font-semibold"
                  : isTod
                    ? "bg-accent border-accent-foreground/20 font-semibold"
                    : "bg-card hover:bg-muted/50 text-card-foreground"
              }`}
            >
              <span
                className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${
                  isTod ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {format(day, "d")}
              </span>

              <div className="w-full flex flex-col gap-0.5 mt-1 overflow-hidden">
                {dayEvents.slice(0, 2).map((e) => (
                  <div
                    key={e._id}
                    className="text-[9px] truncate px-1 py-0.5 rounded font-medium text-left"
                    style={{
                      backgroundColor: `${getEventColor(e, googleTokens)}20`,
                      color: getEventColor(e, googleTokens),
                    }}
                  >
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <span className="text-[9px] text-muted-foreground font-semibold text-center">
                    +{dayEvents.length - 2} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
