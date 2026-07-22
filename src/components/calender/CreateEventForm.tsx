"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, X } from "lucide-react";
import { format } from "date-fns";

interface CreateEventFormProps {
  selectedDate: Date;
  googleTokens: any[];
  workspaceMembers: any[];
  onCancel: () => void;
  onSubmit: (data: {
    title: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
    guests: { name: string; email: string }[];
    selectedAccount: string;
  }) => void;
}

export const CreateEventForm: React.FC<CreateEventFormProps> = ({
  selectedDate,
  googleTokens,
  workspaceMembers,
  onCancel,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [guestQuery, setGuestQuery] = useState("");
  const [selectedGuests, setSelectedGuests] = useState<
    { name: string; email: string }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("local");

  const guestRef = useRef<HTMLDivElement>(null);

  const filteredMembers = useMemo(() => {
    const selectedEmails = new Set(selectedGuests.map((g) => g.email));
    return (workspaceMembers as any[])
      .filter((m: any) => {
        if (!m?.user) return false;
        const email = m.user.email || "";
        const name = m.user.name || "";
        if (selectedEmails.has(email)) return false;
        if (!guestQuery) return true;
        const q = guestQuery.toLowerCase();
        return (
          name.toLowerCase().includes(q) || email.toLowerCase().includes(q)
        );
      })
      .slice(0, 5);
  }, [workspaceMembers, guestQuery, selectedGuests]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (guestRef.current && !guestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSave = () => {
    onSubmit({
      title,
      startTime,
      endTime,
      location,
      description,
      guests: selectedGuests,
      selectedAccount,
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
            New Event
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
            placeholder="Add event title"
            className="h-10 text-sm font-medium"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground block">
            Date & Time
          </label>
          <div className="p-3 bg-muted/30 border border-border rounded-xl space-y-2">
            <p className="text-xs font-semibold text-foreground">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-8 text-xs w-28 bg-background"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-8 text-xs w-28 bg-background"
              />
            </div>
          </div>
        </div>

        <div className="relative" ref={guestRef}>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Guests
          </label>
          {selectedGuests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedGuests.map((guest) => (
                <Badge
                  key={guest.email}
                  variant="secondary"
                  className="gap-1 text-xs py-0.5"
                >
                  {guest.name || guest.email}
                  <button
                    onClick={() =>
                      setSelectedGuests(
                        selectedGuests.filter((g) => g.email !== guest.email),
                      )
                    }
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <Input
            value={guestQuery}
            onChange={(e) => {
              setGuestQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search workspace members or type email..."
            className="h-9 text-xs"
          />
          {showSuggestions && filteredMembers.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg p-1 max-h-48 overflow-y-auto">
              {filteredMembers.map((member: any) => (
                <button
                  key={member._id}
                  className="flex items-center gap-2.5 w-full p-2 hover:bg-accent rounded-lg transition-colors text-left"
                  onClick={() => {
                    const email = member.user?.email || "";
                    const name = member.user?.name || "";
                    if (email) {
                      setSelectedGuests([...selectedGuests, { name, email }]);
                    }
                    setGuestQuery("");
                    setShowSuggestions(false);
                  }}
                >
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-[10px]">
                      {(member.user?.name || "?").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">
                      {member.user?.name || "Member"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {member.user?.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Location
          </label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add location (optional)"
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
            placeholder="Add notes or description"
            className="h-9 text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Target Calendar
          </label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Workwise Local Calendar</SelectItem>
              {googleTokens.map((t: any) => (
                <SelectItem key={t._id} value={t.email || t._id}>
                  {t.email || "Google Account"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="rounded-full px-5 bg-primary text-primary-foreground font-semibold"
          onClick={handleSave}
        >
          Save Event
        </Button>
      </div>
    </div>
  );
};
