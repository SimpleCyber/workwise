import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

export function useGetProjectChatMessages(chatId?: Id<"projectChats">, limit = 200) {
  // Pass "skip" when chatId is not available, otherwise pass the full args object.
  const data = useQuery(api.projectChats.getMessages, chatId ? { chatId, limit } : "skip")

  return {
    messages: data ?? [],
    isLoading: data === undefined && !!chatId,
  }
}
