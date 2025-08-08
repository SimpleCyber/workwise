"use client";

import type { PropsWithChildren } from "react";
import WorkspaceLayout from "@/components/workspace-sidebar/workspace-sidebar-layout";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";

const DataRoomWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <WorkspaceLayout
      autoSaveId="data-room-workspace-layout"
      sidebarContent={<WorkspaceSidebarContent />}
    >
      {children}
    </WorkspaceLayout>
  );
};

export default DataRoomWorkspaceLayout;
