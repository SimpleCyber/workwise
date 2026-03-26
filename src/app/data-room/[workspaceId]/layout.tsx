"use client";

import type { PropsWithChildren } from "react";
import WorkspaceLayout from "@/components/workspace-sidebar/workspace-sidebar-layout";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";
import { FeatureGuard } from "@/components/feature-flags";

const DataRoomWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <FeatureGuard flag="data_room">
      <WorkspaceLayout
        autoSaveId="data-room-workspace-layout"
        sidebarContent={<WorkspaceSidebarContent />}
      >
        {children}
      </WorkspaceLayout>
    </FeatureGuard>
  );
};

export default DataRoomWorkspaceLayout;
