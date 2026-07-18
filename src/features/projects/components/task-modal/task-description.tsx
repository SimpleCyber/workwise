"use client";

import { useState } from "react";
import {
  ImageIcon,
  Download,
  Maximize2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useUpdateTaskContent } from "@/features/projects/api/use-update-task-content";
import { useGetWorkspaceMembers } from "@/features/projects/api/use-get-workspace-members";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";
import dynamic from "next/dynamic";
import type { Id } from "../../../../../convex/_generated/dataModel";
import Image from "next/image";

const Editor = dynamic(() => import("@/components/editor"), { ssr: false });
const Renderer = dynamic(() => import("@/components/renderer"), { ssr: false });

interface TaskDescriptionProps {
  task: {
    _id: Id<"projectTasks">;
    description?: string;
    descriptionImages?: string[];
    workspaceId: Id<"workspaces">;
  };
  onImagePreview: (url: string) => void;
}

export const TaskDescription = ({
  task,
  onImagePreview,
}: TaskDescriptionProps) => {
  const [isEditing, setIsEditing] = useState(!task.description);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const { mutate: updateTaskContent, isPending } = useUpdateTaskContent();
  const { mutate: generateUploadUrl } = useGenerateUploadUrl();
  const { data: members } = useGetWorkspaceMembers({
    workspaceId: task.workspaceId,
  });

  const handleUpdate = async ({
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

      setIsEditing(false);
      setEditorKey((prev) => prev + 1);
      toast.success("Description updated successfully!");
    } catch (error) {
      console.error("Error updating description:", error);
      toast.error("Failed to update description");
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
    <div className="flex flex-col space-y-3">
      {/* Description Header */}
      <div className="flex items-center justify-between pointer-events-none">
        <div className="text-sm text-muted-foreground ml-1">Description</div>
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {isEditing ? (
          <div className="rounded-lg border bg-muted/30 ring-1 ring-border/50">
            <Editor
              key={editorKey}
              onSubmit={handleUpdate}
              onCancel={() => {
                if (task.description) {
                  setIsEditing(false);
                }
              }}
              defaultValue={
                task.description ? JSON.parse(task.description) : []
              }
              placeholder="Add a more detailed description..."
              variant="create"
              disabled={isPending}
              members={members}
            />
          </div>
        ) : (
          <div
            className="group relative min-h-[70px] cursor-pointer rounded-lg bg-muted/10 hover:bg-muted/20 p-3 sm:p-4 transition-all border border-border/40 hover:border-border/80 shadow-sm"
            onClick={() => setIsEditing(true)}
          >
            {task.description ? (
              <div className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Renderer value={task.description} />
                </div>

                {/* Attachment Images */}
                {task.descriptionImages &&
                  task.descriptionImages.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        <ImageIcon className="w-3 h-3" />
                        <span>
                          {task.descriptionImages.length} attachment(s)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {task.descriptionImages.map(
                          (imageUrl: string, index: number) => (
                            <div
                              key={index}
                              className="relative group/img aspect-video rounded-lg overflow-hidden border bg-muted shadow-sm hover:shadow-md transition-all ring-1 ring-border/50"
                            >
                              <Image
                                fill
                                src={imageUrl || "/placeholder.svg"}
                                alt={`Attachment ${index + 1}`}
                                className="object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onImagePreview(imageUrl);
                                }}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8 rounded-full shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onImagePreview(imageUrl);
                                  }}
                                >
                                  <Maximize2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8 rounded-full shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadImage(
                                      imageUrl,
                                      `attachment-${index + 1}.jpg`,
                                    );
                                  }}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div onClick={() => setIsEditing(true)}>
                <div className="rounded-lg border bg-muted/10 ring-1 ring-border/50">
                  <Editor
                    key={editorKey}
                    onSubmit={handleUpdate}
                    onCancel={() => {}}
                    defaultValue={[]}
                    placeholder="Add a more detailed description..."
                    variant="create"
                    disabled={isPending}
                    members={members}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
