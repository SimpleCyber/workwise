"use client";

import type { PropsWithChildren } from "react";
import WorkspaceLayout from "@/components/workspace-sidebar/workspace-sidebar-layout";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";
import { FeatureGuard } from "@/components/feature-flags";

import { useQueryState, parseAsString } from "nuqs";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { PdfToolsPanel } from "./pdf-tools-panel";
import type { Id } from "../../../../convex/_generated/dataModel";

const DataRoomWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  const workspaceId = useWorkspaceId();
  const [tool, setTool] = useQueryState("tool", parseAsString);
  const [currentFolderId] = useQueryState("folderId", parseAsString);

  const rightPanel = tool ? (
    <PdfToolsPanel
      isOpen={!!tool}
      tool={tool}
      onClose={() => setTool(null)}
      workspaceId={workspaceId as Id<"workspaces">}
      currentFolderId={currentFolderId as Id<"dataRoomFolders"> | null}
    />
  ) : undefined;

  return (
    <FeatureGuard flag="data_room">
      <WorkspaceLayout
        autoSaveId="data-room-workspace-layout"
        sidebarContent={<WorkspaceSidebarContent />}
        rightPanel={rightPanel}
      >
        {children}
      </WorkspaceLayout>
    </FeatureGuard>
  );
};

export default DataRoomWorkspaceLayout;
