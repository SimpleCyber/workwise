"use client";

import type { PropsWithChildren } from "react";
import WorkspaceLayout from "@/components/workspace-sidebar/workspace-sidebar-layout";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";
import { FeatureGuard } from "@/components/feature-flags";
import { useAtom, useAtomValue } from "jotai";
import {
  selectedProjectTaskAtom,
  projectTaskViewModeAtom,
} from "@/lib/panel-atoms";
import { ProjectTaskDetailPanel } from "@/features/projects/components/project-task-detail-panel";
import { ProjectTaskDetailModal } from "@/features/projects/components/project-task-detail-modal";

const ProjectsWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  const [selectedTask, setSelectedTask] = useAtom(selectedProjectTaskAtom);
  const viewMode = useAtomValue(projectTaskViewModeAtom);

  const rightPanel =
    selectedTask && viewMode === "panel" ? (
      <ProjectTaskDetailPanel />
    ) : undefined;

  return (
    <FeatureGuard flag="projects">
      <WorkspaceLayout
        autoSaveId="projects-workspace-layout"
        sidebarContent={<WorkspaceSidebarContent />}
        rightPanel={rightPanel}
      >
        {children}
      </WorkspaceLayout>
      {viewMode === "modal" && selectedTask && <ProjectTaskDetailModal />}
    </FeatureGuard>
  );
};

export default ProjectsWorkspaceLayout;
