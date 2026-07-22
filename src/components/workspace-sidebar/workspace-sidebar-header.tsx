"use client";

import {
  ChevronDown,
  ListFilter,
  SquarePen,
  Plus,
  Archive,
  Upload,
  FolderPlus,
  Clock,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Doc } from "@/../convex/_generated/dataModel";
import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { InviteModal } from "../../app/workspace/[workspaceId]/invite-modal";
import { PreferencesModal } from "../../app/workspace/[workspaceId]/preferences-modal";
import { useCreateChannelModal } from "@/features/channels/store/use-create-channel-modal";
import { useCreateProjectBoardModal } from "@/features/projects/store/use-create-project-board-modal";
import {
  useCreateTodoBoardModal,
  useShowArchivedBoards,
} from "@/features/todos/store/use-create-todo-board-modal";
import { useWorkspaceId } from "@/hooks/use-workspace-id";

interface WorkspaceHeaderProps {
  workspace: Doc<"workspaces">;
  isAdmin: boolean;
}

export const WorkspaceHeader = ({
  workspace,
  isAdmin,
}: WorkspaceHeaderProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const [, setCreateChannelOpen] = useCreateChannelModal();
  const [, setCreateProjectOpen] = useCreateProjectBoardModal();
  const [, setCreateTodoOpen] = useCreateTodoBoardModal();
  const [showArchived, setShowArchived] = useShowArchivedBoards();

  const getHeaderActions = () => {
    if (pathname.includes("/projects")) {
      return {
        btn1: {
          icon: ListFilter,
          label: "Filter project boards",
          onClick: () => router.push(`/projects/${workspaceId}`),
          active: false,
        },
        btn2: {
          icon: Plus,
          label: "New Project Board",
          onClick: () => setCreateProjectOpen(true),
          active: false,
        },
      };
    }

    if (pathname.includes("/todo")) {
      return {
        btn1: {
          icon: Archive,
          label: showArchived ? "Hide Archived Boards" : "Show Archived Boards",
          onClick: () => setShowArchived(!showArchived),
          active: showArchived,
        },
        btn2: {
          icon: Plus,
          label: "New To-Do Board",
          onClick: () => setCreateTodoOpen(true),
          active: false,
        },
      };
    }

    if (pathname.includes("/data-room")) {
      return {
        btn1: {
          icon: Upload,
          label: "Upload File",
          onClick: () => {
            const url = new URL(window.location.href);
            url.searchParams.set("upload", "true");
            router.push(url.toString());
          },
          active: false,
        },
        btn2: {
          icon: FolderPlus,
          label: "New Folder",
          onClick: () => {
            const url = new URL(window.location.href);
            url.searchParams.set("newFolder", "true");
            router.push(url.toString());
          },
          active: false,
        },
      };
    }

    if (pathname.includes("/attendance")) {
      return {
        btn1: {
          icon: Clock,
          label: "Check In / Out",
          onClick: () => router.push(`/attendance/${workspaceId}/checkin`),
          active: false,
        },
        btn2: {
          icon: Calendar,
          label: "My Calendar",
          onClick: () => router.push(`/attendance/${workspaceId}/calendar`),
          active: false,
        },
      };
    }

    // Default: Chat / Workspace route
    return {
      btn1: {
        icon: ListFilter,
        label: "Filter conversations",
        onClick: () => {},
        active: false,
      },
      btn2: {
        icon: SquarePen,
        label: "New Channel",
        onClick: () => setCreateChannelOpen(true),
        active: false,
      },
    };
  };

  const { btn1, btn2 } = getHeaderActions();
  const Btn1Icon = btn1.icon;
  const Btn2Icon = btn2.icon;

  return (
    <>
      <PreferencesModal
        open={preferencesOpen}
        setOpen={setPreferencesOpen}
        initialValue={workspace.name}
      />
      <InviteModal
        open={inviteOpen}
        setOpen={setInviteOpen}
        name={workspace.name}
        joinCode={workspace.joinCode}
      />

      <div className="flex h-[49px] items-center justify-between gap-0.5 px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="transparent"
              className="w-auto overflow-hidden p-1.5 text-lg font-semibold text-sidebar-foreground hover:bg-sidebar-accent"
              size="sm"
            >
              <span className="truncate">{workspace.name}</span>
              <ChevronDown className="ml-1 size-4 shrink-0 opacity-80" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="bottom" align="start" className="w-64">
            <DropdownMenuItem className="cursor-pointer capitalize">
              <div className="relative mr-2 flex size-9 items-center justify-center overflow-hidden rounded-md bg-primary text-xl font-semibold text-primary-foreground">
                {workspace.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex flex-col items-start">
                <p className="font-bold">{workspace.name}</p>
                <p className="text-xs text-muted-foreground">
                  Active workspace
                </p>
              </div>
            </DropdownMenuItem>

            {isAdmin && (
              <>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="cursor-pointer py-2"
                  onClick={() => setInviteOpen(true)}
                >
                  Invite people to {workspace.name}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="cursor-pointer py-2"
                  onClick={() => setPreferencesOpen(true)}
                >
                  Preferences
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-0.5">
          <Hint label={btn1.label} side="bottom">
            <Button
              variant="transparent"
              size="iconSm"
              onClick={btn1.onClick}
              className={`text-sidebar-foreground hover:bg-sidebar-accent ${
                btn1.active ? "bg-sidebar-accent text-primary font-bold" : ""
              }`}
            >
              <Btn1Icon className="size-4" />
            </Button>
          </Hint>

          <Hint label={btn2.label} side="bottom">
            <Button
              variant="transparent"
              size="iconSm"
              onClick={btn2.onClick}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Btn2Icon className="size-4" />
            </Button>
          </Hint>
        </div>
      </div>
    </>
  );
};
