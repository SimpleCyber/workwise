"use client"

import { useMutation } from "convex/react"
import { useCallback, useMemo, useState } from "react"
import { api } from "@/../convex/_generated/api"
import type { Id } from "@/../convex/_generated/dataModel"

type RequestType = {
  attendanceId: Id<"attendance">
  tasks: string
  image?: Id<"_storage">
}

type ResponseType = Id<"attendance"> | null

type Options = {
  onSuccess?: (data: ResponseType) => void
  onError?: (error: Error) => void
  onSettled?: () => void
  throwError?: boolean
}

export const useCheckOut = () => {
  const [data, setData] = useState<ResponseType>(null)
  const [error, setError] = useState<Error | null>(null)
  const [status, setStatus] = useState<"success" | "error" | "settled" | "pending" | null>(null)

  const isPending = useMemo(() => status === "pending", [status])
  const isSuccess = useMemo(() => status === "success", [status])
  const isError = useMemo(() => status === "error", [status])
  const isSettled = useMemo(() => status === "settled", [status])

  const mutation = useMutation(api.attendance.checkOut)

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
        setError(error as Error)
        options?.onError?.(error as Error)
        if (options?.throwError) throw error
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
    isError,
    isSuccess,
    isSettled,
  }
}
