import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export function useDeleteMessagesFrom() {
  const mutate = useMutation(api.projectChats.deleteFromMessage);
  return {
    deleteFrom: (args: {
      chatId: Id<"projectChats">;
      fromMessageId: Id<"projectChatMessages">;
    }) => mutate(args),
  };
}
