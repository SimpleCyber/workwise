"use client"

import { ChevronDown, ChevronUp, GripVertical, MoreHorizontal, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { CardHeader } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useDeleteList } from "@/features/todos/api/use-delete-list"
import { useUpdateList } from "@/features/todos/api/use-update-list"

import type { Id } from "../../../../../convex/_generated/dataModel"

interface TodoListHeaderProps {
  list: {
    _id: Id<"todoLists">
    name: string
    position: number
    boardId: Id<"todoBoards">
    memberId: Id<"members">
    workspaceId: Id<"workspaces">
    isArchived?: boolean
    createdAt: number
    updatedAt: number
  }
  dragHandleProps: any
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export const TodoListHeader = ({ list, dragHandleProps, isCollapsed, onToggleCollapse }: TodoListHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")

  const { mutate: updateList } = useUpdateList()
  const { mutate: deleteList } = useDeleteList()

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditName(list.name)
  }

  const handleSaveListName = () => {
    if (!editName.trim()) {
      handleCancelEdit()
      return
    }

    updateList(
      {
        listId: list._id,
        name: editName.trim(),
      },
      {
        onSuccess: () => {
          setIsEditing(false)
          setEditName("")
          toast.success("List renamed successfully!")
        },
        onError: (error) => {
          toast.error(error.message || "Failed to rename list")
        },
      },
    )
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditName("")
  }

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
            toast.success("List deleted successfully!")
          },
          onError: (error) => {
            toast.error(error.message || "Failed to delete list")
          },
        },
      )
    }
  }

  return (
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="size-4 text-muted-foreground hover:text-foreground" />
          </div>
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveListName()
                } else if (e.key === "Escape") {
                  handleCancelEdit()
                }
              }}
              onBlur={handleSaveListName}
              autoFocus
              className="h-6 text-sm font-medium"
            />
          ) : (
            <h3
              className="font-medium text-sm flex-1 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors"
              onClick={handleStartEdit}
              title="Click to edit"
            >
              {list.name}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Collapse/Expand Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand list" : "Collapse list"}
          >
            {isCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </Button>

          {/* Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDeleteList} className="text-destructive focus:text-destructive">
                <Trash2 className="size-4 mr-2" />
                Delete List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </CardHeader>
  )
}
