"use client";

import type { PropsWithChildren } from "react";
import WorkspaceLayout from "@/components/workspace-sidebar/workspace-sidebar-layout";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";

const ProjectsWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <WorkspaceLayout
      autoSaveId="projects-workspace-layout"
      sidebarContent={<WorkspaceSidebarContent />}
    >
      {children}
    </WorkspaceLayout>
  );
};

export default ProjectsWorkspaceLayout;
