import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export function useGetProjectChats(boardId?: Id<"projectBoards">) {
  const data = useQuery(
    api.projectChats.listForBoard,
    boardId ? { boardId } : "skip",
  );

  return {
    chats: data ?? [],
    isLoading: data === undefined && !!boardId,
  };
}
