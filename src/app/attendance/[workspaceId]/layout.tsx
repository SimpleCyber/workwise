"use client";

import type { PropsWithChildren } from "react";
import WorkspaceLayout from "@/components/workspace-sidebar/workspace-sidebar-layout";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";
import { FeatureGuard } from "@/components/feature-flags";

const AttendanceWorkspaceLayout = ({
  children,
}: Readonly<PropsWithChildren>) => {
  return (
    <FeatureGuard flag="attendance">
      <WorkspaceLayout
        autoSaveId="attendance-workspace-layout"
        sidebarContent={<WorkspaceSidebarContent />}
      >
        {children}
      </WorkspaceLayout>
    </FeatureGuard>
  );
};

export default AttendanceWorkspaceLayout;
