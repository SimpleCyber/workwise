"use client";

import React from "react";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useSearchParams } from "next/navigation";
import { SecretsPageContent } from "@/features/vault/components/secrets-page-content";
import type { Id } from "@/../convex/_generated/dataModel";

export default function SecretsPage() {
  const workspaceId = useWorkspaceId() as Id<"workspaces">;
  const searchParams = useSearchParams();
  const boardId =
    (searchParams?.get("boardId") as Id<"projectBoards">) || undefined;

  if (!workspaceId) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto">
      <SecretsPageContent workspaceId={workspaceId} boardId={boardId} />
    </div>
  );
}
