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
  TestTubeDiagonalIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@/features/auth/components/user-button";
import { SidebarButton } from "./sidebar-button";
import { WorkspaceSwitcher } from "../workspace-sidebar/workspace-sidebar-switcher";
import { useWorkspaceId } from "@/hooks/use-workspace-id";

import { PanelButtons } from "./notification-calender-button";

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

  const navigationItems = [
    {
      icon: TestTubeDiagonalIcon,
      label: "Testing",
      path: `/test/${workspaceId}`,
      delay: "delay-[50ms]",
    },
    {
      icon: Network,
      label: "All Data",
      path: `/tree/${workspaceId}`,
      delay: "delay-[50ms]",
    },
    {
      icon: Kanban,
      label: "ToDo",
      path: `/todo/${workspaceId}`,
      delay: "delay-[100ms]",
    },
    {
      icon: ListTodo,
      label: "Project",
      path: `/projects/${workspaceId}`,
      delay: "delay-[150ms]",
    },
    {
      icon: MessagesSquare,
      label: "Chat",
      path: `/workspace/${workspaceId}`,
      delay: "delay-[200ms]",
    },
    {
      icon: Files,
      label: "Files",
      path: `/data-room/${workspaceId}`,
      delay: "delay-[250ms]",
    },
    {
      icon: Calendar,
      label: "Attend",
      path: `/attendance/${workspaceId}`,
      delay: "delay-[300ms]",
    },
  ];

  const handleNavigation = (path: string) => {
    if (workspaceId) {
      router.push(path);
    }
  };

  if (!workspaceId) {
    return (
      <aside className="flex h-full w-[60px] flex-col items-center gap-y-4 bg-gray-900 pb-[4px] pt-[9px] border-r border-gray-800">
        <div className="animate-in fade-in-0 slide-in-from-left-5 duration-500">
          <WorkspaceSwitcher />
        </div>
        <div className="mt-auto flex flex-col items-center justify-center gap-y-1 animate-in fade-in-0 slide-in-from-bottom-5 duration-500 delay-300">
          {/* Place PanelButtons above UserButton */}
          <PanelButtons />
          <UserButton />
        </div>
      </aside>
    );
  }
  return (
    <aside className="flex h-full w-[60px] flex-col items-center gap-y-4 bg-gray-900 pb-[4px] pt-[9px] border-r border-gray-800 relative">
      {/* Subtle animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900/95 to-gray-900 opacity-80" />

      <div className="relative z-10 flex h-full w-full flex-col items-center gap-y-4">
        <div>
          <WorkspaceSwitcher />
        </div>

        {onToggleWorkspacePanel && (
          <div className="flex flex-col gap-y-1">
            <button
              onClick={onToggleWorkspacePanel}
              className="group relative flex h-9 w-9 items-center justify-center rounded-md text-gray-400 transition-all duration-200 hover:bg-gray-800 hover:text-white"
            >
              {isWorkspacePanelCollapsed ? (
                <PanelLeftOpen className="h-4 w-4 transition-transform group-hover:scale-110" />
              ) : (
                <PanelLeftClose className="h-4 w-4 transition-transform group-hover:scale-110" />
              )}

              <div className="absolute left-full ml-2 hidden group-hover:block z-50">
                <div className="whitespace-nowrap rounded-md bg-gray-300 px-2 py-1 text-xs text-black shadow-lg border border-gray-700 animate-in fade-in-0 zoom-in-95 duration-200">
                  {isWorkspacePanelCollapsed ? "Open Panel" : "Close Panel"}
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-300 -ml-1" />
                </div>
              </div>
            </button>
          </div>
        )}

        <div className="flex flex-1 flex-col items-center justify-center gap-y-2">
          {navigationItems.map((item) => (
            <div key={item.path}>
              <SidebarButton
                icon={item.icon}
                label={item.label}
                isActive={pathname.includes(item.path)}
                onClick={() => handleNavigation(item.path)}
              />
            </div>
          ))}
        </div>

        <div className="mt-auto flex flex-col items-center justify-center gap-y-1">
          {/* Add PanelButtons here, above UserButton */}
          <PanelButtons />
          <UserButton />
        </div>
      </div>

      <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
    </aside>
  );
};
