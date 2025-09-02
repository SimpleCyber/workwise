import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

export function useTogglePinProjectChat() {
  const mutate = useMutation(api.projectChats.togglePin)
  return {
    togglePin: (chatId: Id<"projectChats">) => mutate({ chatId }),
  }
}
