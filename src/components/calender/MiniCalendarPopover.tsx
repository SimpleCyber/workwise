"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  addMonths,
  subMonths,
} from "date-fns";

interface MiniCalendarPopoverProps {
  miniCalMonth: Date;
  selectedDate: Date;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
  popoverRef: React.RefObject<HTMLDivElement>;
}

export const MiniCalendarPopover: React.FC<MiniCalendarPopoverProps> = ({
  miniCalMonth,
  selectedDate,
  onMonthChange,
  onSelectDate,
  popoverRef,
}) => {
  const monthStart = startOfMonth(miniCalMonth);
  const monthEnd = endOfMonth(miniCalMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div
      ref={popoverRef}
      className="absolute top-[100px] left-3 right-3 z-50 bg-popover/95 backdrop-blur-md border border-border rounded-xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-foreground">
          {format(miniCalMonth, "MMMM yyyy")}
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onMonthChange(subMonths(miniCalMonth, 1))}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onMonthChange(addMonths(miniCalMonth, 1))}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="h-6 flex items-center justify-center text-[10px] font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, miniCalMonth);
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`h-7 w-7 mx-auto flex items-center justify-center rounded-full text-xs transition-all ${
                !inMonth ? "text-muted-foreground/30" : "text-foreground"
              } ${
                selected
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : today
                    ? "bg-accent text-accent-foreground font-semibold border border-primary/40"
                    : "hover:bg-muted"
              }`}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
};
