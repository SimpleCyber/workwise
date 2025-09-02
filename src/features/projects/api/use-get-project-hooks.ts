"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export function useGetProjectHooks(chatId: Id<"projectChats"> | null) {
  const hooks = useQuery(
    api.projectChats.listHooks,
    chatId ? { chatId } : "skip",
  ) as
    | {
        id: string;
        messageId: string;
        content: string;
        selected: boolean;
        createdAt: string;
      }[]
    | undefined;
  return {
    hooks: hooks ?? [],
    isLoading: chatId ? hooks === undefined : false,
  };
}
