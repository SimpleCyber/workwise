"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Plus, X, MoreHorizontal, Loader, Edit, Trash2, Archive, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCreateList } from "@/features/todos/api/use-create-list"
import { useCreateCard } from "@/features/todos/api/use-create-card"
import { useUpdateCard } from "@/features/todos/api/use-update-card"
import { useUpdateList } from "@/features/todos/api/use-update-list"
import { useDeleteList } from "@/features/todos/api/use-delete-list"
import { KanbanCard } from "./kanban-card"
import { useGetCards } from "@/features/todos/api/use-get-cards"
import { toast } from "sonner"
import type { Id } from "../../../../convex/_generated/dataModel"

interface KanbanBoardProps {
  boardId: Id<"todoBoards">
  lists: Array<{
    _id: Id<"todoLists">
    name: string
    position: number
    boardId: Id<"todoBoards">
    memberId: Id<"members">
    workspaceId: Id<"workspaces">
    isArchived?: boolean
    createdAt: number
    updatedAt: number
  }>
}

export const KanbanBoard = ({ boardId, lists }: KanbanBoardProps) => {
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [addingCardToList, setAddingCardToList] = useState<Id<"todoLists"> | null>(null)
  const [newCardTitle, setNewCardTitle] = useState("")
  const [editingList, setEditingList] = useState<Id<"todoLists"> | null>(null)
  const [editListName, setEditListName] = useState("")

  const { mutate: createList, isPending: isCreatingList } = useCreateList()
  const { mutate: createCard, isPending: isCreatingCard } = useCreateCard()
  const { mutate: updateCard } = useUpdateCard()
  const { mutate: updateList } = useUpdateList()
  const { mutate: deleteList } = useDeleteList()

  const handleCreateList = () => {
    if (!newListName.trim()) return

    createList(
      {
        name: newListName.trim(),
        boardId,
      },
      {
        onSuccess: () => {
          setNewListName("")
          setIsAddingList(false)
          toast.success("List created successfully!")
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create list")
        },
      },
    )
  }

  const handleCreateCard = (listId: Id<"todoLists">) => {
    if (!newCardTitle.trim()) return

    createCard(
      {
        title: newCardTitle.trim(),
        listId,
      },
      {
        onSuccess: () => {
          setNewCardTitle("")
          setAddingCardToList(null)
          toast.success("Card created successfully!")
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create card")
        },
      },
    )
  }

  const handleEditList = (listId: Id<"todoLists">, currentName: string) => {
    setEditingList(listId)
    setEditListName(currentName)
  }

  const handleSaveListName = () => {
    if (!editListName.trim() || !editingList) return

    updateList(
      {
        listId: editingList,
        name: editListName.trim(),
      },
      {
        onSuccess: () => {
          setEditingList(null)
          setEditListName("")
          toast.success("List renamed successfully!")
        },
        onError: (error) => {
          toast.error(error.message || "Failed to rename list")
        },
      },
    )
  }

  const handleArchiveList = (listId: Id<"todoLists">) => {
    updateList(
      {
        listId,
        isArchived: true,
      },
      {
        onSuccess: () => {
          toast.success("List archived successfully!")
        },
        onError: (error) => {
          toast.error(error.message || "Failed to archive list")
        },
      },
    )
  }

  const handleDeleteList = (listId: Id<"todoLists">) => {
    if (
      confirm(
        "Are you sure you want to delete this list? This will also delete all cards in this list. This action cannot be undone.",
      )
    ) {
      deleteList(
        { listId },
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

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

    // Handle list reordering
    if (type === "list") {
      const listId = draggableId as Id<"todoLists">
      updateList(
        {
          listId,
          position: destination.index,
        },
        {
          onError: (error) => {
            toast.error(error.message || "Failed to reorder list")
          },
        },
      )
      return
    }

    // Handle card movement between lists
    if (source.droppableId !== destination.droppableId) {
      const cardId = draggableId as Id<"todoCards">
      const newListId = destination.droppableId as Id<"todoLists">

      updateCard(
        {
          cardId,
          listId: newListId,
          position: destination.index,
        },
        {
          onError: (error) => {
            toast.error(error.message || "Failed to move card")
          },
        },
      )
    } else {
      // Handle card reordering within the same list
      const cardId = draggableId as Id<"todoCards">
      updateCard(
        {
          cardId,
          position: destination.index,
        },
        {
          onError: (error) => {
            toast.error(error.message || "Failed to reorder card")
          },
        },
      )
    }
  }

  const sortedLists = [...lists].filter((list) => !list.isArchived).sort((a, b) => a.position - b.position)

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="list" direction="horizontal">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex h-full gap-4 p-4 overflow-x-auto">
              {sortedLists.map((list, index) => (
                <Draggable key={list._id} draggableId={list._id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex-shrink-0 ${snapshot.isDragging ? "rotate-2" : ""}`}
                    >
                      <KanbanList
                        list={list}
                        dragHandleProps={provided.dragHandleProps}
                        isAddingCard={addingCardToList === list._id}
                        newCardTitle={newCardTitle}
                        setNewCardTitle={setNewCardTitle}
                        onAddCard={() => setAddingCardToList(list._id)}
                        onCancelAddCard={() => setAddingCardToList(null)}
                        onCreateCard={() => handleCreateCard(list._id)}
                        isCreatingCard={isCreatingCard}
                        onEditList={handleEditList}
                        onArchiveList={handleArchiveList}
                        onDeleteList={handleDeleteList}
                        isEditing={editingList === list._id}
                        editName={editListName}
                        setEditName={setEditListName}
                        onSaveEdit={handleSaveListName}
                        onCancelEdit={() => {
                          setEditingList(null)
                          setEditListName("")
                        }}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {/* Add List Column */}
              <div className="flex-shrink-0 w-72">
                {isAddingList ? (
                  <Card>
                    <CardContent className="p-3">
                      <Input
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="Enter list title..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleCreateList()
                          } else if (e.key === "Escape") {
                            setIsAddingList(false)
                            setNewListName("")
                          }
                        }}
                        autoFocus
                        disabled={isCreatingList}
                      />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={handleCreateList} disabled={!newListName.trim() || isCreatingList}>
                          Add List
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsAddingList(false)
                            setNewListName("")
                          }}
                          disabled={isCreatingList}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full h-12 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50"
                    onClick={() => setIsAddingList(true)}
                  >
                    <Plus className="size-4 mr-2" />
                    Add a list
                  </Button>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  )
}

interface KanbanListProps {
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
  isAddingCard: boolean
  newCardTitle: string
  setNewCardTitle: (title: string) => void
  onAddCard: () => void
  onCancelAddCard: () => void
  onCreateCard: () => void
  isCreatingCard: boolean
  onEditList: (listId: Id<"todoLists">, currentName: string) => void
  onArchiveList: (listId: Id<"todoLists">) => void
  onDeleteList: (listId: Id<"todoLists">) => void
  isEditing: boolean
  editName: string
  setEditName: (name: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
}

const KanbanList = ({
  list,
  dragHandleProps,
  isAddingCard,
  newCardTitle,
  setNewCardTitle,
  onAddCard,
  onCancelAddCard,
  onCreateCard,
  isCreatingCard,
  onEditList,
  onArchiveList,
  onDeleteList,
  isEditing,
  editName,
  setEditName,
  onSaveEdit,
  onCancelEdit,
}: KanbanListProps) => {
  const { data: cards, isLoading } = useGetCards({ listId: list._id })
  const sortedCards = cards ? [...cards].filter((card) => !card.isArchived).sort((a, b) => a.position - b.position) : []

  return (
    <div className="w-72">
      <Card>
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
                      onSaveEdit()
                    } else if (e.key === "Escape") {
                      onCancelEdit()
                    }
                  }}
                  onBlur={onSaveEdit}
                  autoFocus
                  className="h-6 text-sm font-medium"
                />
              ) : (
                <h3 className="font-medium text-sm flex-1">{list.name}</h3>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditList(list._id, list.name)}>
                  <Edit className="size-4 mr-2" />
                  Rename List
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onArchiveList(list._id)}>
                  <Archive className="size-4 mr-2" />
                  Archive List
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDeleteList(list._id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {sortedCards.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {sortedCards.length} card{sortedCards.length !== 1 ? "s" : ""}
            </div>
          )}
        </CardHeader>
        <Droppable droppableId={list._id} type="card">
          {(provided, snapshot) => (
            <CardContent
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-2 min-h-[100px] ${snapshot.isDraggingOver ? "bg-muted/50" : ""}`}
            >
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader className="size-4 animate-spin" />
                </div>
              ) : (
                sortedCards.map((card, index) => (
                  <Draggable key={card._id} draggableId={card._id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={snapshot.isDragging ? "rotate-2" : ""}
                      >
                        <KanbanCard card={card} />
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}

              {isAddingCard ? (
                <div className="space-y-2">
                  <Input
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    placeholder="Enter a title for this card..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onCreateCard()
                      } else if (e.key === "Escape") {
                        onCancelAddCard()
                      }
                    }}
                    autoFocus
                    disabled={isCreatingCard}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={onCreateCard} disabled={!newCardTitle.trim() || isCreatingCard}>
                      Add card
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onCancelAddCard} disabled={isCreatingCard}>
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={onAddCard}
                >
                  <Plus className="size-4 mr-2" />
                  Add a card
                </Button>
              )}
            </CardContent>
          )}
        </Droppable>
      </Card>
    </div>
  )
}
