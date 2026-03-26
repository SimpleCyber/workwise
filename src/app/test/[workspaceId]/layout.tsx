"use client";

import type { PropsWithChildren } from "react";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";
import WorkspaceLayout from "@/components/workspace-sidebar/workspace-sidebar-layout";
import { FeatureGuard } from "@/components/feature-flags";

const TreeWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <FeatureGuard flag="tree_planning">
      <WorkspaceLayout
        autoSaveId="todo-workspace-layout"
        sidebarContent={<WorkspaceSidebarContent />}
      >
        {children}
      </WorkspaceLayout>
    </FeatureGuard>
  );
};

export default TreeWorkspaceLayout;
