"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export function useToggleProjectHook() {
  const mutate = useMutation(api.projectChats.toggleHook);
  return {
    toggleHook: (args: {
      chatId: Id<"projectChats">;
      messageId: Id<"projectChatMessages">;
      content: string;
    }) => mutate(args),
  };
}

export function useSetProjectHookSelected() {
  const mutate = useMutation(api.projectChats.setHookSelected);
  return {
    setHookSelected: (hookId: Id<"projectChatHooks">, selected: boolean) =>
      mutate({ hookId, selected }),
  };
}
