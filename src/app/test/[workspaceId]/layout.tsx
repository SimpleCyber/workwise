"use client";

import type { PropsWithChildren } from "react";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";
import WorkspaceLayout from "@/components/workspace-sidebar/workspace-sidebar-layout";

const TreeWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <WorkspaceLayout
      autoSaveId="todo-workspace-layout"
      sidebarContent={<WorkspaceSidebarContent />}
    >
      {children}
    </WorkspaceLayout>
  );
};

export default TreeWorkspaceLayout;
