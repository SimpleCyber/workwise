import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface UseGetWorkspaceMembersProps {
  workspaceId?: Id<"workspaces">;
}

export type WorkspaceMember = {
  _id: Id<"members">;
  userId: Id<"users">;
  workspaceId: Id<"workspaces">;
  role: "admin" | "member" | "lead";
  user: {
    _id: Id<"users">;
    _creationTime: number;
    name?: string;
    email?: string;
    image?: string;
    emailVerificationTime?: number;
    phone?: string;
    phoneVerificationTime?: number;
    isAnonymous?: boolean;
  } | null;
};

export const useGetWorkspaceMembers = ({
  workspaceId,
}: UseGetWorkspaceMembersProps): {
  data: WorkspaceMember[];
  isLoading: boolean;
} => {
  const data = useQuery(
    api.projects.getWorkspaceMembers,
    workspaceId ? { workspaceId } : "skip",
  );

  const isLoading = data === undefined && !!workspaceId;

  return {
    data: (data as WorkspaceMember[]) || [],
    isLoading,
  };
};
