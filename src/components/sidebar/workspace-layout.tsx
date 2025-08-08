"use client";

import type { PropsWithChildren } from "react";
import { Sidebar } from "@/components/sidebar/sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { WorkspaceSidebar } from "@/components/workspace-header/workspace-sidebar";
import { useWorkspacePanel } from "./use-workspace-panel";

interface WorkspaceLayoutProps extends PropsWithChildren {
  autoSaveId: string;
  defaultPanelSize?: number;
  maxPanelSize?: number;
  minPanelSize?: number;
  mainPanelMinSize?: number;
  mainPanelDefaultSize?: number;
  sidebarContent?: React.ReactNode;
  showToolbar?: boolean;
  toolbarComponent?: React.ReactNode;
  rightPanel?: React.ReactNode;
  rightPanelMinSize?: number;
  rightPanelDefaultSize?: number;
  heightOffset?: string;
}

const WorkspaceLayout = ({
  children,
  autoSaveId,
  defaultPanelSize = 20,
  maxPanelSize = 30,
  minPanelSize = 0,
  mainPanelMinSize = 20,
  mainPanelDefaultSize,
  sidebarContent,
  showToolbar = false,
  toolbarComponent,
  rightPanel,
  rightPanelMinSize = 20,
  rightPanelDefaultSize = 29,
  heightOffset = "0px",
}: WorkspaceLayoutProps) => {
  const { leftPanelRef, isCollapsed, togglePanel, handlePanelResize } =
    useWorkspacePanel(defaultPanelSize);

  // Calculate main panel default size
  const calculatedMainPanelSize =
    mainPanelDefaultSize || (rightPanel ? 51 : 100 - defaultPanelSize);

  return (
    <div className="h-full">
      {showToolbar && toolbarComponent}
      <div className={`flex h-[calc(100vh_-_${heightOffset})]`}>
        <Sidebar
          isWorkspacePanelCollapsed={isCollapsed}
          onToggleWorkspacePanel={togglePanel}
        />

        <ResizablePanelGroup direction="horizontal" autoSaveId={autoSaveId}>
          <ResizablePanel
            ref={leftPanelRef}
            defaultSize={defaultPanelSize}
            minSize={minPanelSize}
            maxSize={maxPanelSize}
            className="bg-gray-900"
            onResize={handlePanelResize}
          >
            <WorkspaceSidebar>{sidebarContent}</WorkspaceSidebar>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            defaultSize={calculatedMainPanelSize}
            minSize={mainPanelMinSize}
            className="flex flex-col"
          >
            <div className="flex-1 overflow-hidden">{children}</div>
          </ResizablePanel>

          {rightPanel && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel
                minSize={rightPanelMinSize}
                defaultSize={rightPanelDefaultSize}
              >
                {rightPanel}
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
