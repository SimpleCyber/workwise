"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { format, subMonths, addMonths, subDays, addDays } from "date-fns";
import type { ViewMode } from "./types";

interface CalendarHeaderProps {
  eventCount: number;
  hasGoogleTokens: boolean;
  isSyncing: boolean;
  selectedDate: Date;
  viewMode: ViewMode;
  showMiniCal: boolean;
  onSync: () => void;
  onCreateOpen: () => void;
  onClose: () => void;
  onToggleMiniCal: () => void;
  onToday: () => void;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  eventCount,
  hasGoogleTokens,
  isSyncing,
  selectedDate,
  viewMode,
  showMiniCal,
  onSync,
  onCreateOpen,
  onClose,
  onToggleMiniCal,
  onToday,
  onDateChange,
  onViewModeChange,
}) => {
  return (
    <div className="px-3 pt-3 pb-2 border-b border-border/60 bg-card/50">
      {/* Top bar title and actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">
            Calendar
          </span>
          <Badge
            variant="secondary"
            className="text-[10px] font-medium px-1.5 py-0"
          >
            {eventCount}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          {hasGoogleTokens && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Sync Google Calendar"
              disabled={isSyncing}
              onClick={onSync}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-muted-foreground ${
                  isSyncing ? "animate-spin" : ""
                }`}
              />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Create Event"
            onClick={onCreateOpen}
          >
            <Plus className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Date Navigator */}
      <div className="flex items-center justify-between gap-1 py-1">
        <button
          onClick={onToggleMiniCal}
          className="flex items-center gap-1 text-xs font-semibold text-foreground hover:bg-accent px-2 py-1 rounded-lg transition-colors"
        >
          {format(selectedDate, "EEE, MMM d, yyyy")}
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
              showMiniCal ? "rotate-180" : ""
            }`}
          />
        </button>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] px-2 font-medium rounded-md"
            onClick={onToday}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() =>
              onDateChange(
                viewMode === "month"
                  ? subMonths(selectedDate, 1)
                  : subDays(selectedDate, 1),
              )
            }
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() =>
              onDateChange(
                viewMode === "month"
                  ? addMonths(selectedDate, 1)
                  : addDays(selectedDate, 1),
              )
            }
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="grid grid-cols-4 gap-1 p-0.5 bg-muted/60 rounded-xl text-center text-xs mt-1">
        {[
          { id: "agenda", label: "Agenda" },
          { id: "day", label: "Day" },
          { id: "month", label: "Month" },
          { id: "calendars", label: "Sources" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewModeChange(tab.id as ViewMode)}
            className={`py-1 rounded-lg font-medium transition-all ${
              viewMode === tab.id
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
