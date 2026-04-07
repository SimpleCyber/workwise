"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useGetTreeData } from "@/features/test/api/use-get-tree-data";
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info";
import { TreeFlow } from "@/features/test/components/tree-flow";
import { ProjectSidebarKanban } from "@/features/projects/components/project-sidebar-kanban";

export default function TreeWorkspacePage({
  params,
}: {
  params: { workspaceId: Id<"workspaces"> };
}) {
  const { workspaceId } = params;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] =
    useState<Id<"projectBoards"> | null>(null);
  const [activeTab, setActiveTab] = useState<"tasks" | "chat">("tasks");

  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspaceInfo({
    id: workspaceId,
  });

  const isMobile = useMobile();

  const { data: treeData, isLoading: treeLoading } = useGetTreeData({
    workspaceId,
  });

  // Handle sidebar state from URL params
  useEffect(() => {
    const shouldShowSidebar = searchParams.get("sidebar") === "true";
    const boardId = searchParams.get("boardId") as Id<"projectBoards"> | null;
    const tab = searchParams.get("tab") as "tasks" | "chat" | null;

    if (boardId && shouldShowSidebar) {
      setSelectedBoardId(boardId);
      setSidebarOpen(true);
      if (tab) setActiveTab(tab);
    } else {
      setSidebarOpen(false);
      setSelectedBoardId(null);
    }
  }, [searchParams]);

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedBoardId(null);

    // Remove sidebar params from URL
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete("sidebar");
    currentUrl.searchParams.delete("boardId");
    router.push(currentUrl.toString());
  };

  if (workspaceLoading || treeLoading) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workspace || !treeData) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <TriangleAlert className="size-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Data not found.</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col relative">
      <div className="flex h-[49px] items-center border-b bg-background px-4">
        <h1 className="text-lg font-semibold">All Data - {workspace.name}</h1>
      </div>
      <div
        className="flex-1 overflow-auto p-6 transition-all duration-300 ease-in-out"
        style={{
          marginRight: sidebarOpen && !isMobile ? `600px` : "0px", // Dynamic margin for sidebar (matches default width)
        }}
      >
        <TreeFlow
          workspaceId={workspaceId}
          sidebarOpen={sidebarOpen}
          activeNodeId={selectedBoardId || undefined}
        />
      </div>

      {/* Project Sidebar */}
      {selectedBoardId && (
        <ProjectSidebarKanban
          workspaceId={workspaceId}
          boardId={selectedBoardId}
          isOpen={sidebarOpen}
          initialTab={activeTab}
          onClose={handleCloseSidebar}
        />
      )}
    </div>
  );
}
