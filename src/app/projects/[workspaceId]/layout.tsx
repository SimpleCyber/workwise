"use client";

import type { PropsWithChildren } from "react";
import WorkspaceLayout from "@/components/sidebar/workspace-layout";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";

const ProjectsWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <WorkspaceLayout
      autoSaveId="projects-workspace-layout"
      defaultPanelSize={20}
      maxPanelSize={30}
      minPanelSize={0}
      mainPanelMinSize={0}
      sidebarContent={<WorkspaceSidebarContent />}
    >
      {children}
    </WorkspaceLayout>
  );
};

export default ProjectsWorkspaceLayout;
