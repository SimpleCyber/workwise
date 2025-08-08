"use client";

import type { PropsWithChildren } from "react";
import WorkspaceLayout from "@/components/sidebar/workspace-layout";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";

const TodoWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <WorkspaceLayout
      autoSaveId="todo-workspace-layout"
      defaultPanelSize={20}
      maxPanelSize={30}
      minPanelSize={0}
      mainPanelDefaultSize={30}
      mainPanelMinSize={0}
      sidebarContent={<WorkspaceSidebarContent />}
    >
      {children}
    </WorkspaceLayout>
  );
};

export default TodoWorkspaceLayout;
