"use client";
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
  return (
    <div className="flex min-h-full">
      {/* Main Content Area - Left Side */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Description Section */}
        <div className="border-b">
          <TaskDescription task={task} onImagePreview={onImagePreview} />
        </div>

        {/* Comments Section */}
        <div>
          <TaskComments task={task} onImagePreview={onImagePreview} />
        </div>
      </div>

      {/* Details Sidebar - Right Side */}
      <div className="w-80 border-l bg-gray-50/30 flex-shrink-0 sticky top-0 self-start">
        <TaskDetails task={task} lists={lists} />
      </div>
    </div>
  );
};
