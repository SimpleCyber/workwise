'use client';

import { Loader } from 'lucide-react';
import type { PropsWithChildren } from 'react';

import type { Id } from '@/../convex/_generated/dataModel';
import { Sidebar } from '@/components/sidebar/sidebar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Profile } from '@/features/members/components/profile';
import { Thread } from '@/features/messages/components/thread';
import { usePanel } from '@/hooks/use-panel';

import { Toolbar } from '../../../components/toolbar/toolbar';
import { WorkspaceSidebar } from '../../../components/workspace-header/workspace-sidebar';
import { WorkspaceSidebarContent } from './workspace-sidebar-content';

const WorkspaceIdLayout = ({ children }: Readonly<PropsWithChildren>) => {
  const { parentMessageId, profileMemberId, onClose } = usePanel();

  const showPanel = !!parentMessageId || !!profileMemberId;

  return (
    <div className="h-full">
      <Toolbar />

      <div className="flex h-[calc(100vh_-_40px)]">
        <Sidebar />

        <ResizablePanelGroup direction="horizontal" autoSaveId="slack-clone-workspace-layout">
          <ResizablePanel defaultSize={20} minSize={11} className="bg-[#5E2C5F] ">
            <WorkspaceSidebar>
              <WorkspaceSidebarContent />
            </WorkspaceSidebar>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={80} minSize={20}>
            {children}
          </ResizablePanel>

          {showPanel && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel minSize={20} defaultSize={29}>
                {parentMessageId ? (
                  <Thread messageId={parentMessageId as Id<'messages'>} onClose={onClose} />
                ) : profileMemberId ? (
                  <Profile memberId={profileMemberId as Id<'members'>} onClose={onClose} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Loader className="size-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default WorkspaceIdLayout;
