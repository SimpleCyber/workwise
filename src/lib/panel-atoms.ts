// lib/panel-atoms.ts
import { atomWithStorage } from "jotai/utils";

export const calendarOpenAtom = atomWithStorage<boolean>(
  "calendar-panel-open",
  false,
);
export const notificationOpenAtom = atomWithStorage<boolean>(
  "notification-panel-open",
  false,
);
