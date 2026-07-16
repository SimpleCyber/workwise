"use client";
import { TaskDetails } from "./task-details";
import { TaskDescription } from "./task-description";
import { TaskComments } from "./task-comments";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

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
  const flags = useQuery(api.admin.getFeatureFlags);

  // By default, if flags aren't loaded or not set, assume enabled
  const commentsFlag = flags?.find((f) => f.key === "task_comments");
  const showComments = commentsFlag ? commentsFlag.enabled : true;

  return (
    <div className="flex h-full bg-background">
      {/* Main Content Area - Left Side */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden">
        {/* Description Section */}
        <div className="px-6 py-4">
          <TaskDescription task={task} onImagePreview={onImagePreview} />
        </div>

        {/* Activity/Comments Section */}
        {showComments && (
          <div className="px-6 py-4 border-t">
            <TaskComments task={task} onImagePreview={onImagePreview} />
          </div>
        )}
      </div>

      {/* Details Sidebar - Right Side */}
      <div className="w-80 border-l bg-muted/10 flex-shrink-0 sticky top-0 self-start h-full overflow-y-auto">
        <TaskDetails task={task} lists={lists} />
      </div>
    </div>
  );
};
