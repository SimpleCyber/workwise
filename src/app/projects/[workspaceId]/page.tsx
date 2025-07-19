"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Loader,
  Plus,
  TriangleAlert,
  Trash2,
  Star,
  Calendar,
  FileText,
} from "lucide-react";
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
            toast.error("Only admins can delete the project");
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
    <div className="flex h-full flex-col bg-slate-50/30">
      {/* Keep header unchanged */}
      <div className="flex h-[49px] items-center justify-between border-b bg-white px-4">
        <h1 className="text-lg font-semibold">
          Project Boards - {workspace.name}
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-gray-600 hover:bg-gray-700 text-white shadow-sm"
            >
              <Plus className="size-4 mr-2" />
              New Project Board
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Create New Project Board
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-slate-700"
                >
                  Project Name
                </Label>
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
                        `Title can not exceed ${MAX_NAME_WORDS} words.`,
                      );
                    }
                  }}
                  placeholder="Enter project name..."
                  disabled={isCreatingBoard}
                  className="h-11 border-slate-200 focus:border-gray-500 focus:ring-gray-500/20"
                />
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <FileText className="size-3" />
                  {name.trim().split(/\s+/).filter(Boolean).length} /{" "}
                  {MAX_NAME_WORDS} words
                </p>
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-slate-700"
                >
                  Description (Optional)
                </Label>
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
                        `Description can nott exceed ${MAX_DESCRIPTION_WORDS} words.`,
                      );
                    }
                  }}
                  placeholder="Enter project description..."
                  disabled={isCreatingBoard}
                  className="min-h-[100px] border-slate-200 focus:border-gray-500 focus:ring-gray-500/20 resize-none"
                />
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <FileText className="size-3" />
                  {
                    description.trim().split(/\s+/).filter(Boolean).length
                  } / {MAX_DESCRIPTION_WORDS} words
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isCreatingBoard}
                  className="px-6 border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingBoard || !name.trim()}
                  className="px-6 bg-gray-600 hover:bg-gray-700 text-white shadow-sm"
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

      <div className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          {!boards || boards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus className="size-8 text-gray-600" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-3">
                  No project boards yet
                </h3>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Create your first project board to start organizing and
                  managing your team's tasks and workflows
                </p>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gray-600 hover:bg-gray-700 text-white shadow-sm px-6 py-3 h-auto">
                      <Plus className="size-4 mr-2" />
                      Create Your First Project Board
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {boards.map((board) => (
                <div key={board._id} className="group relative">
                  <Link
                    href={`/projects/${workspaceId}/board/${board._id}`}
                    className="block"
                  >
                    <Card className="h-full transition-all duration-200 hover:shadow-lg hover:shadow-gray-100/50 hover:-translate-y-1 border-slate-200 bg-white">
                      <CardHeader className="relative pb-3 -mt-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex justify-center ">
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant="secondary"
                                className="text-xs font-mono bg-slate-100 text-slate-600 hover:bg-slate-200"
                              >
                                {board.boardCode}
                              </Badge>

                              {board.isStarred && (
                                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                              )}
                            </div>

                            <CardTitle className="ml-2 mt-1 text-lg font-semibold text-slate-800 truncate">
                              {board.name}
                            </CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteBoard(board._id);
                            }}
                            disabled={isRemovingBoard}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete Board</span>
                          </Button>
                        </div>
                        {board.description && (
                          <CardDescription className="line-clamp-2 text-slate-600 mt-3 leading-relaxed">
                            {board.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="size-3" />
                          <span>
                            Created{" "}
                            {formatDistanceToNow(board.createdAt, {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsWorkspacePage;
