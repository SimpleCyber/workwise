"use client";
import { useState } from "react";
import {
  ClipboardList,
  ClipboardCheck,
  Clock,
  ClipboardX,
  Eye,
  X,
  Check,
} from "lucide-react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ActionOverlay, useHoverActions } from "../tree-actions/action-overlay";
import { useCreateProjectTask } from "../../../projects/api/use-create-project-task";
import { useGetWorkspaceMembers } from "../../../projects/api/use-get-workspace-members";
import { getListIcon, getListColor } from "../../api/tree-utils";
import { toast } from "sonner";
import type { Id } from "../../../../../convex/_generated/dataModel";

interface CreateTaskFormProps {
  listId: Id<"projectLists">;
  workspaceId: Id<"workspaces">;
  onClose: () => void;
  isVisible: boolean;
}

const CreateTaskForm = ({
  listId,
  workspaceId,
  onClose,
  isVisible,
}: CreateTaskFormProps) => {
  const [title, setTitle] = useState("");
  const [assignedToId, setAssignedToId] = useState<Id<"members"> | undefined>();
  const { mutate: createTask, isPending } = useCreateProjectTask();
  const { data: members } = useGetWorkspaceMembers({ workspaceId });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createTask({
        title: title.trim(),
        listId,
        assignedToId,
      });
      toast.success("Task created successfully!", {
        description: `${title.trim()} has been added to the list.`,
      });
      setTitle("");
      setAssignedToId(undefined);
      onClose();
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task");
    }
  };

  const handleClose = () => {
    setTitle("");
    setAssignedToId(undefined);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
      <Card className="w-80 shadow-lg border-2 border-primary/20 bg-popover">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm">Create New Task</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="task-title" className="text-xs font-medium">
                Task Title
              </Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                className="h-8 text-sm"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-assignee" className="text-xs font-medium">
                Assign To
              </Label>
              <Select
                value={assignedToId}
                onValueChange={(val) => setAssignedToId(val as Id<"members">)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select assignee (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {members?.map((member) => (
                    <SelectItem key={member._id} value={member._id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage
                            src={member.user?.image || "/placeholder.svg"}
                          />
                          <AvatarFallback className="text-xs">
                            {member.user?.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {member.user?.name || "Unknown"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="h-7 px-3 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending || !title.trim()}
                className="h-7 px-3 text-xs"
              >
                {isPending ? (
                  "Creating..."
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export const ListNode = ({ data }: NodeProps) => {
  const { isHovered, hoverProps } = useHoverActions();
  const [showCreateTask, setShowCreateTask] = useState(false);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "list":
        return <ClipboardList className="w-8 h-8 text-blue-500" />;
      case "clock":
        return <Clock className="w-8 h-8 text-yellow-500" />;
      case "alert-circle":
        return <ClipboardX className="w-8 h-8 text-rose-500" />;
      case "eye":
        return <Eye className="w-8 h-8 text-purple-500" />;
      case "check-square":
        return <ClipboardCheck className="w-8 h-8 text-green-500" />;
      default:
        return <ClipboardList className="w-8 h-8 text-muted-foreground" />;
    }
  };

  const handleNodeClick = () => {
    data.onToggleTasks?.(data.listId);
  };

  const handleAddTask = () => {
    setShowCreateTask(true);
  };

  const handleCloseForm = () => {
    setShowCreateTask(false);
  };

  const listColor = getListColor(data.name);
  const baseColor = listColor.includes("blue")
    ? "blue"
    : listColor.includes("yellow")
      ? "yellow"
      : listColor.includes("red")
        ? "red"
        : listColor.includes("purple")
          ? "purple"
          : listColor.includes("green")
            ? "green"
            : "gray";

  return (
    <div className="relative" {...hoverProps}>
      <div className="flex flex-col items-center">
        <Card
          className={`shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 ${listColor} ${
            data.isTasksExpanded ? "w-20 h-20" : "w-16 h-16"
          } ${data.isActive ? `ring-2 ring-primary` : ""} relative`}
          onClick={handleNodeClick}
        >
          <CardContent className="flex items-center justify-center h-full p-2">
            {!data.isTasksExpanded ? (
              <div className="flex items-center justify-center">
                {getIconComponent(getListIcon(data.name))}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <div className="animate-pulse">
                  {getIconComponent(getListIcon(data.name))}
                </div>
              </div>
            )}
            <Handle
              type="target"
              position={data.isHorizontal ? Position.Left : Position.Top}
              className="w-3 h-3"
              style={{
                left: data.isHorizontal ? "-6px" : "50%",
                top: data.isHorizontal ? "50%" : "-6px",
                transform: data.isHorizontal
                  ? "translateY(-50%)"
                  : "translateX(-50%)",
              }}
            />
            <Handle
              type="source"
              position={data.isHorizontal ? Position.Right : Position.Bottom}
              className="w-3 h-3"
              style={{
                right: data.isHorizontal ? "-6px" : "auto",
                left: data.isHorizontal ? "auto" : "50%",
                bottom: data.isHorizontal ? "auto" : "-6px",
                top: data.isHorizontal ? "50%" : "auto",
                transform: data.isHorizontal
                  ? "translateY(-50%)"
                  : "translateX(-50%)",
              }}
            />
          </CardContent>
        </Card>
        <div className="mt-2 text-center">
          <p className="text-xs font-semibold text-foreground">{data.name}</p>
          <div className="text-xs mt-1 text-muted-foreground">
            {data.taskCount} tasks
          </div>
        </div>
      </div>

      {/* Action Overlay */}
      {isHovered && !showCreateTask && (
        <div
          onMouseEnter={() => {
            // Keep the overlay visible when hovering over it
          }}
          onMouseLeave={() => {
            // This will be handled by the useHoverActions hook
          }}
        >
          <ActionOverlay
            onAdd={handleAddTask}
            position="top"
            isVisible={isHovered}
          />
        </div>
      )}

      {/* Inline Create Task Form */}
      <CreateTaskForm
        listId={data.listId}
        workspaceId={data.workspaceId}
        onClose={handleCloseForm}
        isVisible={showCreateTask}
      />
    </div>
  );
};
