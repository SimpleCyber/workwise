"use client"

import type React from "react"

import { useState } from "react"
import { Calendar, CheckSquare, MoreHorizontal, Edit, Trash2, Archive } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CardDetailModal } from "./card-detail-modal"
import { useUpdateCard } from "@/features/todos/api/use-update-card"
import { useDeleteCard } from "@/features/todos/api/use-delete-card"
import { format } from "date-fns"
import { toast } from "sonner"
import type { Id } from "../../../../convex/_generated/dataModel"

interface KanbanCardProps {
  card: {
    _id: Id<"todoCards">
    title: string
    description?: string
    listId: Id<"todoLists">
    boardId: Id<"todoBoards">
    memberId: Id<"members">
    workspaceId: Id<"workspaces">
    position: number
    dueDate?: number
    isCompleted?: boolean
    isArchived?: boolean
    labels?: string[]
    attachments?: Id<"_storage">[]
    createdAt: number
    updatedAt: number
  }
}

const labelColors = [
  "bg-red-100 text-red-800",
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-yellow-100 text-yellow-800",
  "bg-purple-100 text-purple-800",
  "bg-pink-100 text-pink-800",
]

export const KanbanCard = ({ card }: KanbanCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { mutate: updateCard } = useUpdateCard()
  const { mutate: deleteCard, isPending: isDeleting } = useDeleteCard()

  const isDueSoon = card.dueDate && card.dueDate < Date.now() + 24 * 60 * 60 * 1000
  const isOverdue = card.dueDate && card.dueDate < Date.now()

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateCard(
      {
        cardId: card._id,
        isArchived: true,
      },
      {
        onSuccess: () => {
          toast.success("Card archived successfully")
        },
        onError: (error) => {
          toast.error(error.message || "Failed to archive card")
        },
      },
    )
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this card? This action cannot be undone.")) {
      deleteCard(
        { cardId: card._id },
        {
          onSuccess: () => {
            toast.success("Card deleted successfully")
          },
          onError: (error) => {
            toast.error(error.message || "Failed to delete card")
          },
        },
      )
    }
  }

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateCard(
      {
        cardId: card._id,
        isCompleted: !card.isCompleted,
      },
      {
        onSuccess: () => {
          toast.success(card.isCompleted ? "Card marked as incomplete" : "Card marked as complete")
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update card")
        },
      },
    )
  }

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow bg-white group"
        onClick={() => setIsModalOpen(true)}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between">
            {/* Title */}
            <h4 className="text-sm font-medium leading-tight flex-1">{card.title}</h4>

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
                    setIsModalOpen(true)
                  }}
                >
                  <Edit className="size-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleComplete}>
                  <CheckSquare className="size-4 mr-2" />
                  {card.isCompleted ? "Mark Incomplete" : "Mark Complete"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="size-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description preview */}
          {card.description && <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>}

          {/* Due date */}
          {card.dueDate && (
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
                {format(card.dueDate, "MMM d")}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {card.labels.slice(0, 3).map((label, index) => (
                  <Badge
                    key={label}
                    variant="secondary"
                    className={`text-xs px-2 py-0.5 ${labelColors[index % labelColors.length]}`}
                  >
                    {label}
                  </Badge>
                ))}
                {card.labels.length > 3 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    +{card.labels.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {card.isCompleted && <CheckSquare className="size-4 text-green-600" />}
          </div>
        </CardContent>
      </Card>

      <CardDetailModal card={card} open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  )
}
