"use client";

import {
  DragDropContext,
  Draggable,
  type DropResult,
  Droppable,
} from "@hello-pangea/dnd";
import { toast } from "sonner";

import { useUpdateCard } from "@/features/todos/api/use-update-card";
import { useUpdateList } from "@/features/todos/api/use-update-list";

import type { Id } from "../../../../../convex/_generated/dataModel";
import { TodoAddList } from "./todo-add-list";
import { TodoList } from "./todo-list";

interface TodoBoardProps {
  boardId: Id<"todoBoards">;
  lists: Array<{
    _id: Id<"todoLists">;
    name: string;
    position: number;
    boardId: Id<"todoBoards">;
    memberId: Id<"members">;
    workspaceId: Id<"workspaces">;
    isArchived?: boolean;
    sortBy?: "newest" | "oldest" | "alphabetical" | "manual";
    createdAt: number;
    updatedAt: number;
  }>;
}

export const TodoBoard = ({ boardId, lists }: TodoBoardProps) => {
  const { mutate: updateCard } = useUpdateCard();
  const { mutate: updateList } = useUpdateList();

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Handle list reordering
    if (type === "list") {
      const listId = draggableId as Id<"todoLists">;
      updateList(
        {
          listId,
          position: destination.index,
        },
        {
          onSuccess: () => toast.success("List reordered"),
          onError: (error) => {
            toast.error(error.message || "Failed to reorder list");
          },
        },
      );
      return;
    }

    // Handle card movement between lists
    if (source.droppableId !== destination.droppableId) {
      const cardId = draggableId as Id<"todoCards">;
      const newListId = destination.droppableId as Id<"todoLists">;

      const destinationList = lists.find((l) => l._id === newListId);
      if (destinationList && destinationList.sortBy !== "manual") {
        updateList({
          listId: newListId,
          sortBy: "manual",
        });
      }

      updateCard(
        {
          cardId,
          listId: newListId,
          position: destination.index,
        },
        {
          onSuccess: () => toast.success("Card moved"),
          onError: (error) => {
            toast.error(error.message || "Failed to move card");
          },
        },
      );
    } else {
      // Handle card reordering within the same list
      const cardId = draggableId as Id<"todoCards">;
      const listId = source.droppableId as Id<"todoLists">;

      const currentList = lists.find((l) => l._id === listId);
      if (currentList && currentList.sortBy !== "manual") {
        updateList({
          listId,
          sortBy: "manual",
        });
      }

      updateCard(
        {
          cardId,
          position: destination.index,
        },
        {
          onSuccess: () => toast.success("Card reordered"),
          onError: (error) => {
            toast.error(error.message || "Failed to reorder card");
          },
        },
      );
    }
  };

  const sortedLists = [...lists]
    .filter((list) => !list.isArchived)
    .sort((a, b) => a.position - b.position);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="board" type="list" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex h-full gap-4 p-4 overflow-x-auto"
          >
            {sortedLists.map((list, index) => (
              <Draggable key={list._id} draggableId={list._id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`flex-shrink-0 ${snapshot.isDragging ? "rotate-2" : ""}`}
                  >
                    <TodoList
                      list={list}
                      dragHandleProps={provided.dragHandleProps}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            <TodoAddList boardId={boardId} />
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
