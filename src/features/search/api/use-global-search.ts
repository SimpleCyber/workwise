"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

interface SearchFilters {
  types: string[];
  dateRange?: {
    start: number;
    end: number;
  };
  sortBy?: string;
}

export const useRealtimeSearch = ({
  workspaceId,
  query,
  filters,
  limit = 100,
}: {
  workspaceId?: Id<"workspaces">;
  query: string;
  filters: SearchFilters;
  limit?: number;
}) => {
  const result = useQuery(
    api.search.realtimeSearch,
    workspaceId && query.trim().length >= 1
      ? {
          workspaceId,
          query,
          filters,
          limit,
        }
      : "skip",
  );

  return {
    data: result,
    isLoading: result === undefined,
  };
};

// Add this export at the end of the file
export const useGlobalSearch = useRealtimeSearch;
