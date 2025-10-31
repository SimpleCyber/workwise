// hooks/use-pinned-board.ts
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const usePinnedBoard = (workspaceId: Id<"workspaces"> | null) => {
  return useQuery(
    api.todos.getStarredBoards,
    workspaceId ? { workspaceId } : "skip",
  );
};
