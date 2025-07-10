'use client';

import { HashIcon, MessageSquareText, SendHorizonal, Loader } from 'lucide-react';
import { useGetChannels } from '@/features/channels/api/use-get-channels';
import { useCreateChannelModal } from '@/features/channels/store/use-create-channel-modal';
import { useCurrentMember } from '@/features/members/api/use-current-member';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useChannelId } from '@/hooks/use-channel-id';
import { useMemberId } from '@/hooks/use-member-id';
import { useWorkspaceId } from '@/hooks/use-workspace-id';

import { SidebarItem } from '@/app/workspace/[workspaceId]/sidebar-item';
import { UserItem } from '@/app/workspace/[workspaceId]/user-item';
import { WorkspaceSection } from '@/app/workspace/[workspaceId]/workspace-section';

export const WorkspaceSidebarContent = () => {
  const workspaceId = useWorkspaceId();
  const channelId = useChannelId();
  const memberId = useMemberId();

  const [_open, setOpen] = useCreateChannelModal();

  const { data: member } = useCurrentMember({ workspaceId });
  const { data: channels, isLoading: channelsLoading } = useGetChannels({ workspaceId });
  const { data: members, isLoading: membersLoading } = useGetMembers({ workspaceId });

  if (channelsLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader className="size-4 animate-spin text-white" />
      </div>
    );
  }

  return (
    <>
      <div className="mt-3 flex flex-col px-2">
        <SidebarItem label="Threads" icon={MessageSquareText} id="threads" />
        <SidebarItem label="Drafts & Sent" icon={SendHorizonal} id="draft" />
      </div>

      {channels && channels.length !== 0 && (
        <WorkspaceSection label="Channels" hint="New Channel" onNew={member?.role === 'admin' ? () => setOpen(true) : undefined}>
          {channels?.map((item) => (
            <SidebarItem
              variant={channelId === item._id ? 'active' : 'default'}
              key={item._id}
              id={item._id}
              icon={HashIcon}
              label={item.name}
            />
          ))}
        </WorkspaceSection>
      )}

      {members && members.length !== 0 && (
        <WorkspaceSection label="Direct Messages" hint="New Direct Message" onNew={member?.role === 'admin' ? () => {} : undefined}>
          {members?.map((item) => (
            <UserItem
              key={item._id}
              id={item._id}
              label={item.user.name}
              image={item.user.image}
              variant={item._id === memberId ? 'active' : 'default'}
            />
          ))}
        </WorkspaceSection>
      )}
    </>
  );
};