"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Loader,
  Plus,
  TriangleAlert,
  MoreHorizontal,
  Trash2,
  Edit,
  Pencil,
  Calendar,
  Pin,
  PinOff,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCreateBoard } from "@/features/todos/api/use-create-board";
import { useGetBoards } from "@/features/todos/api/use-get-boards";
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info";
import { useDeleteBoard } from "@/features/todos/api/use-delete-board";
import { useUpdateBoard } from "@/features/todos/api/use-update-board";
import { useToggleStarBoard } from "@/features/todos/api/use-toggle-star-board";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import type { Id } from "../../../../convex/_generated/dataModel";

const TodoWorkspacePage = () => {
  const MAX_NAME_WORDS = 10;
  const MAX_DESCRIPTION_WORDS = 30;

  const workspaceId = useWorkspaceId();
  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspaceInfo({
    id: workspaceId,
  });
  const { data: boards, isLoading: boardsLoading } = useGetBoards({
    workspaceId,
  });
  const { mutate: createBoard, isPending: isCreatingBoard } = useCreateBoard();
  const { mutate: deleteBoard, isPending: isDeletingBoard } = useDeleteBoard();
  const { mutate: updateBoard, isPending: isUpdatingBoard } = useUpdateBoard();
  const { mutate: toggleStarBoard, isPending: isTogglingStar } =
    useToggleStarBoard();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingBoardId, setEditingBoardId] = useState<Id<"todoBoards"> | null>(
    null,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nameWords = name.trim().split(/\s+/).length;
    const descWords = description.trim().split(/\s+/).length;

    if (!name.trim()) return toast.error("Board name is required.");

    if (nameWords > MAX_NAME_WORDS) {
      return toast.error(`Board name must be under ${MAX_NAME_WORDS} words.`);
    }

    if (description.trim() && descWords > MAX_DESCRIPTION_WORDS) {
      return toast.error(
        `Description must be under ${MAX_DESCRIPTION_WORDS} words.`,
      );
    }

    if (editingBoardId) {
      // Handle update
      updateBoard(
        {
          boardId: editingBoardId,
          name: name.trim(),
          description: description.trim() || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Board updated successfully!");
            setOpen(false);
            setEditingBoardId(null);
            setName("");
            setDescription("");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to update board");
          },
        },
      );
    } else {
      // Handle create
      createBoard(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          workspaceId,
        },
        {
          onSuccess: () => {
            toast.success("Board created successfully!");
            setOpen(false);
            setName("");
            setDescription("");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to create board");
          },
        },
      );
    }
  };

  const handleDeleteBoard = (boardId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this board and all its contents? This action cannot be undone.",
      )
    ) {
      deleteBoard(
        { boardId: boardId as Id<"todoBoards"> },
        {
          onSuccess: () => {
            toast.success("Board deleted successfully!");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to delete board");
          },
        },
      );
    }
  };

  const handleToggleStar = (
    boardId: Id<"todoBoards">,
    currentlyStarred: boolean,
  ) => {
    toggleStarBoard(
      { boardId },
      {
        onSuccess: (isNowStarred) => {
          if (isNowStarred) {
            toast.success("Board pinned successfully!");
          } else {
            toast.success("Board unpinned successfully!");
          }
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update pin status");
        },
      },
    );
  };

  // Sort boards: pinned first, then by creation date
  const sortedBoards = boards?.sort((a, b) => {
    if (a.isStarred && !b.isStarred) return -1;
    if (!a.isStarred && b.isStarred) return 1;
    return b.createdAt - a.createdAt;
  });

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
          Todo Boards - {workspace.name}
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4 mr-2" />
              New Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBoardId ? "Edit Board" : "Create New Board"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Board Name</Label>
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
                        `Board name can not exceed ${MAX_NAME_WORDS} words.`,
                      );
                    }
                  }}
                  placeholder="Enter board name..."
                  disabled={isCreatingBoard || isUpdatingBoard}
                />
                <p className="text-xs text-muted-foreground">
                  {name.trim().split(/\s+/).filter(Boolean).length} /{" "}
                  {MAX_NAME_WORDS} words
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
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
                        `Description can not exceed ${MAX_DESCRIPTION_WORDS} words.`,
                      );
                    }
                  }}
                  placeholder="Enter board description..."
                  disabled={isCreatingBoard || isUpdatingBoard}
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
                  onClick={() => {
                    setOpen(false);
                    setEditingBoardId(null);
                    setName("");
                    setDescription("");
                  }}
                  disabled={isCreatingBoard || isUpdatingBoard}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingBoard || isUpdatingBoard || !name.trim()}
                >
                  {isCreatingBoard || isUpdatingBoard ? (
                    <>
                      <Loader className="size-4 mr-2 animate-spin" />
                      {editingBoardId ? "Updating..." : "Creating..."}
                    </>
                  ) : editingBoardId ? (
                    "Update Board"
                  ) : (
                    "Create Board"
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
                <h3 className="text-lg font-semibold mb-2">No boards yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first board to start organizing your tasks
                </p>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="size-4 mr-2" />
                      Create Your First Board
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedBoards?.map((board) => (
                <Card
                  key={board._id}
                  className={`hover:shadow-md transition-shadow ${
                    board.isStarred
                      ? "border-yellow-300 bg-yellow-50 shadow-sm"
                      : ""
                  }`}
                >
                  <CardHeader className="relative">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/todo/${workspaceId}/board/${board._id}`}
                        className="flex-1"
                      >
                        <CardTitle className="text-base flex items-center gap-2">
                          {board.isStarred && (
                            <Pin className="size-4 text-yellow-500 fill-yellow-500" />
                          )}
                          {board.name}
                        </CardTitle>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/todo/${workspaceId}/board/${board._id}`}
                            >
                              <Edit className="size-4 mr-2" /> Open Board
                            </Link>
                          </DropdownMenuItem>
                          {board.isStarred ? (
                            <DropdownMenuItem
                              onClick={() => handleToggleStar(board._id, true)}
                              disabled={isTogglingStar}
                            >
                              <PinOff className="size-4 mr-2" /> Unpin Board
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleToggleStar(board._id, false)}
                              disabled={isTogglingStar}
                            >
                              <Pin className="size-4 mr-2" /> Pin Board
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingBoardId(board._id);
                              setName(board.name);
                              setDescription(board.description || "");
                              setOpen(true);
                            }}
                          >
                            <Pencil className="size-4 mr-2" /> Edit Board
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteBoard(board._id)}
                            className="text-destructive focus:text-destructive"
                            disabled={isDeletingBoard}
                          >
                            <Trash2 className="size-4 mr-2" /> Delete Board
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {board.description && (
                      <CardDescription className="line-clamp-2">
                        {board.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoWorkspacePage;
