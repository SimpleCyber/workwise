"use client";

import { formatDistanceToNow } from "date-fns";
import { Loader, Plus, TriangleAlert, Trash2 } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProjectBoard } from "@/features/projects/api/use-create-project-board";
import { useGetProjectBoards } from "@/features/projects/api/use-get-project-boards";
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info";
import { useRemoveProjectBoard } from "@/features/projects/api/use-remove-project-board";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import type { Id } from "../../../../convex/_generated/dataModel";

const ProjectsWorkspacePage = () => {
  const workspaceId = useWorkspaceId();
  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspaceInfo({
    id: workspaceId,
  });
  const { data: boards, isLoading: boardsLoading } = useGetProjectBoards({
    workspaceId,
  });
  const { mutate: createBoard, isPending: isCreatingBoard } =
    useCreateProjectBoard();
  const { mutate: removeBoard, isPending: isRemovingBoard } =
    useRemoveProjectBoard();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const MAX_NAME_WORDS = 10;
  const MAX_DESCRIPTION_WORDS = 30;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nameWords = name.trim().split(/\s+/).length;
    const descWords = description.trim().split(/\s+/).length;

    if (!name.trim()) return toast.error("Project name is required.");

    if (nameWords > MAX_NAME_WORDS) {
      return toast.error(`Project name must be under ${MAX_NAME_WORDS} words.`);
    }

    if (description.trim() && descWords > MAX_DESCRIPTION_WORDS) {
      return toast.error(
        `Description must be under ${MAX_DESCRIPTION_WORDS} words.`,
      );
    }

    createBoard(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        workspaceId,
      },
      {
        onSuccess: () => {
          toast.success("Project board created successfully!");
          setOpen(false);
          setName("");
          setDescription("");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create project board");
        },
      },
    );
  };

  const handleDeleteBoard = (boardId: Id<"projectBoards">) => {
    if (
      confirm(
        "Are you sure you want to delete this project board and all its contents? This action cannot be undone.",
      )
    ) {
      removeBoard(
        { boardId },
        {
          onSuccess: () => {
            toast.success("Project board deleted successfully!");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to delete project board");
          },
        },
      );
    }
  };

  if (workspaceLoading || boardsLoading) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!workspace) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <TriangleAlert className="size-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Workspace not found.
        </span>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[49px] items-center justify-between border-b bg-white px-4">
        <h1 className="text-lg font-semibold">
          Project Boards - {workspace.name}
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4 mr-2" />
              New Project Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project Board</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    const input = e.target.value;
                    const words = input.trim().split(/\s+/).filter(Boolean);
                    if (words.length <= MAX_NAME_WORDS) {
                      setName(input);
                    } else {
                      toast.error(
                        `Title can't exceed ${MAX_NAME_WORDS} words.`,
                      );
                    }
                  }}
                  placeholder="Enter project name..."
                  disabled={isCreatingBoard}
                />

                <p className="text-xs text-muted-foreground">
                  {name.trim().split(/\s+/).filter(Boolean).length} /{" "}
                  {MAX_NAME_WORDS} words
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    const input = e.target.value;
                    const words = input.trim().split(/\s+/).filter(Boolean);
                    if (words.length <= MAX_DESCRIPTION_WORDS) {
                      setDescription(input);
                    } else {
                      toast.error(
                        `Description can't exceed ${MAX_DESCRIPTION_WORDS} words.`,
                      );
                    }
                  }}
                  placeholder="Enter project description..."
                  disabled={isCreatingBoard}
                />

                <p className="text-xs text-muted-foreground">
                  {description.trim().split(/\s+/).filter(Boolean).length} /{" "}
                  {MAX_DESCRIPTION_WORDS} words
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isCreatingBoard}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingBoard || !name.trim()}
                >
                  {isCreatingBoard ? (
                    <>
                      <Loader className="size-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project Board"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-7xl">
          {!boards || boards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  No project boards yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Create your first project board to start managing team tasks
                </p>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="size-4 mr-2" />
                      Create Your First Project Board
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {boards.map((board) => (
                <Link
                  key={board._id}
                  href={`/projects/${workspaceId}/board/${board._id}`}
                  className="block"
                >
                  <Card className="h-full transition-colors hover:bg-muted/50">
                    <CardHeader className="relative">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{board.name}</CardTitle>
                        <Badge variant="outline" className="text-xs font-mono">
                          {board.boardCode}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.preventDefault(); // Prevent navigation to board page
                            handleDeleteBoard(board._id);
                          }}
                          disabled={isRemovingBoard}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Board</span>
                        </Button>
                      </div>
                      {board.description && (
                        <CardDescription className="line-clamp-2">
                          {board.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Created{" "}
                          {formatDistanceToNow(board.createdAt, {
                            addSuffix: true,
                          })}
                        </span>
                        {board.isStarred && (
                          <span className="text-yellow-500">⭐</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsWorkspacePage;
