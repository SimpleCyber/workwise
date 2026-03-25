"use client";

import type React from "react";
import { useState } from "react";
import { format } from "date-fns";
import { Check, Calendar, User, Flag, List } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    updatedAt: number;
  }>;
}

export const TaskDetails = ({ task, lists }: TaskDetailsProps) => {
  const [showSaved, setShowSaved] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : "",
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

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
          toast.success("Task updated successfully!");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update task");
        },
      },
    );
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

  const handleListChange = (listId: Id<"projectLists">) => {
    const selectedList = lists.find((list) => list._id === listId);
    const isCompleted = selectedList?.name === "Done";
    handleUpdate({ listId, isCompleted });
    showSavedIndicator("list");
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDueDate(newDate);
    const updates: any = {};
    if (newDate) {
      updates.dueDate = new Date(newDate).getTime();
    }
    handleUpdate(updates);
    showSavedIndicator("dueDate");
  };

  const assignedMember = members?.find((m) => m?._id === task.assignedToId);

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="p-6 space-y-6">
        {/* Status Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <List className="w-3.5 h-3.5" />
            Status
            {showSaved === "list" && (
              <Check className="w-3.5 h-3.5 text-emerald-500 animate-in fade-in zoom-in" />
            )}
          </div>
          <Select value={task.listId || ""} onValueChange={handleListChange}>
            <SelectTrigger className="h-9 w-full bg-secondary/50 border-none hover:bg-secondary transition-colors font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {lists.map((list) => (
                <SelectItem key={list._id} value={list._id}>
                  {list.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <Flag className="w-3.5 h-3.5" />
            Priority
            {showSaved === "priority" && (
              <Check className="w-3.5 h-3.5 text-emerald-500 animate-in fade-in zoom-in" />
            )}
          </div>
          <Select value={task.priority} onValueChange={handlePriorityChange}>
            <SelectTrigger className="h-9 w-full bg-secondary/50 border-none hover:bg-secondary transition-colors font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Low
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Medium
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  High
                </div>
              </SelectItem>
              <SelectItem value="urgent">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Urgent
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assignee Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <User className="w-3.5 h-3.5" />
            Assignee
            {showSaved === "assignee" && (
              <Check className="w-3.5 h-3.5 text-emerald-500 animate-in fade-in zoom-in" />
            )}
          </div>
          <Select
            value={task.assignedToId || ""}
            onValueChange={handleAssigneeChange}
          >
            <SelectTrigger className="h-10 w-full bg-secondary/50 border-none hover:bg-secondary transition-colors">
              <SelectValue>
                {assignedMember ? (
                  <div className="flex items-center gap-2.5">
                    <Avatar className="w-6 h-6 border border-background shadow-sm">
                      <AvatarImage
                        src={assignedMember.user?.image || "/placeholder.svg"}
                        alt={assignedMember.user?.name || "Avatar"}
                      />
                      <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                        {assignedMember.user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {assignedMember.user?.name || "Unnamed"}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {members
                ?.filter(
                  (member): member is NonNullable<typeof member> =>
                    member !== null,
                )
                .map((member) => (
                  <SelectItem key={member._id} value={member._id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage
                          src={member.user?.image || "/placeholder.svg"}
                          alt={member.user?.name || "Avatar"}
                        />
                        <AvatarFallback className="text-[10px]">
                          {member.user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {member.user?.name || "Unnamed Member"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Due Date Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            Due Date
            {showSaved === "dueDate" && (
              <Check className="w-3.5 h-3.5 text-emerald-500 animate-in fade-in zoom-in" />
            )}
          </div>
          <div className="relative">
            <Input
              type="date"
              value={dueDate}
              onChange={handleDueDateChange}
              className="h-9 w-full bg-secondary/50 border-none hover:bg-secondary transition-colors font-medium pl-9 text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
            />
            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground/50 pointer-events-none" />
          </div>
        </div>

        {/* Reporter Section */}
        <div className="space-y-3 pt-4 border-t border-muted-foreground/10">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Reporter
          </div>
          <div className="flex items-center gap-2.5 p-2.5 bg-muted/30 rounded-lg group hover:bg-muted/50 transition-colors">
            {task.createdBy?.user && (
              <>
                <Avatar className="w-6 h-6 border border-background">
                  <AvatarImage
                    src={task.createdBy.user.image || "/placeholder.svg"}
                  />
                  <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">
                    {task.createdBy.user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">
                    {task.createdBy.user.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {task.createdBy.role}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dates Info */}
        <div className="space-y-2 pt-4">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Created</span>
            <span className="font-medium text-foreground/80">
              {format(task.createdAt, "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
