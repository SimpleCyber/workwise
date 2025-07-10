"use client"

import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useCallback, useMemo, useState } from "react"
import type { Id } from "../../../../convex/_generated/dataModel"

type RequestType = {
  name: string
  boardId: Id<"todoBoards">
}

type ResponseType = Id<"todoLists"> | null

type Options = {
  onSuccess?: (data: ResponseType) => void
  onError?: (error: Error) => void
  onSettled?: () => void
  throwError?: boolean
}

export const useCreateList = () => {
  const [data, setData] = useState<ResponseType>(null)
  const [error, setError] = useState<Error | null>(null)
  const [status, setStatus] = useState<"success" | "error" | "settled" | "pending" | null>(null)

  const isPending = useMemo(() => status === "pending", [status])
  const isSuccess = useMemo(() => status === "success", [status])
  const isError = useMemo(() => status === "error", [status])
  const isSettled = useMemo(() => status === "settled", [status])

  const mutation = useMutation(api.todos.createList)

  const mutate = useCallback(
    async (values: RequestType, options?: Options) => {
      try {
        setData(null)
        setError(null)
        setStatus("pending")

        const response = await mutation(values)
        setData(response)
        setStatus("success")
        options?.onSuccess?.(response)
        return response
      } catch (error) {
        setStatus("error")
        const err = error as Error
        setError(err)
        options?.onError?.(err)
        if (options?.throwError) {
          throw error
        }
      } finally {
        setStatus("settled")
        options?.onSettled?.()
      }
    },
    [mutation],
  )

  return {
    mutate,
    data,
    error,
    isPending,
    isSuccess,
    isError,
    isSettled,
  }
}
