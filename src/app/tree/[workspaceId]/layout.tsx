"use client"

import type { PropsWithChildren } from "react"
import { Sidebar } from "@/components/sidebar/sidebar"
import { Toolbar } from "@/components/toolbar/toolbar"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { WorkspaceSidebar } from "@/components/workspace-header/workspace-sidebar"
import { WorkspaceSidebarContent } from "./workspace-sidebar-content"
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info"
import { Loader2, TriangleAlert } from "lucide-react"
import type { Id } from "../../../../convex/_generated/dataModel"
import { useParams } from "next/navigation"

const TreeWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  const params = useParams()
  const workspaceId = params.workspaceId as Id<"workspaces">

  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspaceInfo({
    id: workspaceId,
  })

  return (
    <div className="h-full">
      <Toolbar />
      <div className="flex h-[calc(100vh_-_40px)]">
        <Sidebar />
        <ResizablePanelGroup direction="horizontal" autoSaveId="tree-workspace-layout">
          <ResizablePanel defaultSize={20} minSize={11} className="bg-gray-900">
            <WorkspaceSidebar>
              <WorkspaceSidebarContent />
            </WorkspaceSidebar>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={80} minSize={20} className="flex flex-col">
            {/* Header moved here */}
            <div className="flex h-[49px] items-center border-b bg-white px-4 flex-shrink-0">
              {workspaceLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  <span className="text-lg font-semibold">Loading...</span>
                </div>
              ) : workspace ? (
                <h1 className="text-lg font-semibold">All Data - {workspace.name}</h1>
              ) : (
                <div className="flex items-center gap-2">
                  <TriangleAlert className="size-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">Workspace not found</span>
                </div>
              )}
            </div>
            {/* Content area with full remaining height */}
            <div className="flex-1 overflow-hidden">{children}</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

export default TreeWorkspaceLayout
