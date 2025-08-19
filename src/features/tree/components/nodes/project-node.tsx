"use client";
import { useRouter } from "next/navigation";

import type React from "react";

import { useState } from "react";
import { Goal, ExternalLink, X, Check } from "lucide-react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ActionOverlay, useHoverActions } from "../tree-actions/action-overlay";
import { DeleteConfirmationModal } from "../tree-actions/delete-confirmation-modal";
import { useRemoveProjectBoard } from "../../../projects/api/use-remove-project-board";
import { useUpdateProjectBoard } from "../../../projects/api/use-update-project-board";
import { toast } from "sonner";
import type { Id } from "../../../../../convex/_generated/dataModel";

// Add this import at the top
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

interface EditProjectFormProps {
  boardId: Id<"projectBoards">;
  initialData: {
    name: string;
    description?: string;
  };
  onClose: () => void;
  isVisible: boolean;
}

const EditProjectForm = ({
  boardId,
  initialData,
  onClose,
  isVisible,
}: EditProjectFormProps) => {
  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description || "");
  const { mutate: updateProject, isPending } = useUpdateProjectBoard();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await updateProject({
        boardId,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      toast.success("Project updated successfully!", {
        description: `${name.trim()} has been updated.`,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error("Failed to update project. Please try again.");
    }
  };

  const handleClose = () => {
    setName(initialData.name);
    setDescription(initialData.description || "");
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
      <Card className="w-80 shadow-lg border-2 border-green-200 bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm">Edit Project</h4>
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
              <Label htmlFor="project-name" className="text-xs font-medium">
                Project Name
              </Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name"
                className="h-8 text-sm"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="project-description"
                className="text-xs font-medium"
              >
                Description
              </Label>
              <Textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter project description (optional)"
                className="text-sm resize-none"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="h-7 px-3 text-xs bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending || !name.trim()}
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

export const ProjectNode = ({ data }: NodeProps) => {
  const { isHovered, hoverProps } = useHoverActions();
  const [showEditProject, setShowEditProject] = useState(false);
  const [showDeleteProject, setShowDeleteProject] = useState(false);
  const router = useRouter();
  const { mutate: deleteProject, isPending: isDeleting } =
    useRemoveProjectBoard();

  // Add this inside the ProjectNode component, right after the existing hooks
  const lists = useQuery(api.projects.getProjectLists, {
    boardId: data.projectId,
  });

  const holdTaskList = lists?.find((list) => list.name === "Hold Task");

  const holdTasks = useQuery(
    api.projects.getProjectTasks,
    holdTaskList ? { listId: holdTaskList._id } : "skip",
  );

  const holdTasksCount = holdTasks?.length || 0;
  const hasHoldTasks = holdTasksCount > 0;

  const handleGoToProject = () => {
    router.push(`/projects/${data.workspaceId}/board/${data.projectId}`);
  };

  // Check if there are tasks in hold - you need to pass this in data prop
  // const hasHoldTasks = data.holdTasksCount && data.holdTasksCount > 0

  // Check if there are tasks in hold - assuming this is passed in data prop
  // const hasHoldTasks = data.holdTasksCount > 0

  // Define color schemes based on hold tasks
  const colorScheme = hasHoldTasks
    ? {
        border: "border-red-400",
        ring: "ring-red-500",
        iconBg: data.isActive ? "bg-red-200" : "bg-red-100",
        iconColor: "text-red-600",
        // pulseIconBg: "bg-red-100 animate-flicker-bg-red",
      }
    : {
        border: "border-green-400",
        ring: "ring-green-500",
        iconBg: data.isActive ? "bg-green-200" : "bg-green-100",
        iconColor: "text-green-600",
        // pulseIconBg: "bg-green-100 animate-flicker-bg",
      };

  const handleDeleteProject = async () => {
    try {
      await deleteProject({ boardId: data.projectId });
      toast.success("Project deleted successfully!", {
        description: `${data.name} has been deleted.`,
      });
      setShowDeleteProject(false);
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleEditProject = () => {
    setShowEditProject(true);
  };

  const handleCloseEditForm = () => {
    setShowEditProject(false);
  };

  return (
    <div className="relative" {...hoverProps}>
      <div className="flex flex-col items-center">
        <Card
          onDoubleClick={handleGoToProject}
          className={`shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 ${hasHoldTasks ? "border-red-400" : "border-green-400"} ${
            data.isListsExpanded ? "w-20 h-20 animate-pulse" : "w-16 h-16"
          } ${data.isActive ? `ring-2 ${hasHoldTasks ? "ring-red-500" : "ring-green-500"}` : ""} relative`}
          onClick={() => data.onToggleLists?.(data.projectId)}
        >
          <CardContent className="flex items-center justify-center h-full p-2">
            {!data.isListsExpanded ? (
              <div className="flex items-center justify-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded ${
                    hasHoldTasks
                      ? data.isActive
                        ? "bg-red-200"
                        : "bg-red-100"
                      : data.isActive
                        ? "bg-green-200"
                        : "bg-green-100"
                  }`}
                >
                  <Goal
                    className={`w-5 h-5 ${hasHoldTasks ? "text-red-600" : "text-green-600"}`}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <div className="animate-bounce">
                  <div
                  // className={`flex items-center justify-center w-8 h-8 rounded ${hasHoldTasks ? "bg-red-100" : "bg-green-100"} animate-flicker-bg`}
                  >
                    <Goal
                      className={`w-5 h-5 ${hasHoldTasks ? "text-red-600" : "text-green-600"}`}
                    />
                  </div>
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
          <p className="text-xs font-medium text-gray-700">{data.name}</p>
          <div className="flex flex-col items-center gap-1 mt-1">
            <Badge variant="outline" className="text-xs font-mono">
              {data.boardCode}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {data.totalTasks} tasks
            </Badge>

            {data.isListsExpanded && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  data.onProjectClick(data.projectId);
                }}
                className="text-xs mt-1"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Open
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Action Overlay */}
      {isHovered && !showEditProject && (
        <div
          onMouseEnter={() => {
            // Keep the overlay visible when hovering over it
          }}
          onMouseLeave={() => {
            // This will be handled by the useHoverActions hook
          }}
        >
          <ActionOverlay
            onEdit={handleEditProject}
            onDelete={() => setShowDeleteProject(true)}
            onLink={handleGoToProject}
            position="top"
            isVisible={isHovered}
          />
        </div>
      )}

      {/* Inline Edit Project Form */}
      <EditProjectForm
        boardId={data.projectId}
        initialData={{
          name: data.name,
          description: data.description,
        }}
        onClose={handleCloseEditForm}
        isVisible={showEditProject}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteProject}
        onClose={() => setShowDeleteProject(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone and will delete all lists and tasks within this project:"
        itemName={data.name}
        isLoading={isDeleting}
      />
    </div>
  );
};
