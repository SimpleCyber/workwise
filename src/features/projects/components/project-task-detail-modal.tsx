"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Id } from "../../../../convex/_generated/dataModel";
import { TaskHeader } from "./task-modal/task-header";
import { TaskContent } from "./task-modal/task-content";
import { ImagePreviewModal } from "./task-modal/image-preview-modal";

interface ProjectTaskDetailModalProps {
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
    images?: Id<"_storage">[];
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
    descriptionImages?: string[];
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

export const ProjectTaskDetailModal = ({
  task,
  open,
  onOpenChange,
  lists,
}: ProjectTaskDetailModalProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  if (!task) return null;

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0">
          <div className="flex flex-col h-full">
            <TaskHeader task={task} onClose={() => onOpenChange(false)} />
            <div className="flex-1 min-h-0 overflow-auto">
              <TaskContent
                task={task}
                lists={lists}
                onImagePreview={setImagePreview}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ImagePreviewModal
        imageUrl={imagePreview}
        onClose={() => setImagePreview(null)}
      />
    </TooltipProvider>
  );
};
