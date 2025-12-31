"use client";
import { useState, useEffect } from "react";
import { MessageSquare, Calendar, X, Check } from "lucide-react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionOverlay, useHoverActions } from "../tree-actions/action-overlay";
import { DeleteConfirmationModal } from "../tree-actions/delete-confirmation-modal";
import { useDeleteProjectTask } from "../../../projects/api/use-delete-project-task";
import { useUpdateProjectTask } from "../../../projects/api/use-update-project-task"; // Assuming this hook exists or will be created
import { useGetWorkspaceMembers } from "../../../projects/api/use-get-workspace-members"; // For assignee selection
import { getPriorityColor, formatDate } from "../../api/tree-utils";
import { toast } from "sonner";
import type { Task } from "../../api/tree-types";
import type { Id } from "../../../../../convex/_generated/dataModel";

interface TaskTooltipProps {
  task: Task;
}

const TaskTooltip = ({ task }: TaskTooltipProps) => (
  <div className="space-y-3 text-xs max-w-sm">
    <div>
      <h4 className="font-semibold text-sm mb-1">{task.title}</h4>
      <p className="text-muted-foreground font-mono">{task.taskCode}</p>
    </div>
    {task.description && (
      <div>
        <p className="font-medium mb-1">Description:</p>
        <p className="text-muted-foreground">{task.description}</p>
      </div>
    )}
    <div className="grid grid-cols-2 gap-2">
      <div>
        <p className="font-medium">Priority:</p>
        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </Badge>
      </div>
      <div>
        <p className="font-medium">Status:</p>
        <Badge
          variant={task.isCompleted ? "default" : "secondary"}
          className="text-xs"
        >
          {task.isCompleted ? "Completed" : "In Progress"}
        </Badge>
      </div>
    </div>
    {task.assignedTo && (
      <div>
        <p className="font-medium mb-1">Assigned to:</p>
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage
              src={task.assignedTo?.user?.image || "/placeholder.svg"}
            />
            <AvatarFallback className="text-xs">
              {task.assignedTo?.user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span>{task.assignedTo?.user?.name || "Unknown"}</span>
        </div>
      </div>
    )}
    {task.assignedBy && (
      <div>
        <p className="font-medium mb-1">Assigned by:</p>
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage
              src={task.assignedBy?.user?.image || "/placeholder.svg"}
            />
            <AvatarFallback className="text-xs">
              {task.assignedBy?.user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span>{task.assignedBy?.user?.name || "Unknown"}</span>
        </div>
      </div>
    )}
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <p className="font-medium">Created:</p>
        <p className="text-muted-foreground">{formatDate(task.createdAt)}</p>
      </div>
      <div>
        <p className="font-medium">Assigned:</p>
        <p className="text-muted-foreground">{formatDate(task.assignedAt)}</p>
      </div>
    </div>
    {task.dueDate && (
      <div>
        <p className="font-medium">Due Date:</p>
        <p className="text-muted-foreground">{formatDate(task.dueDate)}</p>
      </div>
    )}
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1">
        <MessageSquare className="w-3 h-3" />
        <span>{task.commentsCount} comments</span>
      </div>
      <div className="flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        <span>Updated {formatDate(task.updatedAt)}</span>
      </div>
    </div>
  </div>
);

interface EditTaskFormProps {
  task: Task;
  workspaceId: Id<"workspaces">; // Needed for fetching members
  onClose: () => void;
  isVisible: boolean;
}

const EditTaskForm = ({
  task,
  workspaceId,
  onClose,
  isVisible,
}: EditTaskFormProps) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [assignedToId, setAssignedToId] = useState<Id<"members"> | undefined>(
    task.assignedTo?._id,
  );
  // Assuming dueDate is a string or number that can be converted to string for input type="date"
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
  );

  const { mutate: updateTask, isPending } = useUpdateProjectTask();
  const { data: members } = useGetWorkspaceMembers({ workspaceId });

  useEffect(() => {
    if (isVisible) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setAssignedToId(task.assignedTo?._id);
      setDueDate(
        task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      );
    }
  }, [isVisible, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await updateTask({
        taskId: task._id,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assignedToId,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined, // Convert back to timestamp
      });
      toast.success("Task updated successfully!", {
        description: `${title.trim()} has been updated.`,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleClose = () => {
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setAssignedToId(task.assignedTo?._id);
    setDueDate(
      task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    );
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
      <Card className="w-80 shadow-lg border-2 border-border bg-popover">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm">Edit Task</h4>
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
              <Label htmlFor="edit-task-title" className="text-xs font-medium">
                Task Title
              </Label>
              <Input
                id="edit-task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                className="h-8 text-sm"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="edit-task-description"
                className="text-xs font-medium"
              >
                Description
              </Label>
              <Textarea
                id="edit-task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description (optional)"
                className="text-sm resize-none"
                rows={2}
              />
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="edit-task-priority"
                className="text-xs font-medium"
              >
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={(val) => setPriority(val as Task["priority"])}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="edit-task-assignee"
                className="text-xs font-medium"
              >
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

            <div className="space-y-1">
              <Label
                htmlFor="edit-task-dueDate"
                className="text-xs font-medium"
              >
                Due Date
              </Label>
              <Input
                id="edit-task-dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-8 text-sm"
              />
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
                  "Updating..."
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Update
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

export const TaskNode = ({ data }: NodeProps) => {
  const { isHovered, hoverProps } = useHoverActions();
  const [showDeleteTask, setShowDeleteTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false); // New state for inline edit form

  const { mutate: deleteTask, isPending: isDeleting } = useDeleteProjectTask();

  const handleDeleteTask = async () => {
    try {
      await deleteTask({ taskId: data.task._id });
      toast.success("Task deleted successfully!", {
        description: `${data.task.title} has been deleted.`,
      });
      setShowDeleteTask(false);
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleEditTask = () => {
    setShowEditTask(true); // Show the inline edit form
  };

  const handleCloseEditForm = () => {
    setShowEditTask(false); // Close the inline edit form
  };

  return (
    <div className="relative" {...hoverProps}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="min-w-[200px] max-w-[250px] shadow-sm border cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-2">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h6 className="font-medium text-sm truncate flex-1 mr-2">
                      {data.task.title}
                    </h6>
                    <Badge
                      className={`text-xs ${getPriorityColor(data.task.priority)}`}
                    >
                      {data.task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs font-mono">
                      {data.task.taskCode}
                    </Badge>
                    {data.task.assignedTo && (
                      <Avatar className="w-5 h-5">
                        <AvatarImage
                          src={
                            data.task.assignedTo.user.image ||
                            "/placeholder.svg" ||
                            "/placeholder.svg"
                          }
                        />
                        <AvatarFallback className="text-xs">
                          {data.task.assignedTo.user.name
                            ?.charAt(0)
                            .toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {data.task.commentsCount > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{data.task.commentsCount}</span>
                      </div>
                    )}
                    {data.task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(data.task.dueDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Handle
                  type="target"
                  position={data.isHorizontal ? Position.Left : Position.Top}
                  className="w-3 h-3"
                />
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="right" className="w-96">
            <TaskTooltip task={data.task} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Action Overlay */}
      {isHovered &&
        !showEditTask && ( // Hide overlay when edit form is open
          <div
            onMouseEnter={() => {
              // Keep the overlay visible when hovering over it
            }}
            onMouseLeave={() => {
              // This will be handled by the useHoverActions hook
            }}
          >
            <ActionOverlay
              isVisible={isHovered}
              onEdit={handleEditTask}
              onDelete={() => setShowDeleteTask(true)}
              position="top"
            />
          </div>
        )}

      {/* Inline Edit Task Form */}
      <EditTaskForm
        task={data.task}
        workspaceId={data.workspaceId} // Pass workspaceId for members
        onClose={handleCloseEditForm}
        isVisible={showEditTask}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteTask}
        onClose={() => setShowDeleteTask(false)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone:"
        itemName={data.task.title}
        isLoading={isDeleting}
      />
    </div>
  );
};
