"use client";

import React from "react";

import { useState, useCallback } from "react";
import { TaskDetails } from "./task-details";
import { TaskDescription } from "./task-description";
import { TaskComments } from "./task-comments";
import type { Id } from "../../../../../convex/_generated/dataModel";

interface TaskContentProps {
  task: {
    _id: Id<"projectTasks">;
    title: string;
    description?: string;
    listId: Id<"projectLists">;
    assignedToId: Id<"members">;
    workspaceId: Id<"workspaces">;
    priority: "low" | "medium" | "high" | "urgent";
    dueDate?: number;
    createdAt: number;
    createdBy: {
      _id: Id<"members">;
      userId: Id<"users">;
      workspaceId: Id<"workspaces">;
      role: "admin" | "member" | "lead";
      user: {
        _id: Id<"users">;
        name?: string;
        email?: string;
        image?: string;
      } | null;
    } | null;
    descriptionImages?: string[];
  };
  lists: Array<{
    _id: Id<"projectLists">;
    name: string;
    position: number;
    boardId: Id<"projectBoards">;
    memberId: Id<"members">;
    workspaceId: Id<"workspaces">;
    isArchived?: boolean;
    createdAt: number;
    updatedAt: number;
  }>;
  onImagePreview: (url: string) => void;
}

export const TaskContent = ({
  task,
  lists,
  onImagePreview,
}: TaskContentProps) => {
  const [descriptionWidth, setDescriptionWidth] = useState(35);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const container = document.getElementById("task-content-container");
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const percentage = ((e.clientX - rect.left) / rect.width) * 100;
      const clampedPercentage = Math.max(25, Math.min(75, percentage));
      setDescriptionWidth(clampedPercentage);
    },
    [isResizing],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add event listeners
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="flex-1 overflow-hidden">
      {/* Task Details Section */}
      <div className="p-6 border-b bg-gray-50/50">
        <TaskDetails task={task} lists={lists} />
      </div>

      {/* Main Content Area */}
      <div
        id="task-content-container"
        className="flex h-full"
        style={{ height: "calc(100vh - 300px)" }}
      >
        {/* Description Panel */}
        <div
          className="border-r bg-white overflow-y-auto"
          style={{ width: `${descriptionWidth}%` }}
        >
          <TaskDescription task={task} onImagePreview={onImagePreview} />
        </div>

        {/* Resizer */}
        <div
          className="w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize transition-colors"
          onMouseDown={handleMouseDown}
        />

        {/* Comments Panel */}
        <div
          className="bg-white overflow-y-auto"
          style={{ width: `${100 - descriptionWidth}%` }}
        >
          <TaskComments task={task} onImagePreview={onImagePreview} />
        </div>
      </div>
    </div>
  );
};
