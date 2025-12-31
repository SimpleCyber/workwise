"use client";

import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Loader } from "lucide-react";
import { useState, useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { useGetCards } from "@/features/todos/api/use-get-cards";

import type { Id } from "../../../../../convex/_generated/dataModel";
import { TodoTask } from "./todo-task";
import { TodoAddCard } from "./todo-add-card";
import { TodoListHeader, type SortOption } from "./todo-list-header";
import { useUpdateList } from "../../api/use-update-list";

interface TodoListProps {
  list: {
    _id: Id<"todoLists">;
    name: string;
    position: number;
    boardId: Id<"todoBoards">;
    memberId: Id<"members">;
    workspaceId: Id<"workspaces">;
    isArchived?: boolean;
    isCollapsed?: boolean;
    createdAt: number;
    updatedAt: number;
  };
  dragHandleProps: any;
}

export const TodoList = ({ list, dragHandleProps }: TodoListProps) => {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const { data: cards, isLoading } = useGetCards({ listId: list._id });
  const { mutate: updateList } = useUpdateList();

  const isCollapsed = list.isCollapsed ?? false;

  const filteredCards = useMemo(() => {
    return cards ? cards.filter((card) => !card.isArchived) : [];
  }, [cards]);

  const sortedCards = useMemo(() => {
    if (!filteredCards.length) return [];

    const sorted = [...filteredCards];

    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => b.createdAt - a.createdAt);
      case "oldest":
        return sorted.sort((a, b) => a.createdAt - b.createdAt);
      case "alphabetical":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted.sort((a, b) => a.position - b.position);
    }
  }, [filteredCards, sortBy]);

  const taskCounts = useMemo(() => {
    if (!filteredCards.length) return { completed: 0, total: 0 };

    const completed = filteredCards.filter((card) => card.isCompleted).length;
    const total = filteredCards.length;

    return { completed, total };
  }, [filteredCards]);

  const getCollapsedWidth = () => {
    const baseWidth = 55;
    return baseWidth;
  };

  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    updateList({
      listId: list._id,
      isCollapsed: newCollapsedState,
    });
    if (!newCollapsedState && isAddingCard) {
      setIsAddingCard(false);
    }
  };

  const handleSortChange = (newSortBy: SortOption) => {
    setSortBy(newSortBy);
  };

  const collapsedWidth = getCollapsedWidth();

  return (
    <div
      className="transition-all duration-300 ease-in-out"
      style={{
        width: isCollapsed ? `${collapsedWidth}px` : "288px",
      }}
    >
      <Card
        className={`bg-muted/50 transition-all duration-300 ease-in-out ${isCollapsed ? "" : ""}`}
      >
        <TodoListHeader
          list={list}
          dragHandleProps={dragHandleProps}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          taskCounts={taskCounts}
          sortBy={sortBy}
          onSortChange={handleSortChange}
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
                    <Draggable
                      key={card._id}
                      draggableId={card._id}
                      index={index}
                    >
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

                <TodoAddCard
                  listId={list._id}
                  isAddingCard={isAddingCard}
                  setIsAddingCard={setIsAddingCard}
                />
              </CardContent>
            )}
          </Droppable>
        )}
      </Card>
    </div>
  );
};
