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
  Pencil,
  MoreHorizontal,
  Grid,
  List,
  X,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateProjectBoard } from "@/features/projects/api/use-create-project-board";
import { useGetProjectBoards } from "@/features/projects/api/use-get-project-boards";
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info";
import { useRemoveProjectBoard } from "@/features/projects/api/use-remove-project-board";
import { useUpdateProjectBoard } from "@/features/projects/api/use-update-project-board";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useConfirm } from "@/hooks/use-confirm";
import type { Id } from "../../../../convex/_generated/dataModel";
import { WorkspaceOnlyTree } from "./workspace-tree";

const ProjectsWorkspacePage = () => {
  const workspaceId = useWorkspaceId();
  const workspaceIdTree = useWorkspaceId();
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
  const { mutate: updateBoard, isPending: isUpdatingBoard } =
    useUpdateProjectBoard();

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "This action cannot be undone.",
  );
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingBoardId, setEditingBoardId] =
    useState<Id<"projectBoards"> | null>(null);
  const [view, setView] = useState<"graph" | "list">("graph");
  const [projectType, setProjectType] = useState<"development" | "sales">(
    "development",
  );
  const [columns, setColumns] = useState<string[]>([
    "To Do",
    "In Progress",
    "On Hold",
    "Done",
  ]);
  const [newColumnName, setNewColumnName] = useState("");

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

    if (editingBoardId) {
      updateBoard(
        {
          boardId: editingBoardId,
          name: name.trim(),
          description: description.trim() || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Project board updated successfully!");
            setOpen(false);
            setEditingBoardId(null);
            setName("");
            setDescription("");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to update project board");
          },
        },
      );
    } else {
      createBoard(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          workspaceId,
          projectType,
          columns: projectType === "development" ? columns : undefined,
        },
        {
          onSuccess: () => {
            toast.success("Project board created successfully!");
            setOpen(false);
            setName("");
            setDescription("");
            setProjectType("development");
            setColumns(["To Do", "In Progress", "On Hold", "Done"]);
            setNewColumnName("");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to create project board");
          },
        },
      );
    }
  };

  const handleDeleteBoard = async (boardId: Id<"projectBoards">) => {
    const ok = await confirm();

    if (ok) {
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
    <div className="flex h-full flex-col bg-background/30">
      <ConfirmDialog />
      <div className="flex h-[49px] items-center justify-between border-b bg-background px-4">
        <h1 className="text-lg font-semibold">
          Project Boards - {workspace.name}
        </h1>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border rounded-md p-0.5 h-8 bg-muted/20 flex-shrink-0 mr-2">
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setView("list")}
              className="h-7 w-7"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={view === "graph" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setView("graph")}
              className="h-7 w-7"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
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
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editingBoardId
                    ? "Edit Project Board"
                    : "Create New Project Board"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:divide-x pb-6">
                  {/* Left Partition: Basic Information */}
                  <div className="space-y-6 md:pr-4">
                    <div className="space-y-3">
                      <Label
                        htmlFor="name"
                        className="text-sm font-medium text-foreground"
                      >
                        Project Name
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => {
                          const input = e.target.value;
                          const words = input
                            .trim()
                            .split(/\s+/)
                            .filter(Boolean);
                          if (words.length <= MAX_NAME_WORDS) {
                            setName(input);
                          } else {
                            toast.error(
                              `Title can not exceed ${MAX_NAME_WORDS} words.`,
                            );
                          }
                        }}
                        placeholder="Enter project name..."
                        disabled={isCreatingBoard || isUpdatingBoard}
                        className="h-11 border-border focus:border-gray-500 focus:ring-gray-500/20"
                      />
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="size-3" />
                        {name.trim().split(/\s+/).filter(Boolean).length} /{" "}
                        {MAX_NAME_WORDS} words
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="description"
                        className="text-sm font-medium text-foreground"
                      >
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => {
                          const input = e.target.value;
                          const words = input
                            .trim()
                            .split(/\s+/)
                            .filter(Boolean);
                          if (words.length <= MAX_DESCRIPTION_WORDS) {
                            setDescription(input);
                          } else {
                            toast.error(
                              `Description can not exceed ${MAX_DESCRIPTION_WORDS} words.`,
                            );
                          }
                        }}
                        placeholder="Enter project description..."
                        disabled={isCreatingBoard || isUpdatingBoard}
                        className="min-h-[100px] border-border focus:border-gray-500 focus:ring-gray-500/20 resize-none"
                      />
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="size-3" />
                        {
                          description.trim().split(/\s+/).filter(Boolean).length
                        }{" "}
                        / {MAX_DESCRIPTION_WORDS} words
                      </p>
                    </div>
                  </div>

                  {/* Right Partition: Project Type & Settings */}
                  <div className="space-y-6 pt-6 md:pt-0 md:pl-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-foreground">
                        Project Type
                      </Label>
                      <Select
                        value={projectType}
                        onValueChange={(val: "development" | "sales") =>
                          setProjectType(val)
                        }
                        disabled={
                          isCreatingBoard || isUpdatingBoard || !!editingBoardId
                        }
                      >
                        <SelectTrigger className="h-11 border-border">
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="development">
                            Development
                          </SelectItem>
                          <SelectItem value="sales">
                            Sales (Cold Calling)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {projectType === "development" && !editingBoardId && (
                      <div className="space-y-3 border-t pt-4">
                        <Label className="text-sm font-medium text-foreground">
                          Board Columns
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Customize the columns for this project board. Once
                          created, these cannot be edited here.
                        </p>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                          {columns.map((col, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 bg-muted/30 p-2 rounded-md border"
                            >
                              <Input
                                value={col}
                                onChange={(e) => {
                                  const newCols = [...columns];
                                  newCols[index] = e.target.value;
                                  setColumns(newCols);
                                }}
                                className="h-8 bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-gray-500/30"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => {
                                  setColumns(
                                    columns.filter((_, i) => i !== index),
                                  );
                                }}
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Input
                            value={newColumnName}
                            onChange={(e) => setNewColumnName(e.target.value)}
                            placeholder="Add new column..."
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (newColumnName.trim()) {
                                  setColumns([
                                    ...columns,
                                    newColumnName.trim(),
                                  ]);
                                  setNewColumnName("");
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-9 shrink-0"
                            onClick={() => {
                              if (newColumnName.trim()) {
                                setColumns([...columns, newColumnName.trim()]);
                                setNewColumnName("");
                              }
                            }}
                          >
                            <Plus className="size-4 mr-1.5" /> Add
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      setEditingBoardId(null);
                      setName("");
                      setDescription("");
                      setProjectType("development");
                      setColumns(["To Do", "In Progress", "On Hold", "Done"]);
                      setNewColumnName("");
                    }}
                    disabled={isCreatingBoard || isUpdatingBoard}
                    className="px-6 border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isCreatingBoard || isUpdatingBoard || !name.trim()
                    }
                    className="px-6 bg-gray-600 hover:bg-gray-700 text-white shadow-sm"
                  >
                    {isCreatingBoard || isUpdatingBoard ? (
                      <>
                        <Loader className="size-4 mr-2 animate-spin" />
                        {editingBoardId ? "Updating..." : "Creating..."}
                      </>
                    ) : editingBoardId ? (
                      "Update Project Board"
                    ) : (
                      "Create Project Board"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto">
        {view === "graph" ? (
          <div className="w-full h-full bg-card rounded-lg shadow-sm">
            <WorkspaceOnlyTree />
          </div>
        ) : (
          <div className="w-full">
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
                    managing your team tasks and workflows
                  </p>
                  <Button
                    onClick={() => setOpen(true)}
                    className="bg-gray-600 hover:bg-gray-700 text-white shadow-sm px-6 py-3 h-auto"
                  >
                    <Plus className="size-4 mr-2" />
                    Create Your First Project Board
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boards.map((board) => (
                  <div key={board._id} className="group relative">
                    <Link
                      href={`/projects/${workspaceId}/board/${board._id}`}
                      className="block"
                    >
                      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 border-border bg-card">
                        <CardHeader className="relative pb-3 -mt-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col">
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

                              <CardTitle className="mt-2 text-lg font-semibold text-slate-800 truncate">
                                {board.name}
                              </CardTitle>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/projects/${workspaceId}/board/${board._id}`}
                                  >
                                    Open Board
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setEditingBoardId(board._id);
                                    setName(board.name);
                                    setDescription(board.description || "");
                                    setOpen(true);
                                  }}
                                >
                                  <Pencil className="size-4 mr-2" />
                                  Edit Board
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteBoard(board._id);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                  disabled={isRemovingBoard}
                                >
                                  <Trash2 className="size-4 mr-2" />
                                  Delete Board
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
        )}
      </div>
    </div>
  );
};

export default ProjectsWorkspacePage;
