"use client";

import type { PropsWithChildren } from "react";
import WorkspaceLayout from "@/components/sidebar/workspace-layout";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";

const DataRoomWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <WorkspaceLayout
      autoSaveId="data-room-workspace-layout"
      defaultPanelSize={20}
      maxPanelSize={30}
      sidebarContent={<WorkspaceSidebarContent />}
    >
      {children}
    </WorkspaceLayout>
  );
};

export default DataRoomWorkspaceLayout;
