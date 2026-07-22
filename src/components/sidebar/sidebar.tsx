"use client";

import {
  Kanban,
  ListTodo,
  MessagesSquare,
  Calendar,
  Files,
  Network,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@/features/auth/components/user-button";
import { SidebarButton } from "./sidebar-button";
import { WorkspaceSwitcher } from "../workspace-sidebar/workspace-sidebar-switcher";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { usePinnedBoard } from "@/hooks/use-pinned-board";
import { useFeatureFlags } from "@/components/feature-flags";

import { PanelButtons } from "./notification-calender-button";
import type { Id } from "../../../convex/_generated/dataModel";

interface SidebarProps {
  isWorkspacePanelCollapsed?: boolean;
  onToggleWorkspacePanel?: () => void;
}

export const Sidebar = ({
  isWorkspacePanelCollapsed = false,
  onToggleWorkspacePanel,
}: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const { isEnabled } = useFeatureFlags();

  // Cast workspaceId to the proper type
  const typedWorkspaceId = workspaceId as Id<"workspaces"> | null;
  const pinnedBoard = usePinnedBoard(typedWorkspaceId);

  const navigationItems = [
    {
      icon: Network,
      label: "Planning",
      path: `/test/${workspaceId}`,
      flag: "tree_planning",
    },
    {
      icon: ListTodo,
      label: "Project",
      path: `/projects/${workspaceId}`,
      flag: "projects",
    },
    {
      icon: MessagesSquare,
      label: "Chat",
      path: `/workspace/${workspaceId}`,
      flag: "messaging",
    },
    {
      icon: Kanban,
      label: "ToDo",
      path:
        pinnedBoard && pinnedBoard.length > 0
          ? `/todo/${workspaceId}/board/${pinnedBoard[0]._id}`
          : `/todo/${workspaceId}`,
      isPinned: pinnedBoard && pinnedBoard.length > 0,
      flag: "todos",
    },

    {
      icon: Files,
      label: "Documents",
      path: `/data-room/${workspaceId}`,
      flag: "data_room",
    },
    {
      icon: Calendar,
      label: "Attendance",
      path: `/attendance/${workspaceId}`,
      flag: "attendance",
    },
  ];

  const handleNavigation = (path: string, label?: string) => {
    if (workspaceId) {
      if (label === "Chat" && pathname.includes(`/test/${workspaceId}`)) {
        const currentUrl = new URL(window.location.href);
        const isSidebarOpen = currentUrl.searchParams.get("sidebar") === "true";

        if (isSidebarOpen) {
          currentUrl.searchParams.set("sidebar", "true");
          currentUrl.searchParams.set("tab", "chat");
          if (currentUrl.searchParams.has("boardId")) {
            router.push(currentUrl.toString());
            return;
          }
        }
      }
      router.push(path);
    }
  };

  const visibleNavigationItems = navigationItems.filter(
    (item) => !item.flag || isEnabled(item.flag),
  );

  if (!workspaceId) {
    return (
      <aside className="hidden md:flex h-full w-[60px] flex-col items-center gap-y-4 bg-gray-900 pb-[4px] pt-[9px] border-r border-gray-800">
        <div className="animate-in fade-in-0 slide-in-from-left-5 duration-500">
          <WorkspaceSwitcher />
        </div>
        <div className="mt-auto flex flex-col items-center justify-center gap-y-1 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 delay-300">
          <PanelButtons />
          <UserButton />
        </div>
      </aside>
    );
  }
  return (
    <aside className="hidden md:flex h-full w-[60px] flex-col items-center gap-y-4 bg-sidebar pb-[4px] pt-[9px] border-r border-sidebar-border relative">
      <div className="relative z-10 flex h-full w-full flex-col items-center gap-y-4">
        <div>
          <WorkspaceSwitcher />
        </div>

        {onToggleWorkspacePanel && (
          <div className="flex flex-col gap-y-1">
            <button
              onClick={onToggleWorkspacePanel}
              className="group relative flex h-9 w-9 items-center justify-center rounded-md text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              {isWorkspacePanelCollapsed ? (
                <PanelLeftOpen className="h-4 w-4 transition-transform group-hover:scale-110" />
              ) : (
                <PanelLeftClose className="h-4 w-4 transition-transform group-hover:scale-110" />
              )}

              <div className="absolute left-full ml-2 hidden group-hover:block z-50">
                <div className="whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-lg border border-border animate-in fade-in-0 zoom-in-95 duration-200">
                  {isWorkspacePanelCollapsed ? "Open Panel" : "Close Panel"}
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-popover -ml-1" />
                </div>
              </div>
            </button>
          </div>
        )}

        <div className="flex flex-1 flex-col items-center justify-center gap-y-2">
          {visibleNavigationItems.map((item) => (
            <div key={item.path}>
              <SidebarButton
                icon={item.icon}
                label={item.label}
                isActive={pathname.includes(item.path)}
                onClick={() => handleNavigation(item.path, item.label)}
              />
            </div>
          ))}
        </div>

        <div className="mt-auto flex flex-col items-center justify-center gap-y-1">
          <PanelButtons />
          <UserButton />
        </div>
      </div>
    </aside>
  );
};
