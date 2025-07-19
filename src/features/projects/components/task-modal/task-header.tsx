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
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-blue-100 text-blue-800 border-blue-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  urgent: "bg-red-100 text-red-800 border-red-200",
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
    <div className="flex items-center justify-between p-6 border-b bg-white">
      <div className="flex items-center gap-4 flex-1">
        <Badge variant="outline" className="font-mono text-sm px-3 py-1">
          {task.taskCode}
        </Badge>

        <Badge className={`${priorityColors[task.priority]} text-sm px-3 py-1`}>
          {task.priority.toUpperCase()}
        </Badge>

        <div className="flex items-center gap-2 flex-1 max-w-2xl">
          {isEditingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleKeyDown}
              className="text-xl font-semibold border-none shadow-none p-0 h-auto focus-visible:ring-0"
              autoFocus
            />
          ) : (
            <h1
              className="text-xl font-semibold cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors flex items-center gap-2"
              onClick={() => setIsEditingTitle(true)}
            >
              {task.title}
              {showSaved && (
                <Check className="w-4 h-4 text-green-600 animate-pulse" />
              )}
            </h1>
          )}
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={onClose}>
        <X className="w-5 h-5" />
      </Button>
    </div>
  );
};
