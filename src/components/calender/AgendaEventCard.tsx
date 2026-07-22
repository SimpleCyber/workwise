"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Clock,
  MapPin,
  Video,
  Trash2,
  Gift,
  Sparkles,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { CalendarEvent, getEventCategory, getEventColor } from "./types";

interface AgendaEventCardProps {
  event: CalendarEvent;
  googleTokens?: any[];
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}

export const AgendaEventCard: React.FC<AgendaEventCardProps> = ({
  event,
  googleTokens = [],
  onEdit,
  onDelete,
}) => {
  const color = getEventColor(event, googleTokens);
  const category = getEventCategory(event);
  const isAllDay =
    new Date(event.endTime).getTime() - new Date(event.startTime).getTime() >=
    23 * 60 * 60 * 1000;

  let IconComponent = CalendarIcon;
  if (category === "birthday") IconComponent = Gift;
  if (category === "holiday") IconComponent = Sparkles;

  return (
    <div
      onClick={() => onEdit(event)}
      className="group relative bg-card hover:bg-accent/40 border border-border/80 rounded-xl p-3 cursor-pointer transition-all duration-150 shadow-sm hover:shadow-md flex flex-col justify-between"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <IconComponent className="w-4 h-4 shrink-0" style={{ color }} />
            <p className="text-sm font-semibold text-foreground truncate">
              {event.title}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
            <Clock className="w-3 h-3 shrink-0" />
            <span>
              {isAllDay
                ? "All day"
                : `${format(new Date(event.startTime), "h:mm a")} - ${format(new Date(event.endTime), "h:mm a")}`}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(event);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Footer: Meet link + User avatar with tooltip */}
      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-border/40">
        {event.meetLink ? (
          <a
            href={event.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-semibold hover:bg-blue-500/20 transition-colors"
          >
            <Video className="w-3 h-3" />
            Join Meet
          </a>
        ) : (
          <div />
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex items-center gap-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar className="w-5 h-5 border border-border/80">
                <AvatarFallback
                  className="text-[9px] font-bold text-white uppercase"
                  style={{ backgroundColor: color }}
                >
                  {event.googleAccountEmail
                    ? event.googleAccountEmail.charAt(0).toUpperCase()
                    : "W"}
                </AvatarFallback>
              </Avatar>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[11px]">
            {event.googleAccountEmail
              ? `Belongs to: ${event.googleAccountEmail}`
              : "Belongs to: Workwise (Local)"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
