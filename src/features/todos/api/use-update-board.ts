// src/features/todos/api/use-update-board.ts
"use client";

import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type RequestType = {
  boardId: Id<"todoBoards">;
  name?: string;
  description?: string;
  background?: string;
  isStarred?: boolean;
  isArchived?: boolean;
};

type ResponseType = void;

type Options = {
  onSuccess?: (data: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;
};

export const useUpdateBoard = () => {
  const [data, setData] = useState<ResponseType>();
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<
    "success" | "error" | "settled" | "pending" | null
  >(null);

  const isPending = useMemo(() => status === "pending", [status]);
  const isSuccess = useMemo(() => status === "success", [status]);
  const isError = useMemo(() => status === "error", [status]);
  const isSettled = useMemo(() => status === "settled", [status]);

  const mutation = useMutation(api.todos.updateBoard);

  const mutate = useCallback(
    async (values: RequestType, options?: Options) => {
      try {
        setData(undefined);
        setError(null);
        setStatus("pending");

        await mutation(values);
        setStatus("success");
        options?.onSuccess?.(undefined);
      } catch (error) {
        setStatus("error");
        const err = error as Error;
        setError(err);
        options?.onError?.(err);
        if (options?.throwError) {
          throw error;
        }
      } finally {
        setStatus("settled");
        options?.onSettled?.();
      }
    },
    [mutation],
  );

  return {
    mutate,
    data,
    error,
    isPending,
    isSuccess,
    isError,
    isSettled,
  };
};
