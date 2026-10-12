"use client";

import React, { useEffect } from "react";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useRouter, useSearchParams } from "next/navigation";
import { SecretsPageContent } from "@/features/vault/components/secrets-page-content";
import { useFeatureFlags } from "@/components/feature-flags";
import type { Id } from "@/../convex/_generated/dataModel";

export default function SecretsPage() {
  const router = useRouter();
  const workspaceId = useWorkspaceId() as Id<"workspaces">;
  const searchParams = useSearchParams();
  const boardId =
    (searchParams?.get("boardId") as Id<"projectBoards">) || undefined;

  const { isEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const isProjectKeysEnabled = isEnabled("project_keys");

  useEffect(() => {
    if (!flagsLoading && !isProjectKeysEnabled && workspaceId) {
      router.replace(`/projects/${workspaceId}`);
    }
  }, [flagsLoading, isProjectKeysEnabled, workspaceId, router]);

  if (!workspaceId || (!isProjectKeysEnabled && !flagsLoading)) {
    return null;
  }

  return (
    <div className="h-full overflow-hidden">
      <SecretsPageContent workspaceId={workspaceId} boardId={boardId} />
    </div>
  );
}
