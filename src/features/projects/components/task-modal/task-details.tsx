"use client";

import type React from "react";
import { useState } from "react";
import { format } from "date-fns";
import {
  List,
  Flag,
  User,
  Calendar,
  Check,
  CircleAlert,
  Circle,
  Settings2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useGetWorkspaceMembers } from "@/features/projects/api/use-get-workspace-members";
import { useUpdateProjectTask } from "@/features/projects/api/use-update-project-task";
import type { Id } from "../../../../../convex/_generated/dataModel";

interface TaskDetailsProps {
  task: {
    _id: Id<"projectTasks">;
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
  }>;
  hideMeta?: boolean;
}

export const TaskDetails = ({ task, lists, hideMeta }: TaskDetailsProps) => {
  const [showSaved, setShowSaved] = useState<string | null>(null);

  const { data: members } = useGetWorkspaceMembers({
    workspaceId: task.workspaceId,
  });
  const { mutate: updateTask } = useUpdateProjectTask();

  const showSavedIndicator = (field: string) => {
    setShowSaved(field);
    setTimeout(() => setShowSaved(null), 1500);
  };

  const handleUpdate = (updates: any) => {
    updateTask(
      { taskId: task._id, ...updates },
      {
        onSuccess: () => {
          toast.success("Task updated");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update task");
        },
      },
    );
  };

  const handleListChange = (listId: Id<"projectLists">) => {
    const selectedList = lists.find((list) => list._id === listId);
    const isCompleted = selectedList?.name === "Done";
    handleUpdate({ listId, isCompleted });
    showSavedIndicator("list");
  };

  const handlePriorityChange = (
    priority: "low" | "medium" | "high" | "urgent",
  ) => {
    handleUpdate({ priority });
    showSavedIndicator("priority");
  };

  const handleAssigneeChange = (assignedToId: Id<"members">) => {
    handleUpdate({ assignedToId });
    showSavedIndicator("assignee");
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const updates: any = {};
    if (newDate) {
      updates.dueDate = new Date(newDate).getTime();
    } else {
      updates.dueDate = null;
    }
    handleUpdate(updates);
    showSavedIndicator("dueDate");
  };

  const assignedMember = members?.find((m) => m?._id === task.assignedToId);

  return (
    <div className="flex flex-col h-full bg-transparent p-5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5 ml-1">
        Properties
      </h3>

      <div className="flex flex-col space-y-4">
        {/* Status */}
        <div className="grid grid-cols-[100px_1fr] items-center text-sm gap-2">
          <div className="text-muted-foreground flex items-center gap-1.5 ml-1">
            <List className="w-3.5 h-3.5 opacity-70" />
            <span>Status</span>
          </div>
          <div>
            <Select value={task.listId || ""} onValueChange={handleListChange}>
              <SelectTrigger className="border-0 shadow-none h-auto p-1 py-0.5 focus:ring-0 bg-transparent hover:bg-muted/50 transition-colors w-fit -ml-2 rounded flex gap-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lists.map((list) => (
                  <SelectItem key={list._id} value={list._id}>
                    <Badge
                      variant="secondary"
                      className="font-normal border shadow-none bg-muted hover:bg-muted font-medium capitalize"
                    >
                      {list.name}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Priority */}
        <div className="grid grid-cols-[100px_1fr] items-center text-sm gap-2">
          <div className="text-muted-foreground flex items-center gap-1.5 ml-1">
            <Settings2 className="w-3.5 h-3.5 opacity-70" />
            <span>Priority</span>
          </div>
          <div>
            <Select value={task.priority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="border-0 shadow-none h-auto p-1 focus:ring-0 bg-transparent hover:bg-muted/50 transition-colors w-fit -ml-2 rounded flex gap-2 capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Low
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Medium
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    High
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Urgent
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Assignee */}
        <div className="grid grid-cols-[100px_1fr] items-center text-sm gap-2">
          <div className="text-muted-foreground flex items-center gap-1.5 ml-1">
            <User className="w-3.5 h-3.5 opacity-70" />
            <span>Assignee</span>
          </div>
          <div>
            <Select
              value={task.assignedToId || ""}
              onValueChange={handleAssigneeChange}
            >
              <SelectTrigger className="border-0 shadow-none h-auto p-1 focus:ring-0 bg-transparent hover:bg-muted/50 transition-colors w-fit -ml-2 rounded flex gap-2">
                <SelectValue>
                  {assignedMember ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5 border shadow-sm">
                        <AvatarImage src={assignedMember.user?.image || ""} />
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary uppercase">
                          {assignedMember.user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{assignedMember.user?.name || "Unnamed"}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {members
                  ?.filter((m) => m !== null)
                  .map((member) => (
                    <SelectItem key={member._id!} value={member._id!}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={member.user?.image || ""} />
                          <AvatarFallback className="text-[9px] uppercase">
                            {member.user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.user?.name || "Unnamed"}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Due date */}
        <div className="grid grid-cols-[100px_1fr] items-center text-sm gap-2">
          <div className="text-muted-foreground flex items-center gap-1.5 ml-1">
            <Calendar className="w-3.5 h-3.5 opacity-70" />
            <span>Due date</span>
          </div>
          <div>
            <div className="relative group w-fit -ml-2 rounded hover:bg-muted/50 transition-colors p-1 flex items-center gap-2 cursor-text">
              {task.dueDate ? (
                <span>{format(task.dueDate, "MMM d, yyyy")}</span>
              ) : (
                <span className="text-muted-foreground">Not set</span>
              )}
              {/* Invisible native input overlay to trigger click precisely but render stealthily */}
              <Input
                type="date"
                value={task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : ""}
                onChange={handleDueDateChange}
                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full p-0 m-0"
              />
            </div>
          </div>
        </div>
      </div>

      {!hideMeta && (
        <>
          <hr className="my-6 border-muted-foreground/15" />

          {/* Reporter Info (Read-only) */}
          <div className="grid grid-cols-[100px_1fr] items-center text-sm gap-2 mb-8">
            <div className="text-muted-foreground flex items-center gap-1.5 ml-1">
              <User className="w-3.5 h-3.5 opacity-70" />
              <span>Reporter</span>
            </div>
            <div className="flex items-center gap-2 p-1 text-muted-foreground ml-1">
              {task.createdBy?.user && (
                <Avatar className="w-5 h-5 opacity-90 border shadow-sm">
                  <AvatarImage src={task.createdBy.user.image || ""} />
                  <AvatarFallback className="text-[9px] uppercase">
                    {task.createdBy.user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              <span>{task.createdBy?.user?.name || "System"}</span>
            </div>
          </div>

          <hr className="border-muted-foreground/15" />

          <div className="mt-4 text-[10px] text-muted-foreground opacity-70 ml-1">
            Created {format(task.createdAt, "MMM d, yyyy")}
          </div>
        </>
      )}
    </div>
  );
};
