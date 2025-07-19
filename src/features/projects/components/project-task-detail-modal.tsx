"use client";

import { format } from "date-fns";
import {
  Save,
  X,
  MessageSquare,
  Edit2,
  Trash2,
  ArrowUpDown,
  ImageIcon,
  Download,
  Maximize2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import dynamic from "next/dynamic";
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
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetWorkspaceMembers } from "@/features/projects/api/use-get-workspace-members";
import { useUpdateProjectTask } from "@/features/projects/api/use-update-project-task";
import { useUpdateTaskContent } from "@/features/projects/api/use-update-task-content";
import {
  useGetTaskComments,
  useCreateTaskComment,
  useUpdateTaskComment,
  useDeleteTaskComment,
} from "@/features/projects/api/use-task-comments";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";
import type { Id } from "../../../../convex/_generated/dataModel";

// Dynamic import for Editor to avoid SSR issues
const Editor = dynamic(() => import("@/components/editor"), {
  ssr: false,
});

// Dynamic import for Renderer to display rich content
const Renderer = dynamic(() => import("@/components/renderer"), {
  ssr: false,
});

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
    images?: Id<"_storage">[];
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
    descriptionImages?: string[];
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

  // Description editor state
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionEditorKey, setDescriptionEditorKey] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Comments state
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [editingComment, setEditingComment] =
    useState<Id<"taskComments"> | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  const { mutate: updateTask, isPending } = useUpdateProjectTask();
  const { mutate: updateTaskContent, isPending: isUpdatingContent } =
    useUpdateTaskContent();
  const { data: members } = useGetWorkspaceMembers({
    workspaceId: task?.workspaceId,
  });
  const { mutate: generateUploadUrl } = useGenerateUploadUrl();

  // Comments hooks
  const { data: comments, isLoading: commentsLoading } = useGetTaskComments(
    task?._id,
    sortOrder,
  );
  const createComment = useCreateTaskComment();
  const updateComment = useUpdateTaskComment();
  const deleteComment = useDeleteTaskComment();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
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

  const handleUpdateDescription = async ({
    body,
    image,
  }: {
    body: string;
    image: File | null;
  }) => {
    if (!task) return;

    try {
      let storageId: Id<"_storage"> | undefined;

      if (image) {
        // Show loading toast for image upload
        const uploadToast = toast.loading("Uploading image...");

        try {
          const url = await generateUploadUrl({}, { throwError: true });
          if (!url) throw new Error("Failed to get upload URL");

          const result = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": image.type },
            body: image,
          });

          if (!result.ok) throw new Error("Failed to upload image");

          const { storageId: uploadedStorageId } = await result.json();
          storageId = uploadedStorageId;

          toast.dismiss(uploadToast);
          toast.success("Image uploaded successfully!");
        } catch (error) {
          toast.dismiss(uploadToast);
          throw error;
        }
      }

      await updateTaskContent({
        taskId: task._id,
        description: body,
        image: storageId,
      });

      setIsEditingDescription(false);
      setDescriptionEditorKey((prev) => prev + 1);
      toast.success("Description updated successfully!");
    } catch (error) {
      console.error("Error updating description:", error);
      toast.error("Failed to update description");
    }
  };

  const handleSubmitComment = async ({
    body,
    image,
  }: {
    body: string;
    image: File | null;
  }) => {
    if (!task) return;

    try {
      let storageId: Id<"_storage"> | undefined;

      if (image) {
        const uploadToast = toast.loading("Uploading image...");

        try {
          const url = await generateUploadUrl({}, { throwError: true });
          if (!url) throw new Error("Failed to get upload URL");

          const result = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": image.type },
            body: image,
          });

          if (!result.ok) throw new Error("Failed to upload image");

          const { storageId: uploadedStorageId } = await result.json();
          storageId = uploadedStorageId;

          toast.dismiss(uploadToast);
        } catch (error) {
          toast.dismiss(uploadToast);
          throw error;
        }
      }

      await createComment.mutate({
        taskId: task._id,
        content: body,
        image: storageId,
      });

      setEditorKey((prev) => prev + 1);
      toast.success("Comment added successfully!");
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleUpdateComment = async (
    commentId: Id<"taskComments">,
    { body, image }: { body: string; image: File | null },
  ) => {
    try {
      let storageId: Id<"_storage"> | undefined;

      if (image) {
        const uploadToast = toast.loading("Uploading image...");

        try {
          const url = await generateUploadUrl({}, { throwError: true });
          if (!url) throw new Error("Failed to get upload URL");

          const result = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": image.type },
            body: image,
          });

          if (!result.ok) throw new Error("Failed to upload image");

          const { storageId: uploadedStorageId } = await result.json();
          storageId = uploadedStorageId;

          toast.dismiss(uploadToast);
        } catch (error) {
          toast.dismiss(uploadToast);
          throw error;
        }
      }

      await updateComment.mutate({
        commentId,
        content: body,
        image: storageId,
      });

      setEditingComment(null);
      toast.success("Comment updated successfully!");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId: Id<"taskComments">) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await deleteComment.mutate({ commentId });
      toast.success("Comment deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const handleImagePreview = (imageUrl: string) => {
    setImagePreview(imageUrl);
  };

  const handleDownloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Image downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  if (!task) return null;

  return (
    <TooltipProvider>
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
                <div className="flex items-center justify-between">
                  <Label>Description</Label>
                  {!isEditingDescription && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingDescription(true)}
                      className="h-7 px-2 text-xs"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>

                {isEditingDescription ? (
                  <div className="space-y-2">
                    <Editor
                      key={descriptionEditorKey}
                      onSubmit={handleUpdateDescription}
                      onCancel={() => setIsEditingDescription(false)}
                      defaultValue={
                        task.description ? JSON.parse(task.description) : []
                      }
                      placeholder="
                      [Directly Paste the image Screenshot]"
                      variant="create"
                      disabled={isUpdatingContent}
                    />
                  </div>
                ) : (
                  <div className="min-h-[100px] border rounded-lg p-3 bg-muted/30">
                    {task.description ? (
                      <div className="space-y-3">
                        <Renderer value={task.description} />
                        {/* Enhanced Description Images Display */}
                        {task.descriptionImages &&
                          task.descriptionImages.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ImageIcon className="w-4 h-4" />
                                <span>
                                  {task.descriptionImages.length} image(s)
                                  attached
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {task.descriptionImages.map(
                                  (imageUrl: string, index: number) => (
                                    <div
                                      key={index}
                                      className="relative group rounded-lg overflow-hidden border bg-muted/20"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={imageUrl || "/placeholder.svg"}
                                        alt={`Description image ${index + 1}`}
                                        className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() =>
                                          handleImagePreview(imageUrl)
                                        }
                                      />
                                      {/* Image Actions Overlay */}
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={() =>
                                                handleImagePreview(imageUrl)
                                              }
                                            >
                                              <Maximize2 className="w-4 h-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>View full size</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={() =>
                                                handleDownloadImage(
                                                  imageUrl,
                                                  `task-${task.taskCode}-image-${index + 1}.jpg`,
                                                )
                                              }
                                            >
                                              <Download className="w-4 h-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Download image</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No description provided. Click Edit to add one.
                      </p>
                    )}
                  </div>
                )}
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
                              <span>
                                {member.user?.name || "Unnamed Member"}
                              </span>
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
                              {task.createdBy.user.name
                                ?.charAt(0)
                                .toUpperCase()}
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
                    <Editor
                      key={editorKey}
                      onSubmit={handleSubmitComment}
                      placeholder="Write a comment..."
                      variant="create"
                    />
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
                      comments?.map((comment: any) => (
                        <div key={comment._id} className="flex gap-3 group">
                          <Avatar className="w-8 h-8 mt-1">
                            <AvatarImage
                              src={
                                comment.member?.user?.image ||
                                "/placeholder.svg"
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
                                <Editor
                                  onSubmit={(data) =>
                                    handleUpdateComment(comment._id, data)
                                  }
                                  onCancel={() => setEditingComment(null)}
                                  defaultValue={JSON.parse(comment.content)}
                                  variant="update"
                                />
                              </div>
                            ) : (
                              <>
                                <div className="bg-muted/30 rounded-lg p-3">
                                  <Renderer value={comment.content} />
                                  {/* Enhanced Comment Image Display */}
                                  {comment.image && (
                                    <div className="mt-3">
                                      <div className="relative group max-w-[300px] rounded-lg overflow-hidden border">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={
                                            comment.imageUrl ||
                                            "/placeholder.svg"
                                          }
                                          alt="Comment attachment"
                                          className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() =>
                                            handleImagePreview(comment.imageUrl)
                                          }
                                        />
                                        {/* Image Actions Overlay */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() =>
                                                  handleImagePreview(
                                                    comment.imageUrl,
                                                  )
                                                }
                                              >
                                                <Maximize2 className="w-4 h-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>View full size</p>
                                            </TooltipContent>
                                          </Tooltip>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() =>
                                                  handleDownloadImage(
                                                    comment.imageUrl,
                                                    `comment-image-${comment._id}.jpg`,
                                                  )
                                                }
                                              >
                                                <Download className="w-4 h-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Download image</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Comment Actions */}
                                {comment.member?.userId && (
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setEditingComment(comment._id)
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

      {/* Image Preview Modal */}
      {imagePreview && (
        <Dialog
          open={!!imagePreview}
          onOpenChange={() => setImagePreview(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setImagePreview(null)}
              >
                <X className="w-4 h-4" />
              </Button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Full size preview"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
};
