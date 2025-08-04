"use client";

import {
  Kanban,
  ListTodo,
  MessagesSquare,
  AlignStartHorizontal,
  UserRoundSearch,
  Calendar,
  Files,
  Network,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@/features/auth/components/user-button";
import { SidebarButton } from "./sidebar-button";
import { WorkspaceSwitcher } from "../workspace-header/workspace-switcher";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { WorkspaceManageButton } from "./workspace-manage";

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const workspaceId = useWorkspaceId();

  const navigationItems = [
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
    // {
    //   icon: AlignStartHorizontal,
    //   label: "Test",
    //   path: `/test/${workspaceId}`,
    //   delay: "delay-[350ms]"
    // },
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
          <UserButton />
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[60px] flex-col items-center gap-y-4 bg-gray-900 pb-[4px] pt-[9px] border-r border-gray-800 relative">
      {/* Subtle animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900/95 to-gray-900 opacity-80" />

      {/* Content with stagger animations */}
      <div className="relative z-10 flex h-full w-full flex-col items-center gap-y-4">
        <div>
          <WorkspaceSwitcher />
        </div>

        {/* Navigation items with staggered entrance - centered */}
        <div className="flex flex-1 flex-col items-center justify-center gap-y-2">
          {navigationItems.map((item, index) => (
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

        <div className="mt-auto flex flex-col items-center justify-center gap-y-1 ">
          <UserButton />
        </div>
      </div>

      {/* Subtle side glow effect */}
      <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
    </aside>
  );
};
