"use client";
import { TaskDetails } from "./task-details";
import { TaskDescription } from "./task-description";
import { TaskComments } from "./task-comments";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAtomValue } from "jotai";
import { projectTaskViewModeAtom } from "@/lib/panel-atoms";
import { User } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  const viewMode = useAtomValue(projectTaskViewModeAtom);
  const isVertical = viewMode === "panel";

  return (
    <div
      className={`flex bg-background ${isVertical ? "flex-col-reverse" : "h-full flex-col @container sm:flex-row"}`}
    >
      {/* Main Content Area - Left Side */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${isVertical ? "" : "overflow-y-auto overflow-x-hidden"}`}
      >
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

        {/* Reporter Info (Bottom of Left Column - Panel Only) */}
        {isVertical && (
          <div className="px-6 py-8 border-t border-muted-foreground/15">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="w-4 h-4 opacity-70" />
                <span>Reporter</span>
              </div>
              <div className="flex items-center gap-2">
                {task.createdBy?.user && (
                  <Avatar className="w-5 h-5 opacity-90 border shadow-sm">
                    <AvatarImage src={task.createdBy.user.image || ""} />
                    <AvatarFallback className="text-[9px] uppercase">
                      {task.createdBy.user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
                <span className="text-muted-foreground">
                  {task.createdBy?.user?.name || "System"}
                </span>
              </div>
            </div>
            <div className="mt-3 text-right text-[10px] text-muted-foreground opacity-70">
              Created {format(task.createdAt, "MMM d, yyyy")}
            </div>
          </div>
        )}
      </div>

      {/* Details Sidebar - Right Side */}
      <div
        className={`${isVertical ? "w-full border-b" : "w-80 border-l sticky top-0 flex-shrink-0 h-full overflow-y-auto"} bg-muted/10`}
      >
        <TaskDetails task={task} lists={lists} hideMeta={isVertical} />
      </div>
    </div>
  );
};
