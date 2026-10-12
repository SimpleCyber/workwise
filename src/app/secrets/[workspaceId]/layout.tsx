"use client";

import type { PropsWithChildren } from "react";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useSearchParams } from "next/navigation";
import { VaultProvider } from "@/features/vault/context/vault-context";
import WorkspaceLayout from "@/components/workspace-sidebar/workspace-sidebar-layout";
import { SecretsSidebarContent } from "./secrets-sidebar-content";
import type { Id } from "@/../convex/_generated/dataModel";

const SecretsWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  const workspaceId = useWorkspaceId() as Id<"workspaces">;
  const searchParams = useSearchParams();
  const boardId = (searchParams?.get("boardId") as Id<"projectBoards">) || undefined;

  if (!workspaceId) {
    return null;
  }

  return (
    <VaultProvider workspaceId={workspaceId} boardId={boardId}>
      <WorkspaceLayout
        autoSaveId="secrets-workspace-layout"
        sidebarContent={<SecretsSidebarContent />}
      >
        {children}
      </WorkspaceLayout>
    </VaultProvider>
  );
};

export default SecretsWorkspaceLayout;
