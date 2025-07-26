"use client";

import { useAtom } from "jotai";
import { calendarOpenAtom } from "@/lib/panel-atoms";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Users,
  Video,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
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

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  attendees?: string[];
  meetLink?: string;
  location?: string;
}

export const CalendarPanel = () => {
  const [open] = useAtom(calendarOpenAtom);
  const [view, setView] = useState<"daily" | "monthly" | "all">("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
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

  // Mock authentication status - replace with actual Google Auth
  useEffect(() => {
    // Simulate authentication check
    const checkAuth = async () => {
      // Replace with actual Google Auth check
      setIsAuthenticated(true);
      loadEvents();
    };
    checkAuth();
  }, []);

  // Mock events data - replace with actual Google Calendar API calls
  const loadEvents = async () => {
    // Mock data - replace with actual Google Calendar API
    const mockEvents: CalendarEvent[] = [
      {
        id: "1",
        title: "Team Meeting",
        start: new Date(2024, 11, 15, 10, 0),
        end: new Date(2024, 11, 15, 11, 0),
        description: "Weekly team sync",
        attendees: ["john@example.com", "jane@example.com"],
        meetLink: "https://meet.google.com/abc-defg-hij",
      },
      {
        id: "2",
        title: "Project Review",
        start: new Date(2024, 11, 16, 14, 0),
        end: new Date(2024, 11, 16, 15, 30),
        description: "Q4 project review meeting",
        attendees: ["manager@example.com"],
        meetLink: "https://meet.google.com/xyz-uvwx-yz",
      },
      {
        id: "3",
        title: "Client Call",
        start: new Date(2024, 11, 18, 9, 0),
        end: new Date(2024, 11, 18, 10, 0),
        description: "Monthly client check-in",
        attendees: ["client@example.com"],
      },
    ];
    setEvents(mockEvents);
  };

  const authenticateWithGoogle = async () => {
    // Implement Google OAuth flow
    console.log("Authenticating with Google...");
    // After successful auth, set isAuthenticated to true and load events
    setIsAuthenticated(true);
    loadEvents();
  };

  const createEvent = async () => {
    if (!newEvent.title || !newEvent.startDate || !newEvent.startTime) return;

    const startDateTime = new Date(
      `${newEvent.startDate}T${newEvent.startTime}`,
    );
    const endDateTime =
      newEvent.endDate && newEvent.endTime
        ? new Date(`${newEvent.endDate}T${newEvent.endTime}`)
        : new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour

    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      start: startDateTime,
      end: endDateTime,
      description: newEvent.description,
      attendees: newEvent.attendees
        ? newEvent.attendees.split(",").map((email) => email.trim())
        : [],
      location: newEvent.location,
      meetLink: newEvent.includeMeet
        ? `https://meet.google.com/${Math.random().toString(36).substr(2, 9)}`
        : undefined,
    };

    // Add to local state (replace with actual Google Calendar API call)
    setEvents((prev) => [...prev, event]);

    // Reset form
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
    setIsCreateEventOpen(false);

    // Here you would make the actual Google Calendar API call
    console.log("Creating event:", event);
  };

  const deleteEvent = async (eventId: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== eventId));
    // Here you would make the actual Google Calendar API delete call
    console.log("Deleting event:", eventId);
  };

  const getEventsForView = () => {
    const now = new Date();

    switch (view) {
      case "daily":
        return events.filter((event) => isSameDay(event.start, currentDate));
      case "monthly":
        return events.filter(
          (event) =>
            event.start.getMonth() === currentDate.getMonth() &&
            event.start.getFullYear() === currentDate.getFullYear(),
        );
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
      <div className="grid grid-cols-7 gap-1 mt-4">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center font-semibold text-sm">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents = events.filter((event) =>
            isSameDay(event.start, day),
          );
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`p-1 min-h-[80px] border border-gray-200 ${
                isCurrentMonth ? "bg-white" : "bg-gray-50"
              } ${isToday ? "bg-blue-50 border-blue-300" : ""}`}
            >
              <div
                className={`text-sm ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}`}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate cursor-pointer hover:bg-blue-200"
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderEventsList = () => {
    const filteredEvents = getEventsForView();

    return (
      <div className="space-y-3 mt-4 ">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="p-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{event.title}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                  <Clock className="w-3 h-3" />
                  {format(event.start, "MMM d, h:mm a")} -{" "}
                  {format(event.end, "h:mm a")}
                </div>
                {event.description && (
                  <p className="text-xs text-gray-600 mt-1">
                    {event.description}
                  </p>
                )}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Users className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-600">
                      {event.attendees.length} attendee
                      {event.attendees.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {event.meetLink && (
                  <div className="flex items-center gap-2 mt-2">
                    <Video className="w-3 h-3 text-green-600" />
                    <a
                      href={event.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:underline"
                    >
                      Join Google Meet
                    </a>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteEvent(event.id)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}
        {filteredEvents.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No events found</p>
          </div>
        )}
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed top-10 right-0 z-50 w-96 h-full bg-gray-300 border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Calendar
        </h2>
        {!isAuthenticated && (
          <Button onClick={authenticateWithGoogle} size="sm">
            Connect Google
          </Button>
        )}
      </div>

      {!isAuthenticated ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">
            Connect your Google Calendar to get started
          </p>
          <Button onClick={authenticateWithGoogle}>
            Connect Google Calendar
          </Button>
        </div>
      ) : (
        <>
          {/* View Toggle */}
          <div className="flex gap-1 mb-4">
            {(["daily", "monthly", "all"] as const).map((viewType) => (
              <Button
                key={viewType}
                variant={view === viewType ? "default" : "outline"}
                size="sm"
                onClick={() => setView(viewType)}
                className="flex-1 capitalize"
              >
                {viewType}
              </Button>
            ))}
          </div>

          {/* Month Navigation for Monthly View */}
          {view === "monthly" && (
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="font-semibold">
                {format(currentDate, "MMMM yyyy")}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Create Event Button */}
          <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
            <DialogTrigger asChild>
              <Button className="w-full mb-4">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
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
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
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
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
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
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
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
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="attendees">Attendees</Label>
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
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
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
                  />
                </div>

                <div className="flex items-center space-x-2">
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
                    className="rounded"
                  />
                  <Label
                    htmlFor="includeMeet"
                    className="flex items-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    Add Google Meet link
                  </Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateEventOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={createEvent} className="flex-1">
                    Create Event
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Calendar Content */}
          {view === "monthly" ? renderCalendarGrid() : renderEventsList()}
        </>
      )}
    </div>
  );
};
