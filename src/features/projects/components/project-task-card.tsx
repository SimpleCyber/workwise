"use client"
import { useState } from "react"
import { Calendar, MoreHorizontal, Edit, Trash2, Archive, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import type { Id } from "../../../../convex/_generated/dataModel"

interface ProjectTaskCardProps {
  task: {
    _id: Id<"projectTasks">
    title: string
    description?: string
    taskCode: string
    listId: Id<"projectLists">
    boardId: Id<"projectBoards">
    createdById: Id<"members">
    assignedToId: Id<"members">
    assignedById: Id<"members">
    workspaceId: Id<"workspaces">
    position: number
    priority: "low" | "medium" | "high" | "urgent"
    dueDate?: number
    isCompleted?: boolean
    isArchived?: boolean
    labels?: string[]
    attachments?: Id<"_storage">[]
    createdAt: number
    updatedAt: number
    assignedAt: number
    assignedTo: {
      _id: Id<"members">
      userId: Id<"users">
      workspaceId: Id<"workspaces">
      role: "admin" | "member" | "lead"
      user: {
        _id: Id<"users">
        name?: string
        email?: string
        image?: string
      } | null
    } | null
    assignedBy: {
      _id: Id<"members">
      userId: Id<"users">
      workspaceId: Id<"workspaces">
      role: "admin" | "member" | "lead"
      user: {
        _id: Id<"users">
        name?: string
        email?: string
        image?: string
      } | null
    } | null
    createdBy: {
      _id: Id<"members">
      userId: Id<"users">
      workspaceId: Id<"workspaces">
      role: "admin" | "member" | "lead"
      user: {
        _id: Id<"users">
        name?: string
        email?: string
        image?: string
      } | null
    } | null
  }
  onEdit?: () => void
  onArchive?: () => void
  onDelete?: () => void
}

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

const priorityIcons = {
  low: "🟢",
  medium: "🔵",
  high: "🟠",
  urgent: "🔴",
}

export const ProjectTaskCard = ({ task, onEdit, onArchive, onDelete }: ProjectTaskCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isDueSoon = task.dueDate && task.dueDate < Date.now() + 24 * 60 * 60 * 1000
  const isOverdue = task.dueDate && task.dueDate < Date.now()

  const getAssignmentTooltip = () => {
    if (!task.assignedBy?.user || !task.assignedTo?.user) return ""

    if (task.assignedBy._id === task.assignedTo._id) {
      return `Self-assigned by ${task.assignedBy.user.name}`
    }

    return `${task.assignedBy.user.name} → ${task.assignedTo.user.name}`
  }

  return (
    <TooltipProvider>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow bg-white group"
        onClick={() => setIsModalOpen(true)}
      >
        <CardContent className="p-3 space-y-3">
          {/* Header with Task Code and Priority */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                {task.taskCode}
              </Badge>
              <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                {priorityIcons[task.priority]} {task.priority.toUpperCase()}
              </Badge>
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.()
                  }}
                >
                  <Edit className="size-4 mr-2" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onArchive?.()
                  }}
                >
                  <Archive className="size-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.()
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title */}
          <h4 className="text-sm font-medium leading-tight">{task.title}</h4>

          {/* Description preview */}
          {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}

          {/* Due date */}
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="size-3" />
              <span
                className={`text-xs ${
                  isOverdue
                    ? "text-red-600 font-medium"
                    : isDueSoon
                      ? "text-yellow-600 font-medium"
                      : "text-muted-foreground"
                }`}
              >
                {format(task.dueDate, "MMM d")}
                {isOverdue && <AlertCircle className="size-3 inline ml-1" />}
              </span>
            </div>
          )}

          {/* Assignment Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task.assignedTo?.user && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={task.assignedTo.user.image || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {task.assignedTo.user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {task.assignedBy?.user && task.assignedBy._id !== task.assignedTo._id && (
                        <>
                          <span className="text-xs text-muted-foreground">←</span>
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={task.assignedBy.user.image || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {task.assignedBy.user.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getAssignmentTooltip()}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.labels.slice(0, 2).map((label, index) => (
                  <Badge key={label} variant="secondary" className="text-xs px-1 py-0">
                    {label}
                  </Badge>
                ))}
                {task.labels.length > 2 && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    +{task.labels.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Completion status */}
          {task.isCompleted && (
            <div className="flex items-center gap-1 text-green-600">
              <span className="text-xs">✓ Completed</span>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
