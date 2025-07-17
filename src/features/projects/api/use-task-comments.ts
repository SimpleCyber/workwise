import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

// Get task comments
export const useGetTaskComments = (taskId: Id<"projectTasks">, sortOrder: "asc" | "desc" = "asc") => {
  const data = useQuery(api.projects.getTaskComments, { taskId, sortOrder })
  const isLoading = data === undefined

  return { data, isLoading }
}

// Create comment
export const useCreateTaskComment = () => {
  return useMutation(api.projects.createTaskComment)
}

// Update comment
export const useUpdateTaskComment = () => {
  return useMutation(api.projects.updateTaskComment)
}

// Delete comment
export const useDeleteTaskComment = () => {
  return useMutation(api.projects.deleteTaskComment)
}

// Update task content
export const useUpdateTaskContent = () => {
  return useMutation(api.projects.updateTaskContent)
}
