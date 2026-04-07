import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export function useGetWorkspaceProjectChats(workspaceId: Id<"workspaces">) {
  const data = useQuery(api.projectChats.listForWorkspace, { workspaceId });

  return {
    chats: data ?? [],
    isLoading: data === undefined,
  };
}
