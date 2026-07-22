"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { CalendarEvent } from "./types";

interface EditEventFormProps {
  event: CalendarEvent;
  onCancel: () => void;
  onDelete: (event: CalendarEvent) => void;
  onSubmit: (data: {
    title: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
    attendees: string;
  }) => void;
}

export const EditEventForm: React.FC<EditEventFormProps> = ({
  event,
  onCancel,
  onDelete,
  onSubmit,
}) => {
  const [title, setTitle] = useState(event.title);
  const [startTime, setStartTime] = useState(
    format(new Date(event.startTime), "HH:mm"),
  );
  const [endTime, setEndTime] = useState(
    format(new Date(event.endTime), "HH:mm"),
  );
  const [description, setDescription] = useState(event.description || "");
  const [location, setLocation] = useState(event.location || "");
  const [attendees, setAttendees] = useState(event.attendees?.join(", ") || "");

  const handleSave = () => {
    onSubmit({
      title,
      startTime,
      endTime,
      location,
      description,
      attendees,
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onCancel}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground">
            Edit Event
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onCancel}
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="h-10 text-sm font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground block">
            Time
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-8 text-xs w-28"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-8 text-xs w-28"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Location
          </label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="h-9 text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Description
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="h-9 text-xs"
          />
        </div>
      </div>

      <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(event)}
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Delete
        </Button>

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="rounded-full px-5 bg-primary text-primary-foreground font-semibold"
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
