'use client';

import { Bell, Home, Kanban, ListTodo, MessagesSquare, MoreHorizontal, Network, Presentation, UserRoundSearch, Calendar } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { UserButton } from '@/features/auth/components/user-button';

import { SidebarButton } from './sidebar-button';
import { WorkspaceSwitcher } from '../workspace-header/workspace-switcher';
import { useGetWorkspaces } from '@/features/workspaces/api/use-get-workspaces';
import {  useMemo } from 'react';

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data, isLoading } = useGetWorkspaces();

  const workspaceId = useMemo(() => data?.[0]?._id, [data]);

  const navigationItems = [
    { icon: Kanban, label: 'ToDo', path: `/todo/${workspaceId}` },
    { icon: MessagesSquare, label: 'Chat', path: `/workspace/${workspaceId}` },
    { icon: ListTodo, label: 'Project', path: `/projects/${workspaceId}` },
    { icon: Presentation, label: 'Board', path: `/board/${workspaceId}` },
    { icon: UserRoundSearch, label: 'Members', path: `/members/${workspaceId}` },
    { icon: Calendar, label: 'Attendence', path: `/attendance/${workspaceId}` },

  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <aside className="flex h-full w-[70px] flex-col items-center gap-y-4 bg-gray-900 pb-[4px] pt-[9px]">
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