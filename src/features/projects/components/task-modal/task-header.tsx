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

interface TaskHeaderProps {
  task: {
    _id: Id<"projectTasks">;
    title: string;
    taskCode: string;
  };
  lists: Array<{
    _id: Id<"projectLists">;
    name: string;
  }>;
  onClose: () => void;
}

export const TaskHeader = ({ task, lists, onClose }: TaskHeaderProps) => {
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
    <div className="flex flex-col px-6 py-4 border-b bg-background">
      {/* Breadcrumbs / Task ID */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:underline cursor-pointer">
          {task.taskCode.split("-")[0]}
        </span>
        <span className="text-xs text-muted-foreground">/</span>
        <Badge
          variant="secondary"
          className="font-mono text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground border-none hover:bg-muted/80 transition-colors cursor-pointer"
        >
          {task.taskCode}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0 group">
          {isEditingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleKeyDown}
              className="text-2xl font-bold border-2 border-primary/20 shadow-none px-2 py-1 h-auto focus-visible:ring-2 focus-visible:ring-primary/20 bg-muted/30 rounded-md transition-all"
              autoFocus
            />
          ) : (
            <h1
              className="text-xl md:text-2xl font-bold cursor-pointer hover:bg-muted/50 px-2 py-1 -ml-2 rounded-md transition-all flex items-start gap-2 group leading-tight"
              onClick={() => setIsEditingTitle(true)}
              title={task.title}
            >
              <span className="flex-1 whitespace-pre-wrap">{title}</span>
              <Badge
                variant="secondary"
                className="shrink-0 mt-0.5 pointer-events-none capitalize"
              >
                {lists.find((l) => l._id === (task as any).listId)?.name ||
                  "Task"}
              </Badge>
              {showSaved && (
                <Check className="w-5 h-5 text-emerald-500 shrink-0 animate-in fade-in zoom-in duration-300" />
              )}
            </h1>
          )}
        </div>
      </div>
    </div>
  );
};
