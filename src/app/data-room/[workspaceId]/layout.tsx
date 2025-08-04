"use client";

import type { PropsWithChildren } from "react";
import { Sidebar } from "@/components/sidebar/sidebar";
import { Toolbar } from "@/components/toolbar/toolbar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { WorkspaceSidebar } from "@/components/workspace-header/workspace-sidebar";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";

const DataRoomWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <div className="h-full">
      <Toolbar />
      <div className="flex h-[calc(100vh_-_40px)]">
        <Sidebar />
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId="data-room-workspace-layout"
        >
          <ResizablePanel
            defaultSize={20}
            minSize={0}
            maxSize={30}
            className="bg-gray-900"
          >
            <WorkspaceSidebar>
              <WorkspaceSidebarContent />
            </WorkspaceSidebar>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={80} minSize={20}>
            {children}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default DataRoomWorkspaceLayout;
