"use client";

import type { PropsWithChildren } from "react";
import WorkspaceLayout from "@/components/workspace-sidebar/workspace-sidebar-layout";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";

const TreeWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <div className="h-full">
      <WorkspaceLayout
        autoSaveId="tree-workspace-layout"
        sidebarContent={<WorkspaceSidebarContent />}
      >
        {children}
      </WorkspaceLayout>
    </div>
  );
};

export default TreeWorkspaceLayout;
