"use client";

import type React from "react";
import { useState } from "react";
import { format } from "date-fns";
import { Check, Calendar, User, Flag, List, ChevronDown } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Details Section */}
      <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <span className="text-sm font-medium">Details</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isDetailsOpen ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-3">
          {/* Assignee */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <User className="w-3 h-3" />
              Assignee
              {showSaved === "assignee" && (
                <Check className="w-3 h-3 text-emerald-500" />
              )}
            </div>
            <Select
              value={task.assignedToId || ""}
              onValueChange={handleAssigneeChange}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue>
                  {assignedMember ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage
                          src={assignedMember.user?.image || "/placeholder.svg"}
                          alt={assignedMember.user?.name || "Avatar"}
                        />
                        <AvatarFallback className="text-xs">
                          {assignedMember.user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{assignedMember.user?.name || "Unnamed"}</span>
                    </div>
                  ) : (
                    "Unassigned"
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
                        <Avatar className="w-4 h-4">
                          <AvatarImage
                            src={member.user?.image || "/placeholder.svg"}
                            alt={member.user?.name || "Avatar"}
                          />
                          <AvatarFallback className="text-xs">
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

          {/* Reporter */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600">Reporter</div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
              {task.createdBy?.user && (
                <>
                  <Avatar className="w-5 h-5">
                    <AvatarImage
                      src={task.createdBy.user.image || "/placeholder.svg"}
                    />
                    <AvatarFallback className="text-xs">
                      {task.createdBy.user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{task.createdBy.user.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {task.createdBy.role}
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <Flag className="w-3 h-3" />
              Priority
              {showSaved === "priority" && (
                <Check className="w-3 h-3 text-emerald-500" />
              )}
            </div>
            <Select value={task.priority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Low</SelectItem>
                <SelectItem value="medium">🔵 Medium</SelectItem>
                <SelectItem value="high">🟠 High</SelectItem>
                <SelectItem value="urgent">🔴 Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <List className="w-3 h-3" />
              Status
              {showSaved === "list" && (
                <Check className="w-3 h-3 text-emerald-500" />
              )}
            </div>
            <Select value={task.listId || ""} onValueChange={handleListChange}>
              <SelectTrigger className="h-8 text-sm">
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

          {/* Due Date */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <Calendar className="w-3 h-3" />
              Due Date
              {showSaved === "dueDate" && (
                <Check className="w-3 h-3 text-emerald-500" />
              )}
            </div>
            <Input
              type="date"
              value={dueDate}
              onChange={handleDueDateChange}
              className="h-8 text-sm"
            />
          </div>

          {/* Created */}
          <div className="space-y-2 pt-2 border-t">
            <div className="text-xs font-medium text-gray-600">Created</div>
            <div className="text-xs text-gray-500">
              {format(task.createdAt, "MMM d, yyyy 'at' h:mm a")}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
