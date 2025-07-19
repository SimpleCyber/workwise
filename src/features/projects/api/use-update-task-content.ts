"use client";

import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

type UpdateTaskContentRequest = {
  taskId: Id<"projectTasks">;
  title?: string;
  description?: string;
  image?: Id<"_storage">;
};

export const useUpdateTaskContent = () => {
  const [data, setData] = useState<Id<"projectTasks"> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<
    "success" | "error" | "settled" | "pending" | null
  >(null);

  const isPending = useMemo(() => status === "pending", [status]);
  const mutation = useMutation(api.projects.updateTaskContent);

  const mutate = useCallback(
    async (values: UpdateTaskContentRequest) => {
      try {
        setData(null);
        setError(null);
        setStatus("pending");
        const response = await mutation(values);
        setData(response);
        setStatus("success");
        return response;
      } catch (error) {
        setError(error as Error);
        setStatus("error");
        throw error;
      } finally {
        setStatus("settled");
      }
    },
    [mutation],
  );

  return { mutate, data, error, isPending };
};
