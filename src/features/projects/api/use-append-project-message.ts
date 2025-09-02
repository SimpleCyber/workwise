import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

export function useAppendProjectMessage() {
  const mutate = useMutation(api.projectChats.appendMessage)
  return {
    appendMessage: (args: {
      chatId: Id<"projectChats">
      role: "user" | "assistant"
      content: string
      userId?: Id<"users">
    }) => mutate(args),
  }
}
