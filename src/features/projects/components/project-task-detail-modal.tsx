"use client";
import { format } from "date-fns";
import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGetWorkspaceMembers } from "@/features/projects/api/use-get-workspace-members";
import { useUpdateProjectTask } from "@/features/projects/api/use-update-project-task";
import type { Id } from "../../../../convex/_generated/dataModel";

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
  }>; // New prop to pass all lists
}

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export const ProjectTaskDetailModal = ({
  task,
  open,
  onOpenChange,
  lists,
}: ProjectTaskDetailModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium");
  const [assignedToId, setAssignedToId] = useState<Id<"members"> | undefined>(
    undefined,
  );
  const [dueDate, setDueDate] = useState("");
  const [currentListId, setCurrentListId] = useState<
    Id<"projectLists"> | undefined
  >(undefined); // State for current list
  const { mutate: updateTask, isPending } = useUpdateProjectTask();
  const { data: members } = useGetWorkspaceMembers({
    workspaceId: task?.workspaceId,
  });

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setAssignedToId(task.assignedToId);
      setDueDate(task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : "");
      setCurrentListId(task.listId); // Set initial list ID
    }
  }, [task]);

  const handleSave = () => {
    if (!task || !title.trim() || !currentListId) return;

    const selectedList = lists.find((list) => list._id === currentListId);
    const isCompleted = selectedList?.name === "Done"; // Automatically set isCompleted based on list name

    const updates: any = {
      taskId: task._id,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assignedToId,
      listId: currentListId, // Update listId
      isCompleted, // Update isCompleted based on list
    };

    if (dueDate) {
      updates.dueDate = new Date(dueDate).getTime();
    }

    updateTask(updates, {
      onSuccess: () => {
        toast.success("Task updated successfully!");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update task");
      },
    });
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {task.taskCode}
              </Badge>
              <Badge className={`${priorityColors[priority]}`}>
                {priority.toUpperCase()}
              </Badge>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              disabled={isPending}
            />
          </div>
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description..."
              rows={4}
              disabled={isPending}
            />
          </div>
          {/* Priority and Assignment Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                  setPriority(value)
                }
              >
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select
                value={assignedToId || ""}
                onValueChange={(value) =>
                  setAssignedToId(value as Id<"members">)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee..." />
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
                            <AvatarFallback className="text-xs">
                              {member.user?.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.user?.name || "Unnamed Member"}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Due Date and List Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>List Status</Label>
              <Select
                value={currentListId || ""}
                onValueChange={(value: Id<"projectLists">) =>
                  setCurrentListId(value)
                }
              >
                <SelectTrigger>
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
          </div>
          {/* Task Info */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-sm">Task Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created by:</span>
                <div className="flex items-center gap-2 mt-1">
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
                    </>
                  )}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <div className="mt-1">
                  {format(task.createdAt, "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending || !title.trim()}>
              {isPending ? (
                <>
                  <Save className="size-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
