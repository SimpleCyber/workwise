import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const notificationOpenAtom = atom(false);
export const calendarOpenAtom = atom(false);
export const selectedTodoCardAtom = atom<any | null>(null);
export const todoViewModeAtom = atomWithStorage<"panel" | "modal">(
  "todoViewMode",
  "panel",
);
export const selectedProjectTaskAtom = atom<any | null>(null);
export const projectTaskViewModeAtom = atomWithStorage<"panel" | "modal">(
  "projectTaskViewMode",
  "panel",
);
