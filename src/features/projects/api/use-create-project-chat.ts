import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

export function useCreateProjectChat() {
  const mutate = useMutation(api.projectChats.create)
  return {
    createChat: (args: {
      workspaceId: Id<"workspaces">
      boardId: Id<"projectBoards">
      title: string
      createdBy: Id<"users">
    }) => mutate(args),
  }
}
