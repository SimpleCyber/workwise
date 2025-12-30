"use client";

import type React from "react";

import { useAtom } from "jotai";
import { calendarOpenAtom } from "@/lib/panel-atoms";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Users,
  Video,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
  CalendarDays,
  ArrowLeft,
  GripVertical,
  TriangleAlert,
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
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

import { toast } from "sonner";
import { useAuthActions } from "@convex-dev/auth/react";

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
}

interface Position {
  x: number;
  y: number;
}

type AuthView = "signIn" | "signUp" | "calendar";

export const DraggableCalendarPanel = ({
  workspaceId,
}: {
  workspaceId: Id<"workspaces">;
}) => {
  const [open] = useAtom(calendarOpenAtom);
  const [view, setView] = useState<"daily" | "monthly" | "all" | "create">(
    "monthly",
  );
  const [authView, setAuthView] = useState<AuthView>("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Authentication state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authPending, setAuthPending] = useState(false);

  const { signIn } = useAuthActions();

  const events = useQuery(api.calendarEvents.getEventsByWorkspace, {
    workspaceId,
  });
  const hasGoogleAuth = useQuery(api.googleAuth.hasGoogleAuth);
  const googleTokens = useQuery(api.googleAuth.getGoogleTokens);
  /* googleTokens already declared above */
  const createEvent = useMutation(api.calendarEvents.createEvent);
  const deleteEventMutation = useMutation(api.calendarEvents.deleteEvent);

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    attendees: "",
    includeMeet: false,
    location: "",
  });

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem("calendar-panel-position");
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    } else {
      setPosition({ x: window.innerWidth / 2 - 200, y: 80 });
    }
  }, []);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem("calendar-panel-position", JSON.stringify(position));
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".no-drag")) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      const maxX = window.innerWidth - 400;
      const maxY = window.innerHeight - 100;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const generateAuthUrl = useAction(api.googleCalendarActions.generateAuthUrl);
  const createMeeting = useAction(api.googleCalendarActions.createMeeting);

  const authenticateWithGoogle = async () => {
    try {
      const url = await generateAuthUrl();
      window.location.href = url;
    } catch (error: any) {
      toast.error("Failed to start Google Calendar connection", {
        description: error.message,
      });
    }
  };

  // Authentication handlers
  const handleOAuthSignIn = (provider: "github" | "google") => {
    setAuthPending(true);
    signIn(provider)
      .then(() => {
        setAuthView("calendar");
        toast.success(`Signed in with ${provider}`);
      })
      .catch((error) => {
        setAuthError(`Failed to sign in with ${provider}`);
        console.error("OAuth error:", error);
      })
      .finally(() => setAuthPending(false));
  };

  const handleSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthPending(true);
    setAuthError("");

    signIn("password", { email, password, flow: "signIn" })
      .then(() => {
        setAuthView("calendar");
        toast.success("Successfully signed in!");
      })
      .catch((error) => {
        setAuthError("Invalid email or password!");
        console.error("Sign in error:", error);
      })
      .finally(() => setAuthPending(false));
  };

  const handleSignUp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthPending(true);
    setAuthError("");

    signIn("password", { email, password, flow: "signUp" })
      .then(() => {
        setAuthView("calendar");
        toast.success("Account created successfully!");
      })
      .catch((error) => {
        setAuthError("Failed to create account. Please try again.");
        console.error("Sign up error:", error);
      })
      .finally(() => setAuthPending(false));
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.startDate || !newEvent.startTime) {
      toast.error("Missing information", {
        description: "Please fill in the required fields.",
      });
      return;
    }

    try {
      const startDateTime = new Date(
        `${newEvent.startDate}T${newEvent.startTime}`,
      );
      const endDateTime =
        newEvent.endDate && newEvent.endTime
          ? new Date(`${newEvent.endDate}T${newEvent.endTime}`)
          : new Date(startDateTime.getTime() + 60 * 60 * 1000);

      const attendeesList = newEvent.attendees
        ? newEvent.attendees.split(",").map((email) => email.trim())
        : undefined;

      if (newEvent.includeMeet) {
        // Use the secure action that talks to Google API
        await createMeeting({
          title: newEvent.title,
          description: newEvent.description,
          startTime: startDateTime.getTime(),
          endTime: endDateTime.getTime(),
          workspaceId,
          attendees: attendeesList,
        });
      } else {
        // Use local mutation
        await createEvent({
          title: newEvent.title,
          description: newEvent.description,
          startTime: startDateTime.getTime(),
          endTime: endDateTime.getTime(),
          location: newEvent.location,
          attendees: attendeesList,
          workspaceId,
        });
      }

      toast.success("Event created", {
        description: "Your calendar event has been created successfully.",
      });

      setNewEvent({
        title: "",
        description: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        attendees: "",
        includeMeet: false,
        location: "",
      });
      setView("monthly");
    } catch (error: any) {
      toast.error("Failed to create event", {
        description: error.message,
      });
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    try {
      await deleteEventMutation({ eventId: event._id });
      toast.success("Event deleted", {
        description: "Your calendar event has been deleted.",
      });
    } catch (error: any) {
      toast.error("Failed to delete event", {
        description: error.message,
      });
    }
  };

  const getEventsForView = () => {
    if (!events) return [];

    switch (view) {
      case "daily":
        return events.filter((event) =>
          isSameDay(new Date(event.startTime), currentDate),
        );
      case "monthly":
        return events.filter((event) => {
          const eventDate = new Date(event.startTime);
          return (
            eventDate.getMonth() === currentDate.getMonth() &&
            eventDate.getFullYear() === currentDate.getFullYear()
          );
        });
      case "all":
        return events;
      default:
        return events;
    }
  };

  const renderCalendarGrid = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-3 text-center font-semibold text-sm text-slate-700"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayEvents =
              events?.filter((event) =>
                isSameDay(new Date(event.startTime), day),
              ) || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={`p-2 min-h-[90px] border-r border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                  isCurrentMonth ? "bg-white" : "bg-slate-50/50"
                } ${isToday ? "bg-blue-50 border-blue-200" : ""} ${index % 7 === 6 ? "border-r-0" : ""}`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? "text-slate-900" : "text-slate-400"
                  } ${isToday ? "text-blue-600 font-semibold" : ""}`}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event._id}
                      className="text-xs p-1.5 bg-blue-100 text-blue-800 rounded-md truncate cursor-pointer hover:bg-blue-200 transition-colors border border-blue-200"
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-slate-500 font-medium">
                      +{dayEvents.length - 2} more
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

  const renderEventsList = () => {
    const filteredEvents = getEventsForView();
    return (
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {filteredEvents.map((event, index) => (
          <Card
            key={event._id}
            className="group border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 bg-white"
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 mt-0.5">
                      <CalendarDays className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-1">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">
                          {format(new Date(event.startTime), "MMM d, h:mm a")} -{" "}
                          {format(new Date(event.endTime), "h:mm a")}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-slate-600 mb-3 bg-slate-50 p-2 rounded-lg">
                          {event.description}
                        </p>
                      )}
                      <div className="flex flex-col gap-2">
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {event.attendees.length} attendee
                              {event.attendees.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {event.location}
                            </span>
                          </div>
                        )}
                        {event.meetLink && (
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-emerald-500" />
                            <a
                              href={event.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                            >
                              Join Google Meet
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteEvent(event)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full w-8 h-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {filteredEvents.length === 0 && (
          <div className="text-center text-slate-500 py-12">
            <div className="p-4 rounded-full bg-slate-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-700 mb-1">
              No events found
            </p>
            <p className="text-sm text-slate-500">
              Your calendar is clear for this period
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderCreateEventForm = () => {
    return (
      <div className="space-y-6 max-h-[500px] overflow-y-auto">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("monthly")}
            className="rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h3 className="text-lg font-semibold text-slate-900">
            Create New Event
          </h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-slate-700 font-medium">
              Event Title
            </Label>
            <Input
              id="title"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              placeholder="Enter event title"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-slate-700 font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Event description (optional)"
              rows={3}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startDate" className="text-slate-700 font-medium">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={newEvent.startDate}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="startTime" className="text-slate-700 font-medium">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={newEvent.startTime}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="endDate" className="text-slate-700 font-medium">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={newEvent.endDate}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endTime" className="text-slate-700 font-medium">
                End Time
              </Label>
              <Input
                id="endTime"
                type="time"
                value={newEvent.endTime}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    endTime: e.target.value,
                  }))
                }
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="attendees" className="text-slate-700 font-medium">
              Attendees
            </Label>
            <Input
              id="attendees"
              value={newEvent.attendees}
              onChange={(e) =>
                setNewEvent((prev) => ({
                  ...prev,
                  attendees: e.target.value,
                }))
              }
              placeholder="Enter email addresses, separated by commas"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="location" className="text-slate-700 font-medium">
              Location
            </Label>
            <Input
              id="location"
              value={newEvent.location}
              onChange={(e) =>
                setNewEvent((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
              placeholder="Meeting location (optional)"
              className="mt-1"
            />
          </div>
          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
            <input
              type="checkbox"
              id="includeMeet"
              checked={newEvent.includeMeet}
              onChange={(e) =>
                setNewEvent((prev) => ({
                  ...prev,
                  includeMeet: e.target.checked,
                }))
              }
              className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
            />
            <Label
              htmlFor="includeMeet"
              className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
            >
              <Video className="w-4 h-4 text-emerald-600" />
              Add Google Meet link
            </Label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setView("monthly")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEvent}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Create Event
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderSignInView = () => {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="p-4 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {authView === "signIn"
              ? "Login to continue"
              : "Create your account"}
          </h3>
          <p className="text-slate-600 text-sm">
            {authView === "signIn"
              ? "Use your email or another service to continue."
              : "Sign up to start using the calendar."}
          </p>
        </div>

        {!!authError && (
          <div className="flex items-center gap-x-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            <TriangleAlert className="size-4" />
            <p>{authError}</p>
          </div>
        )}

        <form
          onSubmit={authView === "signIn" ? handleSignIn : handleSignUp}
          className="space-y-3"
        >
          <Input
            disabled={authPending}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
          />

          <Input
            disabled={authPending}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={authPending}
          >
            {authView === "signIn" ? "Continue" : "Sign Up"}
          </Button>
        </form>

        <div className="flex gap-3">
          <Button
            disabled={authPending}
            onClick={() => handleOAuthSignIn("google")}
            variant="outline"
            className="flex-1"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
          <Button
            disabled={authPending}
            onClick={() => handleOAuthSignIn("github")}
            variant="outline"
            className="flex-1"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {authView === "signIn"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            disabled={authPending}
            onClick={() =>
              setAuthView(authView === "signIn" ? "signUp" : "signIn")
            }
            className="cursor-pointer font-medium text-sky-700 hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            {authView === "signIn" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    );
  };

  const [isOpen, setIsOpen] = useAtom(calendarOpenAtom);
  const handleClose = () => {
    setIsOpen(false);
  };

  if (!open) return null;

  return (
    <Card
      ref={cardRef}
      className="fixed z-50 w-96 bg-white shadow-2xl border border-slate-200 max-h-[80vh] flex flex-col"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      <CardHeader
        className="p-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-gray-400" />
            <div className="p-2 rounded-xl bg-purple-50 border border-purple-100">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Calendar</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 no-drag">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden">
        {authView !== "calendar" ? (
          renderSignInView()
        ) : (
          <div className="p-6 no-drag">
            <div className="bg-slate-100 rounded-xl p-1 mb-6">
              <div className="grid grid-cols-3 gap-1">
                {(["daily", "monthly", "all"] as const).map((viewType) => (
                  <Button
                    key={viewType}
                    variant="ghost"
                    size="sm"
                    onClick={() => setView(viewType)}
                    className={`capitalize rounded-lg transition-all ${
                      view === viewType
                        ? "bg-white shadow-sm text-slate-900 font-medium"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    {viewType}
                  </Button>
                ))}
              </div>
            </div>

            {view === "monthly" && (
              <div className="flex items-center justify-between mb-6 bg-slate-50 rounded-xl p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  className="rounded-lg hover:bg-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="font-semibold text-slate-900">
                  {format(currentDate, "MMMM yyyy")}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  className="rounded-lg hover:bg-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="mb-4 flex items-center justify-between bg-blue-50/50 p-2 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${hasGoogleAuth ? "bg-emerald-500" : "bg-slate-300"}`}
                />
                <span className="text-xs font-medium text-slate-600">
                  {hasGoogleAuth
                    ? "Google Calendar Connected"
                    : "Not connected to Google"}
                </span>
              </div>
              {!hasGoogleAuth && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={authenticateWithGoogle}
                  className="h-7 text-xs bg-white hover:bg-slate-50 border-blue-200 text-blue-700"
                >
                  Connect
                </Button>
              )}
            </div>

            <Button
              onClick={() => setView("create")}
              className="w-full mb-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>

            <div className="max-h-[400px] overflow-y-auto">
              {view === "monthly"
                ? renderCalendarGrid()
                : view === "create"
                  ? renderCreateEventForm()
                  : renderEventsList()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
