"use client"

import { useMutation, useQuery } from "convex/react"
import { useCallback, useMemo, useState } from "react"
import { api } from "@/../convex/_generated/api"
import type { Id } from "@/../convex/_generated/dataModel"

// Get task comments
export const useGetTaskComments = (taskId: Id<"projectTasks"> | undefined, sortOrder: "asc" | "desc" = "asc") => {
  const result = useQuery(api.projects.getTaskComments, taskId ? { taskId, sortOrder } : "skip")
  
  return {
    data: result,
    isLoading: result === undefined,
    error: null // You can add error handling if needed
  }
}

// Create task comment
type CreateCommentRequest = {
  taskId: Id<"projectTasks">
  content: string
  images?: string[]
}

export const useCreateTaskComment = () => {
  const [data, setData] = useState<Id<"taskComments"> | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [status, setStatus] = useState<"success" | "error" | "settled" | "pending" | null>(null)

  const isPending = useMemo(() => status === "pending", [status])
  const mutation = useMutation(api.projects.createTaskComment)

  const mutate = useCallback(
    async (values: CreateCommentRequest) => {
      try {
        setData(null)
        setError(null)
        setStatus("pending")
        const response = await mutation(values)
        setData(response)
        setStatus("success")
        return response
      } catch (error) {
        setError(error as Error)
        setStatus("error")
        throw error
      } finally {
        setStatus("settled")
      }
    },
    [mutation],
  )

  return { mutate, data, error, isPending }
}

// Update task comment
type UpdateCommentRequest = {
  commentId: Id<"taskComments">
  content: string
  images?: string[]
}

export const useUpdateTaskComment = () => {
  const [data, setData] = useState<Id<"taskComments"> | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [status, setStatus] = useState<"success" | "error" | "settled" | "pending" | null>(null)

  const isPending = useMemo(() => status === "pending", [status])
  const mutation = useMutation(api.projects.updateTaskComment)

  const mutate = useCallback(
    async (values: UpdateCommentRequest) => {
      try {
        setData(null)
        setError(null)
        setStatus("pending")
        const response = await mutation(values)
        setData(response)
        setStatus("success")
        return response
      } catch (error) {
        setError(error as Error)
        setStatus("error")
        throw error
      } finally {
        setStatus("settled")
      }
    },
    [mutation],
  )

  return { mutate, data, error, isPending }
}

// Delete task comment
export const useDeleteTaskComment = () => {
  const [data, setData] = useState<Id<"taskComments"> | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [status, setStatus] = useState<"success" | "error" | "settled" | "pending" | null>(null)

  const isPending = useMemo(() => status === "pending", [status])
  const mutation = useMutation(api.projects.deleteTaskComment)

  const mutate = useCallback(
    async (values: { commentId: Id<"taskComments"> }) => {
      try {
        setData(null)
        setError(null)
        setStatus("pending")
        const response = await mutation(values)
        setData(response)
        setStatus("success")
        return response
      } catch (error) {
        setError(error as Error)
        setStatus("error")
        throw error
      } finally {
        setStatus("settled")
      }
    },
    [mutation],
  )

  return { mutate, data, error, isPending }
}
