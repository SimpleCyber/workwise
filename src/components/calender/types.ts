import type { Id } from "../../../convex/_generated/dataModel";

export interface CalendarEvent {
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

export type ViewMode = "agenda" | "day" | "month" | "calendars";
export type PanelView = "main" | "create" | "edit";

export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const HOUR_HEIGHT = 64; // px per hour slot

export function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

export function getEventTopAndHeight(startTime: number, endTime: number) {
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

export function getEventCategory(
  event: CalendarEvent,
): "local" | "birthday" | "holiday" | "google" {
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
    "diwali",
    "deepavali",
    "holi",
    "christmas",
    "eid",
    "good friday",
    "new year",
  ];
  if (holidays.some((h) => t.includes(h))) return "holiday";

  return "google";
}

export function getEventColor(event: CalendarEvent, googleTokens: any[] = []) {
  const category = getEventCategory(event);
  if (category === "local") return "#2563eb";
  if (category === "birthday") return "#e11d48";
  if (category === "holiday") return "#8b5cf6";

  if (event.googleAccountEmail) {
    const token = googleTokens.find(
      (t: any) => t.email === event.googleAccountEmail,
    );
    return token?.color || "#3b82f6";
  }
  return "#3b82f6";
}
