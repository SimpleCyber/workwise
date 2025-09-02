import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

export function useRenameProjectChat() {
  const mutate = useMutation(api.projectChats.rename)
  return {
    renameChat: (chatId: Id<"projectChats">, title: string) => mutate({ chatId, title }),
  }
}
