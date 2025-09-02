import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

export function useGetProjectChatMessages(chatId?: Id<"projectChats">) {
  const data = useQuery(api.projectChats.getMessages, chatId ? { chatId } : undefined)
  return { messages: data ?? [], isLoading: data === undefined && !!chatId }
}
