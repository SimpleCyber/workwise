"use client";

import type { PropsWithChildren } from "react";
import { Sidebar } from "@/components/sidebar/sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { WorkspaceSidebar } from "@/components/workspace-sidebar/workspace-sidebar";
import { useWorkspacePanel } from "./use-workspace-sidebar-panel-context";
import { BottomNav } from "@/components/sidebar/bottom-nav";

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
  hideMobileNav?: boolean;
  onClose?: () => void;
}

import { useMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

const WorkspaceLayout = ({
  children,
  autoSaveId,
  defaultPanelSize = 20,
  maxPanelSize = 15,
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
  hideMobileNav = false,
  onClose,
}: WorkspaceLayoutProps) => {
  const isMobile = useMobile();
  const { leftPanelRef, isCollapsed, togglePanel, handlePanelResize } =
    useWorkspacePanel(defaultPanelSize);

  // Calculate main panel default size
  const calculatedMainPanelSize =
    mainPanelDefaultSize || (rightPanel ? 51 : 100 - defaultPanelSize);

  return (
    <div className="h-full">
      {showToolbar && toolbarComponent}
      <div className="flex h-[100vh]">
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
            className="hidden md:block bg-sidebar"
            onResize={handlePanelResize}
          >
            <WorkspaceSidebar>{sidebarContent}</WorkspaceSidebar>
          </ResizablePanel>

          <ResizableHandle withHandle className="hidden md:flex" />

          <ResizablePanel
            defaultSize={calculatedMainPanelSize}
            minSize={mainPanelMinSize}
            className="flex flex-col h-full w-full"
          >
            <div
              className={`flex-1 overflow-y-auto md:mb-0 ${hideMobileNav ? "" : "mb-16"}`}
            >
              {children}
            </div>
          </ResizablePanel>

          {rightPanel && (
            <>
              <ResizableHandle withHandle className="hidden md:flex" />
              <ResizablePanel
                minSize={rightPanelMinSize}
                defaultSize={rightPanelDefaultSize}
                className="hidden md:block"
              >
                {rightPanel}
              </ResizablePanel>

              {/* Mobile Drawer for Right Panel (Threads/Profiles) */}
              {isMobile && (
                <Drawer
                  open={!!rightPanel}
                  onOpenChange={(open) => {
                    if (!open && onClose) {
                      onClose();
                    }
                  }}
                >
                  <DrawerContent className="h-[92vh]">
                    <div className="h-full overflow-y-auto pt-2">
                      {/* Handle for visual indicator (drawer style) */}
                      <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-4 shrink-0" />
                      {rightPanel}
                    </div>
                  </DrawerContent>
                </Drawer>
              )}
            </>
          )}
        </ResizablePanelGroup>
      </div>
      {!hideMobileNav && <BottomNav />}
    </div>
  );
};

export default WorkspaceLayout;
