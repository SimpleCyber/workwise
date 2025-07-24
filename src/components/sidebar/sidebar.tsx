"use client";

import {
  Kanban,
  ListTodo,
  MessagesSquare,
  Presentation,
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

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  // Use the current workspace ID from URL instead of always using the first one
  const workspaceId = useWorkspaceId();

  const navigationItems = [
    { icon: Network, label: "All Data", path: `/tree/${workspaceId}` },
    { icon: Kanban, label: "ToDo", path: `/todo/${workspaceId}` },
    { icon: ListTodo, label: "Project", path: `/projects/${workspaceId}` },
    { icon: Files, label: "Data", path: `/data-room/${workspaceId}` },
    { icon: MessagesSquare, label: "Chat", path: `/workspace/${workspaceId}` },
    {
      icon: UserRoundSearch,
      label: "Member",
      path: `/members/${workspaceId}`,
    },
    { icon: Calendar, label: "Attendence", path: `/attendance/${workspaceId}` },
  ];

  const handleNavigation = (path: string) => {
    // Only navigate if we have a valid workspace ID
    if (workspaceId) {
      router.push(path);
    }
  };

  // Don't render navigation items if we don't have a workspace ID
  if (!workspaceId) {
    return (
      <aside className="flex h-full w-[60px] flex-col items-center gap-y-4 bg-gray-900 pb-[4px] pt-[9px]">
        <WorkspaceSwitcher />
        <div className="mt-auto flex flex-col items-center justify-center gap-y-1">
          <UserButton />
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[60px] flex-col items-center gap-y-4 bg-gray-900 pb-[4px] pt-[9px]">
      <WorkspaceSwitcher />
      {navigationItems.map((item) => (
        <SidebarButton
          key={item.path}
          icon={item.icon}
          label={item.label}
          isActive={pathname.includes(item.path)}
          onClick={() => handleNavigation(item.path)}
        />
      ))}
      <div className="mt-auto flex flex-col items-center justify-center gap-y-1">
        <UserButton />
      </div>
    </aside>
  );
};
