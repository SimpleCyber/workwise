"use client";

import type { Id } from "../../../../convex/_generated/dataModel";
import { TodoBoard } from "../components/todoboard/todo-board";

interface KanbanBoardProps {
  boardId: Id<"todoBoards">;
  lists: Array<{
    _id: Id<"todoLists">;
    name: string;
    position: number;
    boardId: Id<"todoBoards">;
    memberId: Id<"members">;
    workspaceId: Id<"workspaces">;
    isArchived?: boolean;
    createdAt: number;
    updatedAt: number;
  }>;
}

export const KanbanBoard = ({ boardId, lists }: KanbanBoardProps) => {
  return <TodoBoard boardId={boardId} lists={lists} />;
};
