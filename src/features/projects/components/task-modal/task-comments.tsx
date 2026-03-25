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
import { useGetWorkspaceMembers } from "@/features/projects/api/use-get-workspace-members";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";
import { useConfirm } from "@/hooks/use-confirm";
import dynamic from "next/dynamic";
import type { Id } from "../../../../../convex/_generated/dataModel";

const Editor = dynamic(() => import("@/components/editor"), { ssr: false });
const Renderer = dynamic(() => import("@/components/renderer"), { ssr: false });

interface TaskCommentsProps {
  task: {
    _id: Id<"projectTasks">;
    workspaceId: Id<"workspaces">;
  };
  onImagePreview: (url: string) => void;
}

export const TaskComments = ({ task, onImagePreview }: TaskCommentsProps) => {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editingComment, setEditingComment] =
    useState<Id<"taskComments"> | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  const { data: comments, isLoading } = useGetTaskComments(task._id, sortOrder);
  const createComment = useCreateTaskComment();
  const updateComment = useUpdateTaskComment();
  const deleteComment = useDeleteTaskComment();
  const { mutate: generateUploadUrl } = useGenerateUploadUrl();
  const { data: members } = useGetWorkspaceMembers({
    workspaceId: task.workspaceId,
  });

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
    <div className="flex flex-col space-y-6">
      <ConfirmDialog />
      {/* Activity Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
          <MessageSquare className="w-4 h-4" />
          <h3>Activity</h3>
          <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {comments?.length || 0}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="h-7 px-2 text-[11px] font-medium hover:bg-muted"
        >
          <ArrowUpDown className="w-3 h-3 mr-1.5" />
          {sortOrder === "asc" ? "Oldest first" : "Newest first"}
        </Button>
      </div>

      {/* New Comment Input - At the top, like Jira */}
      <div className="flex gap-3 group/editor">
        <Avatar className="w-8 h-8 rounded-full border shadow-sm shrink-0">
          {/* Use current user's avatar if possible, but here we just show a placeholder or fixed avatar shell */}
          <AvatarFallback className="text-[10px] bg-secondary">
            ME
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="rounded-lg border bg-background hover:border-border/80 transition-all shadow-sm ring-1 ring-border/50 focus-within:ring-primary/20 focus-within:border-primary/30">
            <Editor
              key={editorKey}
              onSubmit={handleSubmitComment}
              placeholder="Add a comment..."
              variant="create"
              members={members}
            />
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground animate-pulse">
              Loading activity...
            </span>
          </div>
        ) : comments?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/5 rounded-xl border-2 border-dashed border-muted-foreground/5">
            <MessageSquare className="w-10 h-10 mb-3 opacity-10 text-primary" />
            <p className="text-sm font-medium text-muted-foreground/80">
              No activity yet
            </p>
            <p className="text-xs text-muted-foreground/60 max-w-[200px] mt-1 line-height-relaxed">
              Start the conversation by adding a comment above.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments?.map((comment: any) => (
              <div key={comment._id} className="flex gap-3 group relative">
                <Avatar className="w-8 h-8 rounded-full border shadow-sm shrink-0 mt-0.5">
                  <AvatarImage
                    src={comment.member?.user?.image || "/placeholder.svg"}
                  />
                  <AvatarFallback className="text-[10px] bg-secondary">
                    {comment.member?.user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 flex flex-col space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground/90">
                      {comment.member?.user?.name || "Unknown User"}
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded uppercase tracking-tighter font-semibold">
                      {comment.member?.role}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {comment.isEdited && (
                      <span className="text-[10px] text-muted-foreground italic">
                        (edited)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2">
                    {editingComment === comment._id ? (
                      <div className="rounded-lg border bg-muted/30 ring-1 ring-border/50">
                        <Editor
                          onSubmit={(data) =>
                            handleUpdateComment(comment._id, data)
                          }
                          onCancel={() => setEditingComment(null)}
                          defaultValue={JSON.parse(comment.content)}
                          variant="update"
                          members={members}
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-foreground/80 leading-relaxed break-words py-1">
                        <Renderer value={comment.content} />
                        {comment.image && (
                          <div className="mt-3 max-w-sm">
                            <div className="relative group/img aspect-auto rounded-lg overflow-hidden border bg-muted shadow-sm hover:shadow-md transition-all ring-1 ring-border/50">
                              <Image
                                src={comment.imageUrl || "/placeholder.svg"}
                                width={600}
                                height={400}
                                alt="Comment attachment"
                                className="w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => onImagePreview(comment.imageUrl)}
                              />
                              <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 translate-y-full group-hover/img:translate-y-0 transition-transform flex items-center justify-end gap-2">
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-7 w-7 rounded-sm"
                                  onClick={() =>
                                    onImagePreview(comment.imageUrl)
                                  }
                                >
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-7 w-7 rounded-sm"
                                  onClick={() =>
                                    handleDownloadImage(
                                      comment.imageUrl,
                                      `comment-image-${comment._id}.jpg`,
                                    )
                                  }
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {!editingComment && comment.member?.userId && (
                      <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                        <button
                          onClick={() => setEditingComment(comment._id)}
                          className="text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-[11px] font-semibold text-muted-foreground hover:text-destructive transition-colors hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
