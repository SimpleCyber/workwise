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
    if (!confirm("Are you sure you want to delete this comment?")) return;

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
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h3 className="text-lg font-semibold">
            Comments ({comments?.length || 0})
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="flex items-center gap-2"
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortOrder === "asc" ? "Oldest First" : "Newest First"}
        </Button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto space-y-6 mb-6">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Loading comments...
          </div>
        ) : comments?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg mb-2">Start the conversation</p>
            <p className="text-sm">Add the first comment to this task</p>
          </div>
        ) : (
          comments?.map((comment: any) => (
            <div key={comment._id} className="flex gap-3 group">
              <Avatar className="w-8 h-8 mt-1 flex-shrink-0">
                <AvatarImage
                  src={comment.member?.user?.image || "/placeholder.svg"}
                />
                <AvatarFallback className="text-xs">
                  {comment.member?.user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {comment.member?.user?.name || "Unknown User"}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {comment.member?.role}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {comment.isEdited && (
                    <Badge variant="secondary" className="text-xs">
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
                    <div className="bg-gray-50 rounded-lg p-3">
                      <Renderer value={comment.content} />

                      {comment.image && (
                        <div className="mt-3">
                          <div className="relative group max-w-sm rounded-lg overflow-hidden border">
                            <Image
                              src={comment.imageUrl || "/placeholder.svg"}
                              alt="Comment attachment"
                              className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => onImagePreview(comment.imageUrl)}
                            />
                            <TooltipProvider>
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() =>
                                        onImagePreview(comment.imageUrl)
                                      }
                                    >
                                      <Maximize2 className="w-4 h-4" />
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
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Download image
                                  </TooltipContent>
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
                          className="h-7 px-2 text-xs"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment._id)}
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
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

      {/* New Comment Form - Always at bottom */}
      <div className="border-t pt-4">
        <Editor
          key={editorKey}
          onSubmit={handleSubmitComment}
          placeholder="Write a comment..."
          variant="create"
        />
      </div>
    </div>
  );
};
