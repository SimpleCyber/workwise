"use client";

import {
  ArrowDownAZ,
  ArrowUpDown,
  Calendar,
  ChevronsLeftRight,
  ChevronsRightLeft,
  GripHorizontal,
  GripVertical,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDeleteList } from "@/features/todos/api/use-delete-list";
import { useUpdateList } from "@/features/todos/api/use-update-list";

import type { Id } from "../../../../../convex/_generated/dataModel";

export type SortOption = "newest" | "oldest" | "alphabetical";

interface TodoListHeaderProps {
  list: {
    _id: Id<"todoLists">;
    name: string;
    position: number;
    boardId: Id<"todoBoards">;
    memberId: Id<"members">;
    workspaceId: Id<"workspaces">;
    isArchived?: boolean;
    createdAt: number;
    updatedAt: number;
  };
  dragHandleProps: any;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  taskCounts?: {
    completed: number;
    total: number;
  };
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
}

export const TodoListHeader = ({
  list,
  dragHandleProps,
  isCollapsed,
  onToggleCollapse,
  taskCounts,
  sortBy,
  onSortChange,
}: TodoListHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

  const { mutate: updateList } = useUpdateList();
  const { mutate: deleteList } = useDeleteList();

  const handleStartEdit = () => {
    if (isCollapsed) return; // Don't allow editing when collapsed
    setIsEditing(true);
    setEditName(list.name);
  };

  const handleSaveListName = () => {
    if (!editName.trim()) {
      handleCancelEdit();
      return;
    }

    updateList(
      {
        listId: list._id,
        name: editName.trim(),
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          setEditName("");
          toast.success("List renamed successfully!");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to rename list");
        },
      },
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName("");
  };

  const handleDeleteList = () => {
    if (
      confirm(
        "Are you sure you want to delete this list? This will also delete all cards in this list. This action cannot be undone.",
      )
    ) {
      deleteList(
        { listId: list._id },
        {
          onSuccess: () => {
            toast.success("List deleted successfully!");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to delete list");
          },
        },
      );
    }
  };

  const getSortIcon = (option: SortOption) => {
    switch (option) {
      case "newest":
        return <Calendar className="size-4 mr-2" />;
      case "oldest":
        return <Calendar className="size-4 mr-2" />;
      case "alphabetical":
        return <ArrowDownAZ className="size-4 mr-2" />;
      default:
        return <ArrowUpDown className="size-4 mr-2" />;
    }
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case "newest":
        return "Newest First";
      case "oldest":
        return "Oldest First";
      case "alphabetical":
        return "Alphabetical";
      default:
        return "Sort By";
    }
  };

  if (isCollapsed) {
    return (
      <CardHeader className="pb-4 px-2">
        <div className="flex flex-col items-center gap-2 ">
          {/* Horizontal Drag Handle */}
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripHorizontal className="size-4 text-muted-foreground hover:text-foreground" />
          </div>

          {/* Expand Button - At the top */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onToggleCollapse}
            title="Expand list"
          >
            <ChevronsLeftRight className="size-4" />
          </Button>

          {/* Vertical Title */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-1 flex-1 min-h-0">
                  <div
                    className="writing-mode-vertical text-sm font-medium text-gray-800 cursor-pointer hover:text-gray-600 transition-colors text-center break-all"
                    onClick={onToggleCollapse}
                    style={{
                      writingMode: "vertical-rl",
                      textOrientation: "mixed",
                      maxHeight: "24rem",
                      overflow: "hidden",
                    }}
                    title="Click to expand"
                  >
                    {list.name}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{list.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Task Count */}
          {taskCounts && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-gray-500 font-medium bg-gray-300 px-1.5  rounded-sm cursor-default">
                    {taskCounts.completed}/{taskCounts.total}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>
                    {taskCounts.completed} completed / {taskCounts.total} total
                    tasks
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
    );
  }

  // Expanded horizontal layout
  return (
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="size-4 text-muted-foreground hover:text-foreground" />
          </div>
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveListName();
                } else if (e.key === "Escape") {
                  handleCancelEdit();
                }
              }}
              onBlur={handleSaveListName}
              autoFocus
              className="h-6 text-sm font-medium"
            />
          ) : (
            <h3
              className="font-medium text-sm cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors flex-1"
              onClick={handleStartEdit}
              title="Click to edit"
            >
              {list.name}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onToggleCollapse}
            title="Collapse list"
          >
            <ChevronsRightLeft className="size-4" />
          </Button>

          {/* Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSortChange("newest")}>
                {getSortIcon("newest")}
                {getSortLabel("newest")}
                {sortBy === "newest" && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange("oldest")}>
                {getSortIcon("oldest")}
                {getSortLabel("oldest")}
                {sortBy === "oldest" && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange("alphabetical")}>
                {getSortIcon("alphabetical")}
                {getSortLabel("alphabetical")}
                {sortBy === "alphabetical" && (
                  <span className="ml-auto">✓</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDeleteList}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4 mr-2" />
                Delete List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </CardHeader>
  );
};
