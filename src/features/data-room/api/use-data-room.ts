"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

// Get data room files with search and pagination
export const useGetDataRoomFiles = ({
  workspaceId,
  page = 1,
  limit = 12,
  search = "",
  dateFilter = "",
  userFilter = "",
  fileTypeFilter = "",
}: {
  workspaceId?: Id<"workspaces">;
  page?: number;
  limit?: number;
  search?: string;
  dateFilter?: string;
  userFilter?: string;
  fileTypeFilter?: string;
}) => {
  const shouldFetch = !!workspaceId;

  const result = useQuery(
    api.dataRoom.getDataRoomFiles,
    shouldFetch
      ? {
          workspaceId,
          page,
          limit,
          search,
          dateFilter,
          userFilter,
          fileTypeFilter,
        }
      : "skip",
  );

  return {
    data: result,
    isLoading: result === undefined,
    error: null,
  };
};

// Upload data room file need updates
type UploadFileRequest = {
  workspaceId: Id<"workspaces">;
  storageId: Id<"_storage">;
  fileName: string;
  fileType: string;
  fileSize: number;
  comment: string;
  visibility: "public" | "private";
  allowedMembers: Id<"members">[];
};

export const useUploadDataRoomFile = () => {
  const [data, setData] = useState<Id<"dataRoomFiles"> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<
    "success" | "error" | "settled" | "pending" | null
  >(null);

  const isPending = useMemo(() => status === "pending", [status]);
  const mutation = useMutation(api.dataRoom.uploadDataRoomFile);

  const mutate = useCallback(
    async (values: UploadFileRequest) => {
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

// Delete data room file
export const useDeleteDataRoomFile = () => {
  const [data, setData] = useState<Id<"dataRoomFiles"> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<
    "success" | "error" | "settled" | "pending" | null
  >(null);

  const isPending = useMemo(() => status === "pending", [status]);
  const mutation = useMutation(api.dataRoom.deleteDataRoomFile);

  const mutate = useCallback(
    async (values: { fileId: Id<"dataRoomFiles"> }) => {
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

// Update file permissions
export const useUpdateFilePermissions = () => {
  const [data, setData] = useState<Id<"dataRoomFiles"> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<
    "success" | "error" | "settled" | "pending" | null
  >(null);

  const isPending = useMemo(() => status === "pending", [status]);
  const mutation = useMutation(api.dataRoom.updateFilePermissions);

  const mutate = useCallback(
    async (values: {
      fileId: Id<"dataRoomFiles">;
      visibility: "public" | "private";
      allowedMembers: Id<"members">[];
    }) => {
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
