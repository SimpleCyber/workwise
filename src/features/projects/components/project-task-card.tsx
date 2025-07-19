"use client";

import { format } from "date-fns";
import {
  AlertCircle,
  Archive,
  Calendar,
  Edit,
  MoreHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { Id } from "../../../../convex/_generated/dataModel";

const extractTextFromRichContent = (jsonContent: string): string => {
  try {
    const parsed = JSON.parse(jsonContent);
    if (Array.isArray(parsed.ops)) {
      const text = parsed.ops
        .map((op: { insert: string }) =>
          typeof op.insert === "string" ? op.insert : "",
        )
        .join("")
        .replace(/\s+/g, " ")
        .trim();

      return text + "\n";
    }
    return "";
  } catch {
    return "";
  }
};

const trimDescription = (text: string, maxLength = 200): string => {
  const trimmed = text.trim();
  return trimmed.length > maxLength
    ? trimmed.slice(0, maxLength).trim() + "..."
    : trimmed;
};

interface ProjectTaskCardProps {
  task: {
    _id: Id<"projectTasks">;
    title: string;
    description?: string;
    taskCode: string;
    listId: Id<"projectLists">;
    boardId: Id<"projectBoards">;
    createdById: Id<"members">;
    assignedToId: Id<"members">;
    assignedById: Id<"members">;
    workspaceId: Id<"workspaces">;
    position: number;
    priority: "low" | "medium" | "high" | "urgent";
    dueDate?: number;
    isCompleted?: boolean;
    isArchived?: boolean;
    labels?: string[];
    attachments?: Id<"_storage">[];
    createdAt: number;
    updatedAt: number;
    assignedAt: number;
    assignedTo: {
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
    assignedBy: {
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
  };
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onMoveToPrevious?: () => void;
  onMoveToNext?: () => void;
  isFirstList?: boolean;
  isLastList?: boolean;
}

const priorityColors = {
  low: "text-green-600",
  medium: "text-blue-600",
  high: "text-orange-600",
  urgent: "text-red-600",
};

export const ProjectTaskCard = ({
  task,
  onEdit,
  onArchive,
  onDelete,
  onMoveToPrevious,
  onMoveToNext,
  isFirstList = false,
  isLastList = false,
}: ProjectTaskCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isDueSoon =
    task.dueDate && task.dueDate < Date.now() + 24 * 60 * 60 * 1000;
  const isOverdue = task.dueDate && task.dueDate < Date.now();

  const trimDescription = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Generate unique color for user based on their ID
  const getUserColor = (userId: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-cyan-500",
      "bg-lime-500",
      "bg-emerald-500",
    ];
    const hash = userId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const userColor = task.assignedTo?.user
    ? getUserColor(task.assignedTo.user._id)
    : "bg-gray-500";

  const getAssignmentTooltip = () => {
    if (!task.assignedBy?.user || !task.assignedTo?.user)
      return `Assigned to ${task.assignedTo?.user?.name || "Unknown"}`;

    if (task.assignedBy._id === task.assignedTo._id) {
      return `Self-assigned by ${task.assignedBy.user.name}`;
    }

    return `${task.assignedTo.user.name} <- ${task.assignedBy.user.name}`;
  };

  return (
    <TooltipProvider>
      <Card
        className="cursor-pointer hover:bg-gray-50 transition-colors bg-white shadow-none border border-gray-200 rounded-lg relative w-[100%] mx-auto overflow-hidden"
        onClick={() => onEdit?.()}
      >
        {/* Unique colored left border for each user */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${userColor}`} />

        <CardContent className="p-3 space-y-1">
          {/* Header with Title and Actions */}
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-medium leading-tight text-gray-900 flex-1 pr-2">
              {task.title}
            </h4>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.();
                  }}
                >
                  <Edit className="size-4 mr-2" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description preview */}
          {task.description && (
            <p className="text-xs text-gray-600 leading-relaxed">
              {trimDescription(extractTextFromRichContent(task.description))}
            </p>
          )}

          {/* Footer with Task Code, Priority, Due Date and Assignment */}
          <div className="flex items-center justify-between pt-2">
            {/* Task Code and Priority */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono">
                {task.taskCode}
              </span>
              <span
                className={`text-xs font-medium ${priorityColors[task.priority]}`}
              >
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            </div>

            {/* Due Date and Assigned To */}
            <div className="flex items-center gap-2">
              {task.dueDate && (
                <span
                  className={`text-xs ${
                    isOverdue
                      ? "text-red-600 font-medium"
                      : isDueSoon
                        ? "text-yellow-600 font-medium"
                        : "text-gray-500"
                  }`}
                >
                  {format(task.dueDate, "MMM d")}
                  {isOverdue && <AlertCircle className="size-3 inline ml-1" />}
                </span>
              )}

              {task.assignedTo?.user && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Avatar className="w-4 h-4">
                        <AvatarImage
                          src={task.assignedTo.user.image || "/placeholder.svg"}
                        />
                        <AvatarFallback className="text-xs">
                          {task.assignedTo.user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getAssignmentTooltip()}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
