"use client";

import { format } from "date-fns";
import {
  Save,
  X,
  MessageSquare,
  Send,
  Edit2,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
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
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetWorkspaceMembers } from "@/features/projects/api/use-get-workspace-members";
import { useUpdateProjectTask } from "@/features/projects/api/use-update-project-task";
import {
  useGetTaskComments,
  useCreateTaskComment,
  useUpdateTaskComment,
  useDeleteTaskComment,
} from "@/features/projects/api/use-task-comments";
import { RichTextEditor } from "@/components/rich-text-editor";
import { RichTextDisplay } from "@/components/rich-text-display";
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
  }>;
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
  >(undefined);

  // Comments state
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] =
    useState<Id<"taskComments"> | null>(null);
  const [editContent, setEditContent] = useState("");

  const { mutate: updateTask, isPending } = useUpdateProjectTask();
  const { data: members } = useGetWorkspaceMembers({
    workspaceId: task?.workspaceId,
  });

  // Comments hooks
  const { data: comments, isLoading: commentsLoading } = useGetTaskComments(
    task?._id, // Remove the fallback empty string
    sortOrder,
  );
  const createComment = useCreateTaskComment();
  const updateComment = useUpdateTaskComment();
  const deleteComment = useDeleteTaskComment();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setAssignedToId(task.assignedToId);
      setDueDate(task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : "");
      setCurrentListId(task.listId);
    }
  }, [task]);

  const handleSave = () => {
    if (!task || !title.trim() || !currentListId) return;

    const selectedList = lists.find((list) => list._id === currentListId);
    const isCompleted = selectedList?.name === "Done";

    const updates: any = {
      taskId: task._id,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assignedToId,
      listId: currentListId,
      isCompleted,
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

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !task) return;
    try {
      await createComment({
        taskId: task._id,
        content: newComment,
      });
      setNewComment("");
      toast.success("Comment added successfully!");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleEditComment = (
    commentId: Id<"taskComments">,
    currentContent: string,
  ) => {
    setEditingComment(commentId);
    setEditContent(currentContent);
  };

  const handleUpdateComment = async (commentId: Id<"taskComments">) => {
    if (!editContent.trim()) return;
    try {
      await updateComment({
        commentId,
        content: editContent,
      });
      setEditingComment(null);
      setEditContent("");
      toast.success("Comment updated successfully!");
    } catch (error) {
      toast.error("Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId: Id<"taskComments">) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteComment({ commentId });
      toast.success("Comment deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    // This would integrate with your file upload service
    // For now, return a placeholder
    return "/placeholder.svg";
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Task Details */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(
                    value: "low" | "medium" | "high" | "urgent",
                  ) => setPriority(value)}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created by:</span>
                  <div className="flex items-center gap-2 mt-1">
                    {task.createdBy?.user && (
                      <>
                        <Avatar className="w-5 h-5">
                          <AvatarImage
                            src={
                              task.createdBy.user.image || "/placeholder.svg"
                            }
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
              <Button
                onClick={handleSave}
                disabled={isPending || !title.trim()}
              >
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

          {/* Right Column - Comments Section */}
          <div className="space-y-4">
            <Separator className="lg:hidden" />

            {/* Comments Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Comments ({comments?.length || 0})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="flex items-center gap-2"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    {sortOrder === "asc" ? "Oldest First" : "Newest First"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* New Comment Form */}
                <div className="space-y-3">
                  <RichTextEditor
                    value={newComment}
                    onChange={setNewComment}
                    onImageUpload={handleImageUpload}
                    placeholder="Write a comment..."
                    className="min-h-[120px]"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim()}
                      className="flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Add Comment
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Comments List */}
                <div className="space-y-4">
                  {commentsLoading ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Loading comments...
                    </div>
                  ) : comments?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                  ) : (
                    comments?.map((comment) => (
                      <div key={comment._id} className="flex gap-3 group">
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarImage
                            src={
                              comment.member?.user?.image || "/placeholder.svg"
                            }
                          />
                          <AvatarFallback className="text-xs">
                            {comment.member?.user?.name
                              ?.charAt(0)
                              .toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.member?.user?.name || "Unknown User"}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {comment.member?.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(comment.createdAt),
                                {
                                  addSuffix: true,
                                },
                              )}
                            </span>
                            {comment.isEdited && (
                              <Badge variant="secondary" className="text-xs">
                                edited
                              </Badge>
                            )}
                          </div>
                          {editingComment === comment._id ? (
                            <div className="space-y-2">
                              <RichTextEditor
                                value={editContent}
                                onChange={setEditContent}
                                onImageUpload={handleImageUpload}
                                className="min-h-[80px]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateComment(comment._id)
                                  }
                                  disabled={!editContent.trim()}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingComment(null);
                                    setEditContent("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="bg-muted/30 rounded-lg p-3">
                                <RichTextDisplay content={comment.content} />
                              </div>
                              {/* Comment Actions - Only show for comment author */}
                              {comment.member?.userId && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleEditComment(
                                        comment._id,
                                        comment.content,
                                      )
                                    }
                                    className="h-7 px-2 text-xs"
                                  >
                                    <Edit2 className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteComment(comment._id)
                                    }
                                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
