"use client";

import type { PropsWithChildren } from "react";
import WorkspaceLayout from "@/components/workspace-sidebar/workspace-sidebar-layout";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";
import { FeatureGuard } from "@/components/feature-flags";

const TodoWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <FeatureGuard flag="todos">
      <WorkspaceLayout
        autoSaveId="todo-workspace-layout"
        sidebarContent={<WorkspaceSidebarContent />}
      >
        {children}
      </WorkspaceLayout>
    </FeatureGuard>
  );
};

export default TodoWorkspaceLayout;
