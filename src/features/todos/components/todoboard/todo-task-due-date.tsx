"use client";

import { format } from "date-fns";
import { Calendar } from "lucide-react";

interface TodoTaskDueDateProps {
  dueDate?: number;
}

export const TodoTaskDueDate = ({ dueDate }: TodoTaskDueDateProps) => {
  if (!dueDate) {
    return null;
  }

  const isDueSoon = dueDate < Date.now() + 24 * 60 * 60 * 1000;
  const isOverdue = dueDate < Date.now();

  return (
    <div
      className={`
        flex 
        items-center 
        gap-1 
        px-2 
        py-1 
        rounded 
        text-xs 
        font-medium
        ${
          isOverdue
            ? "bg-red-100 text-red-700"
            : isDueSoon
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-700"
        }
      `}
    >
      <Calendar className="h-3 w-3" />
      <span>{format(dueDate, "MMM d")}</span>
    </div>
  );
};
