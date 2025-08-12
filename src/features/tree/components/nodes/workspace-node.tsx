"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, X, Check } from "lucide-react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ActionOverlay, useHoverActions } from "../tree-actions/action-overlay";
import { useCreateProjectBoard } from "../../../projects/api/use-create-project-board";
import { toast } from "sonner";
import type { Id } from "../../../../../convex/_generated/dataModel";

interface CreateProjectFormProps {
  workspaceId: Id<"workspaces">;
  onClose: () => void;
  isVisible: boolean;
}

const CreateProjectForm = ({
  workspaceId,
  onClose,
  isVisible,
}: CreateProjectFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { mutate: createProject, isPending } = useCreateProjectBoard();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        workspaceId,
      });
      toast.success("Project created successfully!", {
        description: `${name.trim()} has been added to your workspace.`,
      });
      setName("");
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project");
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="absolute top-full left-0 mt-2 z-50">
      <Card className="w-80 shadow-lg border-2 border-purple-200 bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm">Create New Project</h4>
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
                className="h-7 px-3 text-xs"
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
                  "Creating..."
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Create
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

export const WorkspaceNode = ({ data }: NodeProps) => {
  const { isHovered, hoverProps } = useHoverActions();
  const [showCreateProject, setShowCreateProject] = useState(false);
  const router = useRouter();

  const handleAddProject = () => {
    setShowCreateProject(true);
  };

  const handleCloseForm = () => {
    setShowCreateProject(false);
  };

  const handleGoToProjects = () => {
    router.push(`/projects/${data.workspaceId}`);
  };

  return (
    <div className="relative" {...hoverProps}>
      <Card
        className={`min-w-[200px] shadow-md border-purple-200 cursor-pointer hover:shadow-lg transition-shadow ${
          data.isActive ? "ring-2 ring-purple-500" : ""
        }`}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3"
              onClick={() => data.onToggle?.(data.workspaceId)}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded ${
                  data.isActive ? "bg-purple-200" : "bg-purple-100"
                }`}
              >
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">{data.name}</h4>
                <Badge variant="outline" className="text-xs mt-1">
                  {data.projectCount} projects
                </Badge>
              </div>
            </div>
          </div>
          <Handle
            type="target"
            position={data.isHorizontal ? Position.Left : Position.Top}
            className="w-3 h-3"
          />
          <Handle
            type="source"
            position={data.isHorizontal ? Position.Right : Position.Bottom}
            className="w-3 h-3"
          />
        </CardContent>
      </Card>

      {isHovered && !showCreateProject && (
        <div>
          <ActionOverlay
            onAdd={handleAddProject}
            onLink={handleGoToProjects}
            position="top"
            isVisible={isHovered}
          />
        </div>
      )}

      <CreateProjectForm
        workspaceId={data.workspaceId}
        onClose={handleCloseForm}
        isVisible={showCreateProject}
      />
    </div>
  );
};
