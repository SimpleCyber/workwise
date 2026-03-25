"use client";

import Image from "next/image";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  ArrowUpDown,
  Edit2,
  Trash2,
  Download,
  Maximize2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  useGetTaskComments,
  useCreateTaskComment,
  useUpdateTaskComment,
  useDeleteTaskComment,
} from "@/features/projects/api/use-task-comments";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";
import { useConfirm } from "@/hooks/use-confirm";
import dynamic from "next/dynamic";
import type { Id } from "../../../../../convex/_generated/dataModel";

const Editor = dynamic(() => import("@/components/editor"), { ssr: false });
const Renderer = dynamic(() => import("@/components/renderer"), { ssr: false });

interface TaskCommentsProps {
  task: {
    _id: Id<"projectTasks">;
  };
  onImagePreview: (url: string) => void;
}

export const TaskComments = ({ task, onImagePreview }: TaskCommentsProps) => {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [editingComment, setEditingComment] =
    useState<Id<"taskComments"> | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  const { data: comments, isLoading } = useGetTaskComments(task._id, sortOrder);
  const createComment = useCreateTaskComment();
  const updateComment = useUpdateTaskComment();
  const deleteComment = useDeleteTaskComment();
  const { mutate: generateUploadUrl } = useGenerateUploadUrl();

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "This action cannot be undone.",
  );

  const handleSubmitComment = async ({
    body,
    image,
  }: {
    body: string;
    image: File | null;
  }) => {
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
    const ok = await confirm();

    if (!ok) return;

    try {
      await deleteComment.mutate({ commentId });
      toast.success("Comment deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
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

  return (
    <div className="flex flex-col">
      <ConfirmDialog />
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50/50 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          <h3 className="font-medium">Activity ({comments?.length || 0})</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="flex items-center gap-1 text-xs"
        >
          <ArrowUpDown className="w-3 h-3" />
          {sortOrder === "asc" ? "Oldest" : "Newest"}
        </Button>
      </div>

      {/* Comments List */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Loading comments...
          </div>
        ) : comments?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : (
          comments?.map((comment: any) => (
            <div key={comment._id} className="flex gap-2 group">
              <Avatar className="w-6 h-6 mt-1 flex-shrink-0">
                <AvatarImage
                  src={comment.member?.user?.image || "/placeholder.svg"}
                />
                <AvatarFallback className="text-xs">
                  {comment.member?.user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-xs">
                    {comment.member?.user?.name || "Unknown User"}
                  </span>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {comment.member?.role}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {comment.isEdited && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      edited
                    </Badge>
                  )}
                </div>

                {editingComment === comment._id ? (
                  <Editor
                    onSubmit={(data) => handleUpdateComment(comment._id, data)}
                    onCancel={() => setEditingComment(null)}
                    defaultValue={JSON.parse(comment.content)}
                    variant="update"
                  />
                ) : (
                  <>
                    <div className="bg-gray-50 rounded p-2 text-sm break-words max-h-400px max-w-full overflow-auto">
                      <Renderer value={comment.content} />
                      {comment.image && (
                        <div className="mt-2 max-w-full">
                          <div className="relative group max-w-full rounded overflow-hidden border">
                            <Image
                              src={comment.imageUrl || "/placeholder.svg"}
                              width={300}
                              height={200}
                              alt="Comment attachment"
                              className="w-full h-auto max-w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => onImagePreview(comment.imageUrl)}
                            />
                            <TooltipProvider>
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() =>
                                        onImagePreview(comment.imageUrl)
                                      }
                                    >
                                      <Maximize2 className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    View full size
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
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Download</TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </div>
                        </div>
                      )}
                    </div>

                    {comment.member?.userId && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingComment(comment._id)}
                          className="h-6 px-2 text-xs"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment._id)}
                          className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
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

      {/* New Comment Form */}
      <div className="border-t p-4 bg-gray-50/30 sticky bottom-0">
        <div className="max-w-full overflow-hidden">
          <Editor
            key={editorKey}
            onSubmit={handleSubmitComment}
            placeholder="Add a comment..."
            variant="create"
          />
        </div>
      </div>
    </div>
  );
};
