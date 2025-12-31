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
    <div className="p-4 max-h-[400px] overflow-y-auto">
      {/* Collapsible Header */}
      <div className="flex items-center justify-between mb-3 sticky top-0 bg-background z-10 pb-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          Description
        </button>
        {!isEditing && task.description && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-xs"
          >
            Edit
          </Button>
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="space-y-3">
          {isEditing ? (
            <div className="max-w-full overflow-hidden">
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
                placeholder="Add a description..."
                variant="create"
                disabled={isPending}
              />
            </div>
          ) : (
            <div
              className="min-h-[60px] max-w-full cursor-pointer hover:bg-accent rounded p-3 transition-colors break-words overflow-auto"
              onClick={() => setIsEditing(true)}
            >
              {task.description ? (
                <div className="space-y-3">
                  <Renderer value={task.description} />

                  {/* Description Images */}
                  {task.descriptionImages &&
                    task.descriptionImages.length > 0 && (
                      <div className="space-y-2 max-w-full">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ImageIcon className="w-3 h-3" />
                          <span>
                            {task.descriptionImages.length} attachment(s)
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-w-full">
                          {task.descriptionImages.map(
                            (imageUrl: string, index: number) => (
                              <div
                                key={index}
                                className="relative group rounded overflow-hidden border bg-muted max-w-full"
                              >
                                <Image
                                  width={200}
                                  height={120}
                                  src={imageUrl || "/placeholder.svg"}
                                  alt={`Attachment ${index + 1}`}
                                  className="w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onImagePreview(imageUrl);
                                  }}
                                />
                                <TooltipProvider>
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onImagePreview(imageUrl);
                                          }}
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
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadImage(
                                              imageUrl,
                                              `attachment-${index + 1}.jpg`,
                                            );
                                          }}
                                        >
                                          <Download className="w-3 h-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Download</TooltipContent>
                                    </Tooltip>
                                  </div>
                                </TooltipProvider>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">Add a description...</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
