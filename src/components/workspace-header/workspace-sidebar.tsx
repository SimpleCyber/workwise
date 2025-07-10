'use client';

import { AlertTriangle, Loader } from 'lucide-react';
import { useCurrentMember } from '@/features/members/api/use-current-member';
import { useGetWorkspace } from '@/features/workspaces/api/use-get-workspace';
import { useWorkspaceId } from '@/hooks/use-workspace-id';
import { WorkspaceHeader } from './workspace-header';

interface WorkspaceSidebarProps {
  children: React.ReactNode;
}

export const WorkspaceSidebar = ({ children }: WorkspaceSidebarProps) => {
  const workspaceId = useWorkspaceId();

  const { data: member, isLoading: memberLoading } = useCurrentMember({ workspaceId });
  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace({ id: workspaceId });

  if (memberLoading || workspaceLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#5E2C5F]">
        <Loader className="size-5 animate-spin text-white" />
      </div>
    );
  }

  if (!workspace || !member) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-y-2 bg-[#5E2C5F]">
        <AlertTriangle className="size-5 text-white" />
        <p className="text-sm text-white">Workspace not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-y-2 bg-[#5E2C5F] rounded-md">
      <WorkspaceHeader workspace={workspace} isAdmin={member.role === 'admin'} />
      {children}
    </div>
  );
};