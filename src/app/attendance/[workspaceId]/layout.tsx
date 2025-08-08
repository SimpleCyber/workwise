"use client";

import type { PropsWithChildren } from "react";
import WorkspaceLayout from "@/components/workspace-sidebar/workspace-sidebar-layout";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";

const AttendanceWorkspaceLayout = ({
  children,
}: Readonly<PropsWithChildren>) => {
  return (
    <WorkspaceLayout
      autoSaveId="attendance-workspace-layout"
      sidebarContent={<WorkspaceSidebarContent />}
    >
      {children}
    </WorkspaceLayout>
  );
};

export default AttendanceWorkspaceLayout;
