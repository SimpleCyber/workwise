"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HashIcon,
  Search,
  Bell,
  Settings,
  MessageSquareText,
  Plus,
  Loader,
  TriangleAlert,
} from "lucide-react";

import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useGetChannels } from "@/features/channels/api/use-get-channels";
import { useCreateChannelModal } from "@/features/channels/store/use-create-channel-modal";

import { useMobile } from "@/hooks/use-mobile";
import { useWorkspaceId } from "@/hooks/use-workspace-id";

import { Button } from "@/components/ui/button";

import { WorkspaceSidebarContent } from "./workspace-sidebar-content";
import { SidebarItem } from "./sidebar-item";
import { UserItem } from "./user-item";
import { WorkspaceSection } from "./workspace-section";

const WorkspaceIdPage = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const isMobile = useMobile();
  const [open, setOpen] = useCreateChannelModal();

  const { data: workspaceInfo, isLoading: workspaceLoading } =
    useGetWorkspaceInfo({
      id: workspaceId,
    });
  const { data: workspace } = useGetWorkspace({ id: workspaceId });
  const { data: channels, isLoading: channelsLoading } = useGetChannels({
    workspaceId,
  });

  const channelId = useMemo(() => channels?.[0]?._id, [channels]);

  useEffect(() => {
    if (isMobile === undefined) return;
    if (isMobile) return;
    if (workspaceLoading || channelsLoading || !workspaceInfo) return;

    if (channelId)
      router.replace(`/workspace/${workspaceId}/channel/${channelId}`);
    else if (!open && workspaceInfo.role === "admin") setOpen(true);
  }, [
    channelId,
    workspaceLoading,
    channelsLoading,
    workspaceInfo,
    open,
    setOpen,
    router,
    workspaceId,
    isMobile,
  ]);

  if (workspaceLoading || channelsLoading) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 bg-background">
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workspaceId || !workspaceInfo) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 bg-background">
        <TriangleAlert className="size-5 text-muted-foreground" />
        <span className="text-sm">Workspace not found.</span>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-background pb-20">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-x-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 shrink-0">
              {workspace?.name?.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-xl font-bold truncate max-w-[200px]">
              {workspace?.name}
            </h1>
          </div>
          <div className="flex items-center gap-x-1">
            <Button variant="ghost" size="icon" className="size-9">
              <Search className="size-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="size-9">
              <Settings className="size-5 text-muted-foreground" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-2 pt-4">
          <div className="px-3 mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Conversations
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              onClick={() => setOpen(true)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <WorkspaceSidebarContent />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 bg-gray-900/95 text-white">
      <TriangleAlert className="size-5" />
      <span className="text-sm">No Channel(s) found.</span>
    </div>
  );
};

export default WorkspaceIdPage;
