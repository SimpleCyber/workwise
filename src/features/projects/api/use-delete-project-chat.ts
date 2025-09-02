import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

export function useDeleteProjectChat() {
  const mutate = useMutation(api.projectChats.remove)
  return {
    deleteChat: (chatId: Id<"projectChats">) => mutate({ chatId }),
  }
}
