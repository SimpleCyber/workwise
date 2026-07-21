"use client";

import React, { useEffect, type PropsWithChildren } from "react";
import { Sidebar } from "@/components/sidebar/sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { WorkspaceSidebar } from "@/components/workspace-sidebar/workspace-sidebar";
import { useWorkspacePanel } from "./use-workspace-sidebar-panel-context";
import { BottomNav } from "@/components/sidebar/bottom-nav";
import { useAtom } from "jotai";
import {
  calendarOpenAtom,
  notificationOpenAtom,
  notesOpenAtom,
  selectedTodoCardAtom,
} from "@/lib/panel-atoms";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { DraggableNotificationPanel } from "@/components/notification/NotificationPanel";
import { DraggableCalendarPanel } from "@/components/calender/CalendarPanel";
import { DraggableNotesPanel } from "@/components/notes/NotesPanel";

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
  rightPanelMinSize = 25,
  rightPanelDefaultSize = 33,
  heightOffset = "0px",
  hideMobileNav = false,
  onClose,
}: WorkspaceLayoutProps) => {
  const isMobile = useMobile();
  const { leftPanelRef, isCollapsed, togglePanel, handlePanelResize } =
    useWorkspacePanel(defaultPanelSize);

  const [calendarOpen, setCalendarOpen] = useAtom(calendarOpenAtom);
  const [notificationOpen, setNotificationOpen] = useAtom(notificationOpenAtom);
  const [notesOpen, setNotesOpen] = useAtom(notesOpenAtom);
  const [, setSelectedTodoCard] = useAtom(selectedTodoCardAtom);
  const workspaceId = useWorkspaceId();

  useEffect(() => {
    if (rightPanel) {
      setCalendarOpen(false);
      setNotificationOpen(false);
      setNotesOpen(false);
    }
  }, [rightPanel, setCalendarOpen, setNotificationOpen, setNotesOpen]);

  const activeRightPanel =
    rightPanel ||
    (calendarOpen ? (
      workspaceId ? (
        <DraggableCalendarPanel workspaceId={workspaceId as any} />
      ) : null
    ) : notificationOpen ? (
      <DraggableNotificationPanel />
    ) : notesOpen ? (
      <DraggableNotesPanel />
    ) : null);

  // Calculate main panel default size
  const calculatedMainPanelSize =
    mainPanelDefaultSize || (activeRightPanel ? 47 : 100 - defaultPanelSize);

  return (
    <div className="h-full">
      {showToolbar && toolbarComponent}
      <div className="flex h-[100vh]">
        <Sidebar
          isWorkspacePanelCollapsed={isCollapsed}
          onToggleWorkspacePanel={togglePanel}
        />

        <ResizablePanelGroup
          direction="horizontal"
          key={activeRightPanel ? "with-right-panel" : "without-right-panel"}
          autoSaveId={`${autoSaveId}${activeRightPanel ? "-with-right" : ""}`}
        >
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

          {activeRightPanel && (
            <>
              <ResizableHandle withHandle className="hidden md:flex" />
              <ResizablePanel
                minSize={rightPanelMinSize}
                defaultSize={rightPanelDefaultSize}
                className="hidden md:block"
              >
                {activeRightPanel}
              </ResizablePanel>

              {/* Mobile Drawer for Right Panel (Threads/Profiles) */}
              {isMobile && (
                <Drawer
                  open={!!activeRightPanel}
                  onOpenChange={(open) => {
                    if (!open) {
                      if (onClose) onClose();
                      setCalendarOpen(false);
                      setNotificationOpen(false);
                      setNotesOpen(false);
                      setSelectedTodoCard(null);
                    }
                  }}
                >
                  <DrawerContent className="h-[92vh]">
                    <div className="h-full overflow-y-auto pt-2">
                      {/* Handle for visual indicator (drawer style) */}
                      <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-4 shrink-0" />
                      {activeRightPanel}
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
