"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import type { Id } from "../../convex/_generated/dataModel";

export const useWorkspaceId = () => {
  const params = useParams();
  const workspaceId = params.workspaceId as Id<"workspaces">;

  useEffect(() => {
    if (workspaceId) {
      localStorage.setItem("lastActiveWorkspaceId", workspaceId);
    }
  }, [workspaceId]);

  return workspaceId;
};
