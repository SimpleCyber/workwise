"use client";

import React from "react";
import { KeyRound, FileKey, History } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WorkspaceSection } from "@/app/workspace/[workspaceId]/workspace-section";
import { Button } from "@/components/ui/button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { MemberAccessModal } from "@/features/vault/components/member-access-modal";
import { cn } from "@/lib/utils";
import type { Id } from "@/../convex/_generated/dataModel";

export const SecretsSidebarContent = () => {
  const workspaceId = useWorkspaceId() as Id<"workspaces">;
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "keys";
  const currentBoardId = searchParams.get("boardId");

  return (
    <div className="flex flex-col h-full gap-y-2 mt-3">
      {/* Primary Vault Navigation */}
      <WorkspaceSection label="Secret Project Keys">
        <Link
          href={`/secrets/${workspaceId}${currentBoardId ? `?boardId=${currentBoardId}` : ""}`}
        >
          <Button
            variant="transparent"
            className={cn(
              "h-8 justify-start px-[18px] text-sm w-full group transition-colors",
              currentTab === "keys"
                ? "bg-[#f9EDFF]/20 text-white font-semibold"
                : "text-[#f9EDFFCC] hover:bg-[#f9EDFF]/10",
            )}
          >
            <KeyRound className="mr-2 size-4 shrink-0 text-emerald-400" />
            <span className="truncate">Environment Keys</span>
          </Button>
        </Link>

        <Link
          href={`/secrets/${workspaceId}?tab=files${currentBoardId ? `&boardId=${currentBoardId}` : ""}`}
        >
          <Button
            variant="transparent"
            className={cn(
              "h-8 justify-start px-[18px] text-sm w-full group transition-colors",
              currentTab === "files"
                ? "bg-[#f9EDFF]/20 text-white font-semibold"
                : "text-[#f9EDFFCC] hover:bg-[#f9EDFF]/10",
            )}
          >
            <FileKey className="mr-2 size-4 shrink-0 text-amber-400" />
            <span className="truncate">Secret Files & Certs</span>
          </Button>
        </Link>

        <Link
          href={`/secrets/${workspaceId}?tab=logs${currentBoardId ? `&boardId=${currentBoardId}` : ""}`}
        >
          <Button
            variant="transparent"
            className={cn(
              "h-8 justify-start px-[18px] text-sm w-full group transition-colors",
              currentTab === "logs"
                ? "bg-[#f9EDFF]/20 text-white font-semibold"
                : "text-[#f9EDFFCC] hover:bg-[#f9EDFF]/10",
            )}
          >
            <History className="mr-2 size-4 shrink-0 text-purple-400" />
            <span className="truncate">Audit Logs & History</span>
          </Button>
        </Link>
      </WorkspaceSection>

      {/* Access & Sharing */}
      <WorkspaceSection label="Access & Security">
        <div className="px-2">
          <MemberAccessModal
            workspaceId={workspaceId}
            boardId={(currentBoardId as any) || undefined}
          />
        </div>
      </WorkspaceSection>
    </div>
  );
};
