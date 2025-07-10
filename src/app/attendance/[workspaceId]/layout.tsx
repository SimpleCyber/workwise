"use client"

import type { PropsWithChildren } from "react"
import { Sidebar } from "@/components/sidebar/sidebar"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Toolbar } from "@/components/toolbar/toolbar"
import { WorkspaceSidebar } from "@/components/workspace-header/workspace-sidebar"
import { WorkspaceSidebarContent } from "./workspace-sidebar-content"

const AttendanceWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <div className="h-full">
      <Toolbar />
      <div className="flex h-[calc(100vh_-_40px)]">
        <Sidebar />
        <ResizablePanelGroup direction="horizontal" autoSaveId="attendance-workspace-layout">
          <ResizablePanel defaultSize={20} minSize={11} className="bg-[#5E2C5F]">
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
  )
}

export default AttendanceWorkspaceLayout
