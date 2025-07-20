"use client"

import { Draggable, Droppable } from "@hello-pangea/dnd"
import { Loader } from "lucide-react"
import { useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { useGetCards } from "@/features/todos/api/use-get-cards"

import type { Id } from "../../../../../convex/_generated/dataModel"
import { TodoTask } from "./todo-task"
import { TodoAddCard } from "./todo-add-card"
import { TodoListHeader } from "./todo-list-header"

interface TodoListProps {
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
}

export const TodoList = ({ list, dragHandleProps }: TodoListProps) => {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { data: cards, isLoading } = useGetCards({ listId: list._id })

  const sortedCards = cards ? [...cards].filter((card) => !card.isArchived).sort((a, b) => a.position - b.position) : []

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
    // If collapsing, also cancel any card addition in progress
    if (!isCollapsed && isAddingCard) {
      setIsAddingCard(false)
    }
  }

  return (
    <div className="w-72">
      <Card className="bg-gray-50">
        <TodoListHeader
          list={list}
          dragHandleProps={dragHandleProps}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        {!isCollapsed && (
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
                          <TodoTask card={card} />
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}

                <TodoAddCard listId={list._id} isAddingCard={isAddingCard} setIsAddingCard={setIsAddingCard} />
              </CardContent>
            )}
          </Droppable>
        )}
      </Card>
    </div>
  )
}
