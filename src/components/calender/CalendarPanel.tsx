"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAtom } from "jotai";
import { calendarOpenAtom } from "@/lib/panel-atoms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Clock,
  Video,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  ArrowLeft,
  Users,
  RefreshCw,
  CalendarDays,
  MapPin,
  AlignLeft,
  MoreVertical,
  ExternalLink,
  Check,
  Pencil,
  Gift,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────
interface CalendarEvent {
  _id: Id<"calendarEvents">;
  title: string;
  startTime: number;
  endTime: number;
  description?: string;
  attendees?: string[];
  meetLink?: string;
  location?: string;
  googleEventId?: string;
  isGoogleSynced?: boolean;
  googleAccountEmail?: string;
}

type ViewMode = "day" | "week" | "month" | "schedule";
type PanelView = "calendar" | "create" | "edit" | "accounts";

// ─── Helpers ────────────────────────────────────────────
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 80; // px per hour slot

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function getEventTopAndHeight(startTime: number, endTime: number) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const duration = Math.max(endMinutes - startMinutes, 15);
  return {
    top: (startMinutes / 60) * HOUR_HEIGHT,
    height: (duration / 60) * HOUR_HEIGHT,
  };
}

// ─── Main Component ─────────────────────────────────────
export const DraggableCalendarPanel = ({
  workspaceId,
}: {
  workspaceId: Id<"workspaces">;
}) => {
  const [, setOpen] = useAtom(calendarOpenAtom);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("schedule");
  const [panelView, setPanelView] = useState<PanelView>("calendar");
  const [showMiniCal, setShowMiniCal] = useState(false);
  const [miniCalMonth, setMiniCalMonth] = useState(new Date());
  const [showMenu, setShowMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hiddenCalendars, setHiddenCalendars] = useState<Set<string>>(
    new Set(),
  );

  // Initialize hidden calendars from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("workwise_hidden_calendars");
      if (stored) {
        setHiddenCalendars(new Set(JSON.parse(stored)));
      }
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

  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editEndTime, setEditEndTime] = useState("10:00");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAttendees, setEditAttendees] = useState("");

  // Event creation state
  const [newTitle, setNewTitle] = useState("");
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("10:00");
  const [newGuestQuery, setNewGuestQuery] = useState("");
  const [selectedGuests, setSelectedGuests] = useState<
    { name: string; email: string }[]
  >([]);
  const [showGuestSuggestions, setShowGuestSuggestions] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIncludeMeet, setNewIncludeMeet] = useState(false);
  const [newSelectedAccount, setNewSelectedAccount] = useState("local");

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);

  // Data
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

  // Filtered member suggestions
  const filteredMembers = useMemo(() => {
    const selectedEmails = new Set(selectedGuests.map((g) => g.email));
    return (workspaceMembers as any[])
      .filter((m: any) => {
        if (!m?.user) return false;
        const email = m.user.email || "";
        const name = m.user.name || "";
        if (selectedEmails.has(email)) return false;
        if (!newGuestQuery) return true;
        const q = newGuestQuery.toLowerCase();
        return (
          name.toLowerCase().includes(q) || email.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [workspaceMembers, newGuestQuery, selectedGuests]);

  // Close dropdown menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(e.target as Node)
      ) {
        setShowMiniCal(false);
      }
      if (guestRef.current && !guestRef.current.contains(e.target as Node)) {
        setShowGuestSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll timeline to current hour on mount
  useEffect(() => {
    if (viewMode === "day" && timelineRef.current) {
      const now = new Date();
      const scrollTo = Math.max(0, (now.getHours() - 1) * HOUR_HEIGHT);
      timelineRef.current.scrollTop = scrollTo;
    }
  }, [viewMode, selectedDate]);

  // ─── Handlers ───────────────────────────────────────────
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

  const handleCreateEvent = async () => {
    if (!newTitle.trim()) {
      toast.error("Please add a title");
      return;
    }

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const startDateTime = new Date(`${dateStr}T${newStartTime}`);
      const endDateTime = new Date(`${dateStr}T${newEndTime}`);

      const attendees =
        selectedGuests.length > 0
          ? selectedGuests.map((g) => g.email)
          : undefined;

      if (newSelectedAccount !== "local") {
        await createMeeting({
          title: newTitle,
          description: newDescription || undefined,
          startTime: startDateTime.getTime(),
          endTime: endDateTime.getTime(),
          workspaceId,
          attendees,
          email: newSelectedAccount,
        });
      } else {
        await createEvent({
          title: newTitle,
          description: newDescription || undefined,
          startTime: startDateTime.getTime(),
          endTime: endDateTime.getTime(),
          location: newLocation || undefined,
          attendees,
          workspaceId,
        });
      }

      toast.success("Event created");
      resetCreateForm();
      setPanelView("calendar");
    } catch (err: any) {
      toast.error("Failed to create event", { description: err.message });
    }
  };

  const resetCreateForm = () => {
    setNewTitle("");
    setNewStartTime("09:00");
    setNewEndTime("10:00");
    setNewGuestQuery("");
    setSelectedGuests([]);
    setShowGuestSuggestions(false);
    setNewLocation("");
    setNewDescription("");
    setNewIncludeMeet(false);
    setNewSelectedAccount("local");
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    try {
      await deleteEventMutation({ eventId: event._id });
      toast.success("Event deleted");
    } catch (err: any) {
      toast.error("Failed to delete event", { description: err.message });
    }
  };

  const openEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditStartTime(format(new Date(event.startTime), "HH:mm"));
    setEditEndTime(format(new Date(event.endTime), "HH:mm"));
    setEditDescription(event.description || "");
    setEditLocation(event.location || "");
    setEditAttendees(event.attendees?.join(", ") || "");
    setPanelView("edit");
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !editTitle.trim()) {
      toast.error("Please add a title");
      return;
    }
    try {
      const dateStr = format(new Date(editingEvent.startTime), "yyyy-MM-dd");
      const startDateTime = new Date(`${dateStr}T${editStartTime}`);
      const endDateTime = new Date(`${dateStr}T${editEndTime}`);
      const attendees = editAttendees
        ? editAttendees
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean)
        : undefined;

      await updateEventMutation({
        eventId: editingEvent._id,
        title: editTitle,
        description: editDescription || undefined,
        startTime: startDateTime.getTime(),
        endTime: endDateTime.getTime(),
        location: editLocation || undefined,
        attendees,
      });
      toast.success("Event updated");
      setEditingEvent(null);
      setPanelView("calendar");
    } catch (err: any) {
      toast.error("Failed to update event", { description: err.message });
    }
  };

  const getEventCategory = (
    event: CalendarEvent,
  ): "local" | "birthday" | "holiday" | "google" => {
    if (!event.googleEventId) return "local";
    const t = (event.title || "").toLowerCase();

    if (
      t.includes("birthday") ||
      t.includes("bday") ||
      t.includes("b'day") ||
      t.includes("anniversary")
    )
      return "birthday";

    const holidays = [
      "holiday",
      "bank holiday",
      "national",
      "day off",
      "observance",
      "republic",
      "independence",
      "jayanti",
      "martyrdom",
      "diwali",
      "deepavali",
      "holi",
      "navratri",
      "durga",
      "maha",
      "saptami",
      "ashtami",
      "navami",
      "dashami",
      "dussehra",
      "ganesh",
      "chaturthi",
      "chaturdasi",
      "janmashtami",
      "krishna",
      "raksha bandhan",
      "rakhi",
      "makar",
      "sankranti",
      "pongal",
      "onam",
      "baisakhi",
      "ram navami",
      "shivaratri",
      "ugadi",
      "gudi padwa",
      "karva chauth",
      "puja",
      "pooja",
      "vishwakarma",
      "bhai duj",
      "bhai dooj",
      "chhat",
      "govardhan",
      "rath yatra",
      "eid",
      "milad",
      "muharram",
      "bakrid",
      "ramzan",
      "jamat",
      "christmas",
      "good friday",
      "easter",
      "buddha purnima",
      "mahavir",
      "guru nanak",
      "guru tegh",
      "lohri",
    ];
    if (holidays.some((h) => t.includes(h))) return "holiday";

    return "google";
  };

  const getEventColor = (event: CalendarEvent) => {
    const category = getEventCategory(event);
    if (category === "local") return "#1e293b"; // Slate-800 for dark creative schedule

    // For google events (and birthdays/holidays fallback), we fetch their calendar color:
    if (event.googleAccountEmail) {
      const token = googleTokens.find(
        (t: any) => t.email === event.googleAccountEmail,
      );
      return token?.color || "#4285F4";
    }
    return "#4285F4";
  };

  // ─── Filter Events ───
  const visibleEvents = useMemo(() => {
    return events.filter((e) => {
      const isLocal = !e.googleAccountEmail;
      if (isLocal && hiddenCalendars.has("local")) return false;
      if (!isLocal && hiddenCalendars.has(e.googleAccountEmail!)) return false;

      const category = getEventCategory(e);
      if (hiddenCalendars.has(`category-${category}`)) return false;

      return true;
    });
  }, [events, hiddenCalendars]);

  // ─── Mini Calendar ────────────────────────────────────
  const renderMiniCalendar = () => {
    const monthStart = startOfMonth(miniCalMonth);
    const monthEnd = endOfMonth(miniCalMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calStart, end: calEnd });

    return (
      <div
        ref={datePickerRef}
        className="absolute top-[68px] left-3 right-3 z-50 bg-popover border border-border rounded-lg shadow-lg p-3 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Month header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">
            {format(miniCalMonth, "MMMM yyyy")}
          </span>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setMiniCalMonth(subMonths(miniCalMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setMiniCalMonth(addMonths(miniCalMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div
              key={i}
              className="h-7 flex items-center justify-center text-[11px] font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const inMonth = isSameMonth(day, miniCalMonth);
            const selected = isSameDay(day, selectedDate);
            const today = isToday(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => {
                  setSelectedDate(day);
                  setShowMiniCal(false);
                }}
                className={`h-7 w-7 mx-auto flex items-center justify-center rounded-full text-xs cursor-pointer transition-colors
                  ${!inMonth ? "text-muted-foreground/30" : ""}
                  ${selected ? "bg-blue-600 text-white font-semibold" : ""}
                  ${today && !selected ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold" : ""}
                  ${inMonth && !selected && !today ? "hover:bg-muted text-foreground" : ""}
                `}
              >
                {format(day, "d")}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Day View (Hourly Timeline) ───────────────────────
  const renderDayView = () => {
    const dayEvents = visibleEvents.filter((e) =>
      isSameDay(new Date(e.startTime), selectedDate),
    );

    // Current time indicator
    const now = new Date();
    const isViewingToday = isSameDay(selectedDate, now);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentLineTop = (currentMinutes / 60) * HOUR_HEIGHT;

    return (
      <div
        ref={timelineRef}
        className="flex-1 overflow-y-auto bg-gradient-to-r from-muted/50 to-card relative"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* Timezone label */}
        <div className="sticky top-0 z-10 px-3 py-1">
          <span className="text-[10px] text-muted-foreground font-medium">
            GMT{format(now, "xxx")}
          </span>
        </div>

        {/* Timeline grid */}
        <div
          className="relative"
          style={{ height: HOURS.length * HOUR_HEIGHT }}
        >
          {/* Hour lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full flex items-start"
              style={{ top: hour * HOUR_HEIGHT }}
            >
              <div className="w-16 flex justify-end pr-2.5 shrink-0">
                <span className="text-xs text-muted-foreground leading-none relative -top-[6px]">
                  {hour === 0 ? "" : formatHour(hour)}
                </span>
              </div>
              <div className="flex-1 border-t border-border/60" />
            </div>
          ))}

          {/* Current time red line */}
          {isViewingToday && (
            <div
              className="absolute left-12 right-0 z-20 pointer-events-none flex items-center"
              style={{ top: currentLineTop }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-[5px] shrink-0" />
              <div className="flex-1 h-[2px] bg-red-500" />
            </div>
          )}

          {/* Events */}
          {dayEvents.map((event) => {
            const { top, height } = getEventTopAndHeight(
              event.startTime,
              event.endTime,
            );
            const color = getEventColor(event);

            return (
              <div
                key={event._id}
                className="absolute left-14 right-2 z-10 rounded-md px-2.5 py-1.5 cursor-pointer group overflow-hidden transition-shadow hover:shadow-md"
                style={{
                  top,
                  height: Math.max(height, 22),
                  backgroundColor: `${color}22`,
                  borderLeft: `3px solid ${color}`,
                }}
                title={event.title}
                onClick={() => openEditEvent(event)}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="overflow-hidden min-w-0">
                    <p
                      className="text-[15px] font-semibold truncate"
                      style={{ color }}
                    >
                      {event.title}
                    </p>
                    {height > 35 && (
                      <p
                        className="text-[13px] font-medium opacity-80 mt-1"
                        style={{ color }}
                      >
                        {format(new Date(event.startTime), "h:mm")} –{" "}
                        {format(new Date(event.endTime), "h:mma")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(event);
                    }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Week View ────────────────────────────────────────
  const renderWeekView = () => {
    const start = startOfWeek(selectedDate);
    const weekDays = eachDayOfInterval({ start, end: endOfWeek(start) });
    const now = new Date();

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-r from-muted/50 to-card">
        {/* Sticky Week Header */}
        <div className="flex  border-border z-20 bg-background pt-2 pb-1">
          <div className="w-12 shrink-0">
            <span className="text-[9px] text-muted-foreground font-medium pl-1">
              GMT{format(now, "xxx")}
            </span>
          </div>
          <div className="flex-1 flex overflow-hidden">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className="flex-1 flex flex-col items-center border-l border-border/40 pb-1"
              >
                <span className="text-xs text-muted-foreground font-medium uppercase">
                  {format(day, "EEE")}
                </span>
                <button
                  onClick={() => {
                    setSelectedDate(day);
                    setViewMode("day");
                  }}
                  className={`mt-0.5 text-sm font-semibold w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted ${isToday(day) ? "bg-blue-600 text-white hover:bg-blue-700" : isSameDay(day, selectedDate) ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : ""}`}
                >
                  {format(day, "d")}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Grid */}
        <div
          className="flex-1 overflow-y-auto bg-gradient-to-r from-muted/50 to-card"
          ref={timelineRef}
          style={{ scrollbarWidth: "thin" }}
        >
          {/* Times axis */}
          <div
            className="w-14 shrink-0 relative"
            style={{ height: HOURS.length * HOUR_HEIGHT }}
          >
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full pt-1 pr-1.5 text-right"
                style={{ top: hour * HOUR_HEIGHT }}
              >
                <span className="text-xs text-muted-foreground leading-none relative -top-[6px]">
                  {hour === 0 ? "" : formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* 7 Days Columns */}
          <div
            className="flex-1 flex relative"
            style={{ height: HOURS.length * HOUR_HEIGHT }}
          >
            {/* Hour Lines (Background) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col">
              {HOURS.map((hour) => (
                <div
                  key={`line-${hour}`}
                  className="w-full flex-none border-t border-border/60"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}
            </div>

            {/* Day Columns */}
            {weekDays.map((day) => {
              const dayEvents = visibleEvents.filter((e) =>
                isSameDay(new Date(e.startTime), day),
              );
              return (
                <div
                  key={day.toISOString()}
                  className="flex-1 relative border-l border-border/40 min-w-0"
                >
                  {dayEvents.map((event) => {
                    const { top, height } = getEventTopAndHeight(
                      event.startTime,
                      event.endTime,
                    );
                    const color = getEventColor(event);
                    return (
                      <div
                        key={event._id}
                        className="absolute left-0 right-0 z-10 mx-0.5 rounded p-0.5 cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
                        style={{
                          top,
                          height: Math.max(height, 16),
                          backgroundColor: `${color}22`,
                          borderLeft: `2px solid ${color}`,
                        }}
                        title={event.title}
                        onClick={() => openEditEvent(event)}
                      >
                        <p
                          className="text-[11px] font-semibold truncate leading-tight"
                          style={{ color }}
                        >
                          {event.title}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Current time red line across week */}
            {weekDays.some((d) => isToday(d)) && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none h-[2px] bg-red-400 opacity-60"
                style={{
                  top:
                    ((now.getHours() * 60 + now.getMinutes()) / 60) *
                    HOUR_HEIGHT,
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Month View ─────────────────────────────────────────
  const renderMonthView = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="flex-1 flex flex-col px-2 pb-2 overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 mb-1 mt-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div
              key={i}
              className="text-center text-xs font-semibold text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Month grid */}
        <div className="flex-1 grid grid-cols-7 gap-[1px] bg-border/40 border border-border/40 rounded-md overflow-hidden min-h-0">
          {days.map((day, i) => {
            const dayEvents = visibleEvents.filter((e) =>
              isSameDay(new Date(e.startTime), day),
            );
            const isSel = isSameDay(day, selectedDate);
            const isTod = isToday(day);
            const isCurrMonth = isSameMonth(day, selectedDate);

            return (
              <div
                key={day.toISOString()}
                className={`bg-background p-1 flex flex-col cursor-pointer transition-colors hover:bg-muted/30 overflow-hidden ${!isCurrMonth ? "opacity-50" : ""} ${isSel ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                onClick={() => {
                  setSelectedDate(day);
                  setViewMode("day");
                }}
              >
                {/* Day number */}
                <div
                  className={`text-xs font-medium text-center w-6 h-6 mx-auto rounded-full flex items-center justify-center mb-0.5 ${isTod ? "bg-blue-600 text-white" : ""}`}
                >
                  {format(day, "d")}
                </div>

                {/* Event indicators */}
                <div className="flex-1 flex flex-col gap-[3px] overflow-hidden">
                  {dayEvents.slice(0, 4).map((e) => (
                    <div
                      key={e._id}
                      className="text-[11px] font-medium truncate px-1.5 py-[1px] rounded-[3px] leading-tight"
                      style={{
                        backgroundColor: `${getEventColor(e)}33`,
                        color: getEventColor(e),
                      }}
                    >
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 4 && (
                    <div className="text-[10px] text-muted-foreground font-semibold pl-1 pt-0.5">
                      +{dayEvents.length - 4}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Schedule View (Upcoming List) ────────────────────
  const renderScheduleView = () => {
    // Group events by date, from today onward
    const futureEvents = visibleEvents
      .filter((e) => {
        const eventDate = startOfDay(new Date(e.startTime));
        const today = startOfDay(new Date());
        return !isBefore(eventDate, today);
      })
      .sort((a, b) => a.startTime - b.startTime);

    const grouped: Record<string, CalendarEvent[]> = {};
    futureEvents.forEach((e) => {
      const key = format(new Date(e.startTime), "yyyy-MM-dd");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });

    const dateKeys = Object.keys(grouped).sort();

    return (
      <div
        className="flex-1 overflow-y-auto bg-gradient-to-r from-muted/50 to-card"
        style={{ scrollbarWidth: "thin" }}
      >
        {dateKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground/25 mb-3" />
            <p className="text-sm font-medium text-muted-foreground/70">
              No upcoming events
            </p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              Your schedule is clear
            </p>
          </div>
        ) : (
          <div className="pb-4">
            {dateKeys.map((dateKey) => {
              const date = new Date(dateKey + "T00:00:00");
              const dayEvents = grouped[dateKey];

              return (
                <div key={dateKey}>
                  {/* Date header */}
                  <div className="px-4 pt-4 pb-2">
                    <h3 className="text-[14px] font-medium text-foreground/80">
                      {isToday(date)
                        ? "Today"
                        : format(date, "EEE, d MMM yyyy")}
                    </h3>
                  </div>

                  {/* Events for this date */}
                  <div className="space-y-1.5 px-3">
                    {dayEvents.map((event) => {
                      const color = getEventColor(event);
                      const isAllDay =
                        new Date(event.endTime).getTime() -
                          new Date(event.startTime).getTime() >=
                        23 * 60 * 60 * 1000;
                      const category = getEventCategory(event);

                      let BackgroundStyle: React.CSSProperties = {
                        backgroundColor: color,
                      };
                      let IconComponent = CalendarDays;
                      if (category === "birthday") {
                        BackgroundStyle = { backgroundColor: "#f43f5e" }; // Rose color for birthdays
                        IconComponent = Gift;
                      } else if (category === "holiday") {
                        BackgroundStyle = {
                          background: `linear-gradient(135deg, ${color} 0%, #8b5cf6 100%)`,
                        }; // Gradient for holidays
                        IconComponent = Sparkles;
                      } else if (category === "local") {
                        IconComponent = Pencil;
                      }

                      return (
                        <div
                          key={event._id}
                          className="group relative rounded-md cursor-pointer transition-opacity hover:opacity-90 shadow-sm"
                          onClick={() => openEditEvent(event)}
                          style={BackgroundStyle}
                        >
                          <div className="px-4 py-3 flex flex-col justify-center min-h-[58px]">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                  <IconComponent className="w-5 h-5 text-white/90 shrink-0" />
                                  <p className="text-[16px] font-semibold text-white tracking-tight truncate leading-tight">
                                    {event.title}
                                  </p>
                                </div>
                                <p className="text-sm font-medium text-white/95 truncate mt-1 leading-tight ml-[30px]">
                                  {isAllDay
                                    ? "All day"
                                    : `${format(new Date(event.startTime), "h")} – ${format(new Date(event.endTime), "h:mma").toLowerCase()}`}
                                  {event.location ? `, ${event.location}` : ""}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Avatar className="w-7 h-7 border-[1.5px] border-white/25 shadow-md transition-transform hover:scale-110">
                                      <AvatarFallback className="bg-black/25 text-xs font-semibold text-white">
                                        {category === "local"
                                          ? "L"
                                          : event.googleAccountEmail
                                              ?.charAt(0)
                                              .toUpperCase() || "G"}
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="text-xs"
                                  >
                                    {category === "local"
                                      ? "Workwise (Local)"
                                      : event.googleAccountEmail ||
                                        "Google Account"}
                                  </TooltipContent>
                                </Tooltip>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEvent(event);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-black/20 transition-colors"
                                >
                                  <X className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            </div>

                            {/* Meet link */}
                            {event.meetLink && (
                              <a
                                href={event.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 mt-2 ml-[30px] text-xs font-semibold text-white/90 hover:text-white hover:underline w-fit"
                              >
                                <Video className="w-4 h-4" /> Join Meet
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom "Create an event" link */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setPanelView("create")}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-[13px] font-medium hover:underline"
          >
            <Plus className="w-4 h-4" />
            Create an event
          </button>
        </div>
      </div>
    );
  };

  // ─── Create Event View ────────────────────────────────
  const renderCreateView = () => {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Create header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              resetCreateForm();
              setPanelView("calendar");
            }}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Open in Google Calendar"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                resetCreateForm();
                setPanelView("calendar");
              }}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <div
          className="flex-1 overflow-y-auto bg-gradient-to-r from-muted/50 to-card px-4 py-4 space-y-5"
          style={{ scrollbarWidth: "thin" }}
        >
          {/* Title */}
          <div>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add title"
              className="border-0 border-b-2 border-blue-500 rounded-none px-0 text-base font-medium placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-blue-600 bg-transparent h-10"
              autoFocus
            />
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-sm text-foreground font-medium">
                {format(selectedDate, "EEE, d MMM")}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="bg-transparent border border-border rounded px-2 py-1 text-sm font-medium w-[100px] focus:outline-none focus:border-blue-500"
                />
                <span className="text-muted-foreground">–</span>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="bg-transparent border border-border rounded px-2 py-1 text-sm font-medium w-[100px] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Guests */}
          <div className="flex items-start gap-3" ref={guestRef}>
            <Users className="w-5 h-5 text-muted-foreground mt-1 shrink-0" />
            <div className="flex-1 relative">
              {/* Selected guest chips */}
              {selectedGuests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedGuests.map((guest) => (
                    <span
                      key={guest.email}
                      className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full pl-2 pr-1 py-0.5 text-[11px] font-medium border border-blue-200 dark:border-blue-800"
                    >
                      {guest.name || guest.email}
                      <button
                        onClick={() =>
                          setSelectedGuests(
                            selectedGuests.filter(
                              (g) => g.email !== guest.email,
                            ),
                          )
                        }
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <Input
                value={newGuestQuery}
                onChange={(e) => {
                  setNewGuestQuery(e.target.value);
                  setShowGuestSuggestions(true);
                }}
                onFocus={() => setShowGuestSuggestions(true)}
                placeholder={
                  selectedGuests.length > 0
                    ? "Add more guests..."
                    : "Add guests"
                }
                className="border-0 border-b border-border/40 rounded-none px-0 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent h-8"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newGuestQuery.includes("@")) {
                    e.preventDefault();
                    setSelectedGuests([
                      ...selectedGuests,
                      { name: "", email: newGuestQuery.trim() },
                    ]);
                    setNewGuestQuery("");
                    setShowGuestSuggestions(false);
                  }
                }}
              />
              {/* Suggestion dropdown */}
              {showGuestSuggestions && filteredMembers.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                  {filteredMembers.map((member: any) => (
                    <button
                      key={member._id}
                      className="flex items-center gap-3 w-full px-3 py-2 hover:bg-muted/60 transition-colors text-left"
                      onClick={() => {
                        const email = member.user?.email || "";
                        const name = member.user?.name || "";
                        if (email) {
                          setSelectedGuests([
                            ...selectedGuests,
                            { name, email },
                          ]);
                        }
                        setNewGuestQuery("");
                        setShowGuestSuggestions(false);
                      }}
                    >
                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground/70 shrink-0 uppercase">
                        {(
                          member.user?.name ||
                          member.user?.email ||
                          "?"
                        ).charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">
                          {member.user?.name || "Unknown"}
                        </p>
                        {member.user?.email && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {member.user.email}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Meet */}
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 -mx-1 px-1 py-1.5 rounded-md transition-colors"
            onClick={() => setNewIncludeMeet(!newIncludeMeet)}
          >
            <Video
              className={`w-5 h-5 shrink-0 ${newIncludeMeet ? "text-blue-600" : "text-muted-foreground"}`}
            />
            <span className="text-sm text-foreground">
              {newIncludeMeet
                ? "Google Meet added"
                : "Add Google Meet video conferencing"}
            </span>
            {newIncludeMeet && (
              <Check className="w-4 h-4 text-blue-600 ml-auto" />
            )}
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <Input
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Add location"
              className="border-0 border-b border-border/40 rounded-none px-0 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent h-8"
            />
          </div>

          {/* Description */}
          <div className="flex items-start gap-3">
            <AlignLeft className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <Input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Add description"
              className="border-0 border-b border-border/40 rounded-none px-0 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent h-8"
            />
          </div>

          {/* Account selector */}
          <div className="flex items-start gap-3">
            <CalendarDays className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1">
              <Select
                value={newSelectedAccount}
                onValueChange={setNewSelectedAccount}
              >
                <SelectTrigger className="h-8 border-0 border-b border-border/40 rounded-none px-0 text-sm font-medium shadow-none focus:ring-0 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Workwise
                    </div>
                  </SelectItem>
                  {googleTokens.map((t: any) => (
                    <SelectItem key={t._id} value={t.email || t._id}>
                      <div className="flex items-center gap-2 text-sm">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: t.color || "#4285F4" }}
                        />
                        <span className="truncate">{t.email || "Google"}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Save button fixed at bottom */}
        <div className="px-4 py-3 border-t border-border/60 flex justify-end">
          <Button
            onClick={handleCreateEvent}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 h-9 text-sm font-semibold shadow-sm"
          >
            Save
          </Button>
        </div>
      </div>
    );
  };

  // ─── Edit Event View ──────────────────────────────────
  const renderEditView = () => {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setEditingEvent(null);
              setPanelView("calendar");
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setEditingEvent(null);
              setPanelView("calendar");
            }}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
        <div
          className="flex-1 overflow-y-auto bg-gradient-to-r from-muted/50 to-card px-4 py-4 space-y-5"
          style={{ scrollbarWidth: "thin" }}
        >
          <div>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Add title"
              className="border-0 border-b-2 border-blue-500 rounded-none px-0 text-base font-medium placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-blue-600 bg-transparent h-10"
              autoFocus
            />
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1">
              {editingEvent && (
                <p className="text-sm text-foreground font-medium">
                  {format(new Date(editingEvent.startTime), "EEE, d MMM")}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="bg-transparent border border-border rounded px-2 py-1 text-sm font-medium w-[100px] focus:outline-none focus:border-blue-500"
                />
                <span className="text-muted-foreground">–</span>
                <input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  className="bg-transparent border border-border rounded px-2 py-1 text-sm font-medium w-[100px] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <Input
              value={editAttendees}
              onChange={(e) => setEditAttendees(e.target.value)}
              placeholder="Add guests (comma separated emails)"
              className="border-0 border-b border-border/40 rounded-none px-0 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent h-8"
            />
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <Input
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              placeholder="Add location"
              className="border-0 border-b border-border/40 rounded-none px-0 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent h-8"
            />
          </div>
          <div className="flex items-start gap-3">
            <AlignLeft className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <Input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Add description"
              className="border-0 border-b border-border/40 rounded-none px-0 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent h-8"
            />
          </div>
        </div>
        <div className="px-4 py-3 border-t border-border/60 flex justify-end">
          <Button
            onClick={handleUpdateEvent}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 h-9 text-sm font-semibold shadow-sm"
          >
            Save
          </Button>
        </div>
      </div>
    );
  };

  // ─── Accounts View ────────────────────────────────────
  const renderAccountsView = () => {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-3 border-b border-border/60">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPanelView("calendar")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              Calendar
            </p>
            <p className="text-sm font-semibold text-foreground">
              Select calendars
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Open in Google Calendar"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPanelView("calendar")}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        {/* List */}
        <div
          className="flex-1 overflow-y-auto bg-gradient-to-r from-muted/50 to-card px-4 py-4"
          style={{ scrollbarWidth: "thin" }}
        >
          {/* Connected accounts */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                My calendars
              </h4>
            </div>

            {/* Local workwise calendar */}
            <div
              className="flex items-center gap-3 py-2.5 group cursor-pointer"
              onClick={() => toggleCalendarVisibility("local")}
            >
              <div
                className={`w-[18px] h-[18px] rounded-[3px] flex items-center justify-center border transition-colors ${
                  hiddenCalendars.has("local")
                    ? "border-muted-foreground/30 bg-transparent"
                    : "bg-blue-500 border-blue-500"
                }`}
              >
                {!hiddenCalendars.has("local") && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <span className="text-[13px] text-foreground">
                Workwise (Local)
              </span>
            </div>

            {googleTokens.map((token: any) => {
              const id = token.email || token._id;
              const isHidden = hiddenCalendars.has(id);
              const name = token.email
                ? token.email
                : "Google Account (No Email)";

              return (
                <div
                  key={token._id}
                  className="flex items-center gap-3 py-2.5 group cursor-pointer"
                  onClick={() => toggleCalendarVisibility(id)}
                >
                  <div
                    className="w-[18px] h-[18px] rounded-[3px] flex items-center justify-center border transition-colors"
                    style={{
                      backgroundColor: isHidden
                        ? "transparent"
                        : token.color || "#4285F4",
                      borderColor: isHidden
                        ? "hsl(var(--muted-foreground)/0.3)"
                        : token.color || "#4285F4",
                    }}
                  >
                    {!isHidden && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-[13px] text-foreground flex-1 truncate">
                    {name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDisconnect(token._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-destructive/10 transition-opacity"
                    title="Disconnect"
                  >
                    <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mb-6 mt-6 border-t border-border/40 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                Event types
              </h4>
            </div>
            {[
              {
                id: "category-google",
                label: "Meetings & Reminders",
                color: "#4285F4",
              },
              { id: "category-birthday", label: "Birthdays", color: "#f43f5e" },
              {
                id: "category-holiday",
                label: "Holidays & Festivals",
                color: "#8b5cf6",
              },
              {
                id: "category-local",
                label: "Creative Schedule",
                color: "#1e293b",
              },
            ].map((type) => {
              const isHidden = hiddenCalendars.has(type.id);
              return (
                <div
                  key={type.id}
                  className="flex items-center gap-3 py-2.5 group cursor-pointer"
                  onClick={() => toggleCalendarVisibility(type.id)}
                >
                  <div
                    className={`w-[18px] h-[18px] rounded-[3px] flex items-center justify-center border transition-colors ${
                      isHidden
                        ? "border-muted-foreground/30 bg-transparent"
                        : "border-transparent"
                    }`}
                    style={{
                      backgroundColor: isHidden ? "transparent" : type.color,
                    }}
                  >
                    {!isHidden && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-[13px] text-foreground flex-1 truncate">
                    {type.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Add account */}
          <button
            onClick={handleConnectGoogle}
            className="flex items-center gap-3 text-[13px] font-medium text-blue-600 dark:text-blue-400 hover:underline py-2"
          >
            <Plus className="w-4 h-4" />
            Add Google Calendar
          </button>
        </div>
      </div>
    );
  };

  // ─── Main Calendar View ───────────────────────────────
  const renderCalendarView = () => {
    return (
      <>
        {/* ── Header ── */}
        <div className="px-3 pt-3 pb-0 bg-gradient-to-r from-muted/50 to-card">
          {/* Top bar: CALENDAR label + icons */}
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[12px] font-semibold text-gray-600 dark:text-blue-400 uppercase tracking-wider select-none">
              Calendar
            </p>
            <div className="flex items-center gap-0.5">
              {googleTokens.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Sync calendars"
                  disabled={isSyncing}
                  onClick={handleSyncCalendar}
                >
                  <RefreshCw
                    className={`w-4 h-4 text-muted-foreground ${isSyncing ? "animate-spin" : ""}`}
                  />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Create event"
                onClick={() => setPanelView("create")}
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Date selector row */}
          <div className="relative">
            <button
              onClick={() => {
                setMiniCalMonth(selectedDate);
                setShowMiniCal(!showMiniCal);
              }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:bg-muted px-2.5 py-1.5 rounded-full transition-colors"
            >
              {format(selectedDate, "EEE, d MMM")}
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${showMiniCal ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Today + nav + menu row */}
          <div className="flex items-center gap-1 mt-2 pb-2 border-b border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs font-medium rounded-full border-border shadow-none"
              onClick={() => setSelectedDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                if (viewMode === "month")
                  setSelectedDate(subMonths(selectedDate, 1));
                else if (viewMode === "week")
                  setSelectedDate(subDays(selectedDate, 7));
                else setSelectedDate(subDays(selectedDate, 1));
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                if (viewMode === "month")
                  setSelectedDate(addMonths(selectedDate, 1));
                else if (viewMode === "week")
                  setSelectedDate(addDays(selectedDate, 7));
                else setSelectedDate(addDays(selectedDate, 1));
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <div className="flex-1" />

            {/* 3-dot menu */}
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </Button>

              {showMenu && (
                <div className="absolute right-0 top-8 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 w-40 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setViewMode("day");
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {viewMode === "day" && (
                      <Check className="w-4 h-4 text-foreground" />
                    )}
                    {viewMode !== "day" && <div className="w-4" />}
                    Day
                  </button>
                  <button
                    onClick={() => {
                      setViewMode("week");
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {viewMode === "week" && (
                      <Check className="w-4 h-4 text-foreground" />
                    )}
                    {viewMode !== "week" && <div className="w-4" />}
                    Week
                  </button>
                  <button
                    onClick={() => {
                      setViewMode("month");
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {viewMode === "month" && (
                      <Check className="w-4 h-4 text-foreground" />
                    )}
                    {viewMode !== "month" && <div className="w-4" />}
                    Month
                  </button>
                  <button
                    onClick={() => {
                      setViewMode("schedule");
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {viewMode === "schedule" && (
                      <Check className="w-4 h-4 text-foreground" />
                    )}
                    {viewMode !== "schedule" && <div className="w-4" />}
                    Schedule
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={() => {
                      setPanelView("accounts");
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <div className="w-4" />
                    Select calendars
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mini calendar dropdown */}
        {showMiniCal && renderMiniCalendar()}

        {/* ── Content ── */}
        {viewMode === "day" && renderDayView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "month" && renderMonthView()}
        {viewMode === "schedule" && renderScheduleView()}
      </>
    );
  };

  // ─── Root Return ──────────────────────────────────────
  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full flex flex-col bg-background relative">
        {panelView === "calendar" && renderCalendarView()}
        {panelView === "create" && renderCreateView()}
        {panelView === "edit" && renderEditView()}
        {panelView === "accounts" && renderAccountsView()}
      </div>
    </TooltipProvider>
  );
};
