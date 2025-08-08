"use client";

import { Loader } from "lucide-react";
import type { PropsWithChildren } from "react";
import type { Id } from "@/../convex/_generated/dataModel";
import WorkspaceLayout from "@/components/workspace-sidebar/workspace-sidebar-layout";
import { Profile } from "@/features/members/components/profile";
import { Thread } from "@/features/messages/components/thread";
import { usePanel } from "@/hooks/use-panel";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";

const WorkspaceIdLayout = ({ children }: Readonly<PropsWithChildren>) => {
  const { parentMessageId, profileMemberId, onClose } = usePanel();
  const showPanel = !!parentMessageId || !!profileMemberId;

  // Create the right panel content conditionally
  const rightPanelContent = showPanel ? (
    parentMessageId ? (
      <Thread messageId={parentMessageId as Id<"messages">} onClose={onClose} />
    ) : profileMemberId ? (
      <Profile memberId={profileMemberId as Id<"members">} onClose={onClose} />
    ) : (
      <div className="flex h-full items-center justify-center">
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  ) : undefined;

  return (
    <WorkspaceLayout
      autoSaveId="woodls-workspace-layout"
      sidebarContent={<WorkspaceSidebarContent />}
    >
      {children}
    </WorkspaceLayout>
  );
};

export default WorkspaceIdLayout;
