"use client";

import type { PropsWithChildren } from "react";
import WorkspaceLayout from "@/components/sidebar/workspace-layout";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";

const AttendanceWorkspaceLayout = ({
  children,
}: Readonly<PropsWithChildren>) => {
  return (
    <WorkspaceLayout
      autoSaveId="attendance-workspace-layout"
      defaultPanelSize={20}
      maxPanelSize={30}
      minPanelSize={0}
      mainPanelMinSize={20}
      sidebarContent={<WorkspaceSidebarContent />}
    >
      {children}
    </WorkspaceLayout>
  );
};

export default AttendanceWorkspaceLayout;
