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
  folderId,
}: {
  workspaceId?: Id<"workspaces">;
  page?: number;
  limit?: number;
  search?: string;
  dateFilter?: string;
  userFilter?: string;
  fileTypeFilter?: string;
  folderId?: Id<"dataRoomFolders">;
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
          folderId,
        }
      : "skip",
  );

  return {
    data: result,
    isLoading: result === undefined,
    error: null,
  };
};

// Upload data room file
type UploadFileRequest = {
  workspaceId: Id<"workspaces">;
  storageId: Id<"_storage">;
  fileName: string;
  fileType: string;
  fileSize: number;
  comment: string;
  visibility: "public" | "private";
  allowedMembers: Id<"members">[];
  folderId?: Id<"dataRoomFolders">;
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

// Create data room folder
export const useCreateDataRoomFolder = () => {
  const [data, setData] = useState<Id<"dataRoomFolders"> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<
    "success" | "error" | "settled" | "pending" | null
  >(null);

  const isPending = useMemo(() => status === "pending", [status]);
  const mutation = useMutation(api.dataRoom.createDataRoomFolder);

  const mutate = useCallback(
    async (values: {
      workspaceId: Id<"workspaces">;
      name: string;
      parentId?: Id<"dataRoomFolders">;
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

// Toggle pinned folder
export const useTogglePinDataRoomFolder = () => {
  const [data, setData] = useState<Id<"dataRoomFolders"> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<
    "success" | "error" | "settled" | "pending" | null
  >(null);

  const isPending = useMemo(() => status === "pending", [status]);
  const mutation = useMutation(api.dataRoom.togglePinDataRoomFolder);

  const mutate = useCallback(
    async (values: { folderId: Id<"dataRoomFolders">; isPinned: boolean }) => {
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

// Get pinned folders
export const useGetPinnedDataRoomFolders = ({
  workspaceId,
}: {
  workspaceId?: Id<"workspaces">;
}) => {
  const shouldFetch = !!workspaceId;

  const result = useQuery(
    api.dataRoom.getPinnedDataRoomFolders,
    shouldFetch ? { workspaceId } : "skip",
  );

  return {
    data: result,
    isLoading: result === undefined,
    error: null,
  };
};

export const useMoveDataRoomItems = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

  const mutation = useMutation(api.dataRoom.moveDataRoomItems);

  const mutate = useCallback(
    async (values: any, options?: any) => {
      try {
        setData(null);
        setError(null);
        setIsPending(true);

        const response = await mutation(values);
        setData(response);
        options?.onSuccess?.(response);
        return response;
      } catch (e) {
        setError(e as Error);
        options?.onError?.(e as Error);
        if (options?.throwError) throw e;
      } finally {
        setIsPending(false);
      }
    },
    [mutation],
  );

  return { mutate, data, error, isPending };
};
