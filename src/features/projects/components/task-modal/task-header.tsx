"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useUpdateProjectTask } from "@/features/projects/api/use-update-project-task";
import type { Id } from "../../../../../convex/_generated/dataModel";

const priorityColors = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
};

interface TaskHeaderProps {
  task: {
    _id: Id<"projectTasks">;
    title: string;
    taskCode: string;
    priority: "low" | "medium" | "high" | "urgent";
  };
  onClose: () => void;
}

export const TaskHeader = ({ task, onClose }: TaskHeaderProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [showSaved, setShowSaved] = useState(false);

  const { mutate: updateTask } = useUpdateProjectTask();

  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  const handleTitleSave = () => {
    if (!title.trim() || title === task.title) {
      setTitle(task.title);
      setIsEditingTitle(false);
      return;
    }

    updateTask(
      { taskId: task._id, title: title.trim() },
      {
        onSuccess: () => {
          setIsEditingTitle(false);
          setShowSaved(true);
          setTimeout(() => setShowSaved(false), 2000);
          toast.success("Title updated successfully!");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update title");
          setTitle(task.title);
          setIsEditingTitle(false);
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setTitle(task.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-slate-50/50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Badge
          variant="outline"
          className="font-mono text-xs px-2 py-1 shrink-0"
        >
          {task.taskCode}
        </Badge>

        <Badge
          className={`${priorityColors[task.priority]} text-xs px-2 py-1 shrink-0`}
        >
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </Badge>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleKeyDown}
              className="text-lg font-medium border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent"
              autoFocus
            />
          ) : (
            <h1
              className="text-lg font-medium cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition-colors flex items-center gap-2 truncate"
              onClick={() => setIsEditingTitle(true)}
              title={task.title}
            >
              <span className="truncate">{task.title}</span>
              {showSaved && (
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
            </h1>
          )}
        </div>
      </div>
    </div>
  );
};
