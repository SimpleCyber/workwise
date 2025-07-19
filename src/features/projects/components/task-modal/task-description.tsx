"use client";

import { useState } from "react";
import { ImageIcon, Download, Maximize2 } from "lucide-react";
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
    <div className="p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Description</h3>
      </div>

      {isEditing ? (
        <div className="h-full">
          <Editor
            key={editorKey}
            onSubmit={handleUpdate}
            onCancel={() => {
              if (task.description) {
                setIsEditing(false);
              }
            }}
            defaultValue={task.description ? JSON.parse(task.description) : []}
            placeholder="Describe this task... You can paste images directly here."
            variant="create"
            disabled={isPending}
          />
        </div>
      ) : (
        <div
          className="min-h-[200px] cursor-pointer hover:bg-gray-50 rounded-lg p-4 transition-colors"
          onClick={() => setIsEditing(true)}
        >
          {task.description ? (
            <div className="space-y-4">
              <Renderer value={task.description} />

              {/* Description Images */}
              {task.descriptionImages && task.descriptionImages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ImageIcon className="w-4 h-4" />
                    <span>
                      {task.descriptionImages.length} image(s) attached
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {task.descriptionImages.map(
                      (imageUrl: string, index: number) => (
                        <div
                          key={index}
                          className="relative group rounded-lg overflow-hidden border bg-gray-50"
                        >
                          <Image
                            width={800}
                            height={600}
                            src={imageUrl || "/placeholder.svg"}
                            alt={`Description image ${index + 1}`}
                            className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onImagePreview(imageUrl);
                            }}
                          />
                          <TooltipProvider>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
                                    <Maximize2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View full size</TooltipContent>
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
                                        `description-image-${index + 1}.jpg`,
                                      );
                                    }}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download image</TooltipContent>
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
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No description yet</p>
              <p className="text-sm">
                Click here to add a description for this task
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
