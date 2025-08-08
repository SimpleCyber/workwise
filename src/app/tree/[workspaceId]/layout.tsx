"use client";

import type { PropsWithChildren } from "react";
import WorkspaceLayout from "@/components/sidebar/workspace-layout";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";

const TreeWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <WorkspaceLayout
      autoSaveId="tree-workspace-layout"
      defaultPanelSize={25}
      maxPanelSize={30}
      sidebarContent={<WorkspaceSidebarContent />}
    >
      {children}
    </WorkspaceLayout>
  );
};

export default TreeWorkspaceLayout;
