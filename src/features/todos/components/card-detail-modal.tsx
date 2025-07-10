"use client"

import { useState } from "react"
import { Calendar, Tag, X, ChevronDown, ChevronRight, CheckSquare, Archive, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { useUpdateCard } from "@/features/todos/api/use-update-card"
import { useDeleteCard } from "@/features/todos/api/use-delete-card"
import { useGetChecklists } from "@/features/todos/api/use-get-checklists"
import { useGetComments } from "@/features/todos/api/use-get-comments"
import { toast } from "sonner"
import { format } from "date-fns"
import type { Id } from "../../../../convex/_generated/dataModel"

interface CardDetailModalProps {
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
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CardDetailModal = ({ card, open, onOpenChange }: CardDetailModalProps) => {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || "")
  const [dueDate, setDueDate] = useState(card.dueDate ? format(card.dueDate, "yyyy-MM-dd") : "")
  const [newLabel, setNewLabel] = useState("")
  const [labels, setLabels] = useState(card.labels || [])

  // Collapsible states
  const [isDetailsOpen, setIsDetailsOpen] = useState(true)
  const [isLabelsOpen, setIsLabelsOpen] = useState(!!card.labels?.length)
  const [isChecklistsOpen, setIsChecklistsOpen] = useState(false)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)

  const { mutate: updateCard, isPending } = useUpdateCard()
  const { mutate: deleteCard, isPending: isDeleting } = useDeleteCard()
  const { data: checklists } = useGetChecklists({ cardId: card._id })
  const { data: comments } = useGetComments({ cardId: card._id })

  const handleSave = () => {
    updateCard(
      {
        cardId: card._id,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        labels: labels.length > 0 ? labels : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Card updated successfully!")
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update card")
        },
      },
    )
  }

  const handleAddLabel = () => {
    if (!newLabel.trim() || labels.includes(newLabel.trim())) return
    setLabels([...labels, newLabel.trim()])
    setNewLabel("")
  }

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter((label) => label !== labelToRemove))
  }

  const handleToggleComplete = () => {
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

  const handleArchive = () => {
    updateCard(
      {
        cardId: card._id,
        isArchived: true,
      },
      {
        onSuccess: () => {
          toast.success("Card archived successfully")
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(error.message || "Failed to archive card")
        },
      },
    )
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this card? This action cannot be undone.")) {
      deleteCard(
        { cardId: card._id },
        {
          onSuccess: () => {
            toast.success("Card deleted successfully")
            onOpenChange(false)
          },
          onError: (error) => {
            toast.error(error.message || "Failed to delete card")
          },
        },
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Card Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Card title..." />
          </div>

          {/* Basic Details - Collapsible */}
          <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
                {isDetailsOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                <span className="font-medium">Details</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-2">
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={4}
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Labels - Collapsible */}
          <Collapsible open={isLabelsOpen} onOpenChange={setIsLabelsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
                {isLabelsOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                <span className="font-medium">Labels</span>
                {labels.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {labels.length}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {labels.map((label) => (
                  <Badge key={label} variant="secondary" className="flex items-center gap-1">
                    <Tag className="size-3" />
                    {label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveLabel(label)}
                    >
                      <X className="size-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Add a label..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddLabel()
                    }
                  }}
                />
                <Button variant="outline" onClick={handleAddLabel} disabled={!newLabel.trim()}>
                  Add
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Checklists - Collapsible */}
          {checklists && checklists.length > 0 && (
            <>
              <Collapsible open={isChecklistsOpen} onOpenChange={setIsChecklistsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
                    {isChecklistsOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    <span className="font-medium">Checklists</span>
                    <Badge variant="secondary" className="ml-2">
                      {checklists.length}
                    </Badge>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {checklists.map((checklist) => (
                    <div key={checklist._id} className="border rounded p-3">
                      <h4 className="font-medium text-sm">{checklist.title}</h4>
                      {/* Add checklist items here if needed */}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
              <Separator />
            </>
          )}

          {/* Comments - Collapsible */}
          {comments && comments.length > 0 && (
            <>
              <Collapsible open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
                    {isCommentsOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    <span className="font-medium">Comments</span>
                    <Badge variant="secondary" className="ml-2">
                      {comments.length}
                    </Badge>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {comments.map((comment) => (
                    <div key={comment._id} className="border rounded p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{comment.user?.name || "Unknown User"}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(comment.createdAt, "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
              <Separator />
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-2">
              <Button
                variant={card.isCompleted ? "outline" : "default"}
                onClick={handleToggleComplete}
                disabled={isPending}
              >
                <CheckSquare className="size-4 mr-2" />
                {card.isCompleted ? "Mark Incomplete" : "Mark Complete"}
              </Button>
              <Button variant="outline" onClick={handleArchive} disabled={isPending}>
                <Archive className="size-4 mr-2" />
                Archive
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive hover:text-destructive bg-transparent"
              >
                <Trash2 className="size-4 mr-2" />
                Delete
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isPending || !title.trim()}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
