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
  Lock,
  Globe,
  Users,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";

import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useConfirm } from "@/hooks/use-confirm";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useCreateBoard } from "@/features/todos/api/use-create-board";
import { useDeleteBoard } from "@/features/todos/api/use-delete-board";
import { useGetBoards } from "@/features/todos/api/use-get-boards";
import { useToggleStarBoard } from "@/features/todos/api/use-toggle-star-board";
import { useUpdateBoard } from "@/features/todos/api/use-update-board";
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useCurrentMember } from "@/features/members/api/use-current-member";

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
  const { data: members, isLoading: membersLoading } = useGetMembers({
    workspaceId,
  });
  const { data: currentMember } = useCurrentMember({ workspaceId });
  const { mutate: createBoard, isPending: isCreatingBoard } = useCreateBoard();
  const { mutate: deleteBoard, isPending: isDeletingBoard } = useDeleteBoard();
  const { mutate: updateBoard, isPending: isUpdatingBoard } = useUpdateBoard();
  const { mutate: toggleStarBoard, isPending: isTogglingStar } =
    useToggleStarBoard();

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "This action cannot be undone.",
  );

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [allowedMembers, setAllowedMembers] = useState<Id<"members">[]>([]);
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
          visibility,
          allowedMembers,
        },
        {
          onSuccess: () => {
            toast.success("Board updated successfully!");
            setOpen(false);
            setEditingBoardId(null);
            setName("");
            setDescription("");
            setVisibility("private");
            setAllowedMembers([]);
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
          visibility,
          allowedMembers,
        },
        {
          onSuccess: () => {
            toast.success("Board created successfully!");
            setOpen(false);
            setName("");
            setDescription("");
            setVisibility("private");
            setAllowedMembers([]);
          },
          onError: (error) => {
            toast.error(error.message || "Failed to create board");
          },
        },
      );
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    const ok = await confirm();

    if (ok) {
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
      <ConfirmDialog />
      <div className="flex h-[49px] items-center justify-between border-b bg-background px-4">
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
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>
                {editingBoardId ? "Edit Board" : "Create New Board"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Basics */}
                <div className="space-y-4">
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
                      className="min-h-[150px]"
                      disabled={isCreatingBoard || isUpdatingBoard}
                    />
                    <p className="text-xs text-muted-foreground">
                      {description.trim().split(/\s+/).filter(Boolean).length} /{" "}
                      {MAX_DESCRIPTION_WORDS} words
                    </p>
                  </div>
                </div>

                {/* Right Column: Visibility & Access */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Visibility</Label>
                    <RadioGroup
                      value={visibility}
                      onValueChange={(value) =>
                        setVisibility(value as "private" | "public")
                      }
                      className="grid grid-cols-2 gap-2"
                    >
                      <Label
                        htmlFor="private"
                        className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer transition-colors ${visibility === "private" ? "bg-accent border-primary" : "hover:bg-accent/50"}`}
                      >
                        <RadioGroupItem value="private" id="private" />
                        <div className="flex flex-col gap-y-0.5">
                          <strong>Private</strong>
                          <div className="text-[10px] text-muted-foreground leading-tight">
                            Only you
                          </div>
                        </div>
                      </Label>
                      <Label
                        htmlFor="public"
                        className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer transition-colors ${visibility === "public" ? "bg-accent border-primary" : "hover:bg-accent/50"}`}
                      >
                        <RadioGroupItem value="public" id="public" />
                        <div className="flex flex-col gap-y-0.5">
                          <strong>Public</strong>
                          <div className="text-[10px] text-muted-foreground leading-tight">
                            Shared access
                          </div>
                        </div>
                      </Label>
                    </RadioGroup>
                  </div>

                  {visibility === "public" && (
                    <div className="space-y-3">
                      <Label>Allowed Members</Label>
                      <div className="rounded-md border p-2 bg-muted/30">
                        <div className="pb-2 text-xs text-muted-foreground">
                          Select members who can access this board. If none
                          selected, it will be visible to everyone.
                        </div>
                        <ScrollArea className="h-[140px]">
                          <div className="space-y-2">
                            {members?.map((member) => {
                              if (member._id === currentMember?._id)
                                return null;

                              return (
                                <div
                                  key={member._id}
                                  className="flex items-center space-x-2 p-1 hover:bg-accent rounded-sm transition-colors"
                                >
                                  <Checkbox
                                    id={member._id}
                                    checked={allowedMembers.includes(
                                      member._id,
                                    )}
                                    onCheckedChange={(checked) => {
                                      setAllowedMembers((prev) => {
                                        if (checked) {
                                          return [...prev, member._id];
                                        } else {
                                          return prev.filter(
                                            (id) => id !== member._id,
                                          );
                                        }
                                      });
                                    }}
                                  />
                                  <Label
                                    htmlFor={member._id}
                                    className="flex items-center gap-2 cursor-pointer w-full"
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={member.user.image} />
                                      <AvatarFallback>
                                        {member.user.name?.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">
                                      {member.user.name}
                                    </span>
                                  </Label>
                                </div>
                              );
                            })}
                            {members?.length === 1 && (
                              <div className="text-sm text-center py-4 text-muted-foreground">
                                No other members.
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    setEditingBoardId(null);
                    setName("");
                    setDescription("");
                    setVisibility("private");
                    setAllowedMembers([]);
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
                      ? "border-yellow-500/50 bg-yellow-500/10 shadow-sm"
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
                          <span className="truncate">{board.name}</span>
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
                              setVisibility(board.visibility || "private");
                              setAllowedMembers(board.allowedMembers || []);
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
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3" />
                        <span>
                          {formatDistanceToNow(board.createdAt, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {board.visibility === "public" &&
                          board.allowedMembers &&
                          board.allowedMembers.length > 0 && (
                            <div className="flex -space-x-2 overflow-hidden">
                              {board.allowedMembers
                                .slice(0, 3)
                                .map((memberId) => {
                                  const member = members?.find(
                                    (m) => m._id === memberId,
                                  );
                                  if (!member) return null;
                                  return (
                                    <Avatar
                                      key={memberId}
                                      className="h-5 w-5 border-2 border-background"
                                    >
                                      <AvatarImage src={member.user.image} />
                                      <AvatarFallback className="text-[8px]">
                                        {member.user.name?.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                  );
                                })}
                              {board.allowedMembers.length > 3 && (
                                <div className="flex items-center justify-center h-5 w-5 rounded-full border-2 border-background bg-muted text-[8px] font-medium">
                                  +{board.allowedMembers.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="shrink-0 cursor-help">
                                {board.visibility === "public" ? (
                                  board.allowedMembers &&
                                  board.allowedMembers.length > 0 ? (
                                    <Users className="size-3 text-blue-500" />
                                  ) : (
                                    <Globe className="size-3 text-green-500" />
                                  )
                                ) : (
                                  <Lock className="size-3 text-muted-foreground" />
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {board.visibility === "public"
                                  ? board.allowedMembers &&
                                    board.allowedMembers.length > 0
                                    ? "Shared with specific members"
                                    : "Public to all members"
                                  : "Private"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
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
