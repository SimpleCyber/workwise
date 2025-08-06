"use client";

import { Loader, Plus, Users, Settings, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useCreateWorkspaceModal } from "@/features/workspaces/store/use-create-workspace-modal";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { InviteModal } from "@/app/workspace/[workspaceId]/invite-modal";
import { PreferencesModal } from "@/app/workspace/[workspaceId]/preferences-modal";
import { Hint } from "@/components/hint";

export const WorkspaceSwitcher = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const [_open, setOpen] = useCreateWorkspaceModal();

  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace({
    id: workspaceId,
  });
  const { data: workspaces, isLoading: workspacesLoading } = useGetWorkspaces();
  const { data: member } = useCurrentMember({ workspaceId });

  const isAdmin = member?.role === "admin" || member?.role === "lead";

  const filteredWorkspaces = workspaces?.filter((ws) => ws._id !== workspaceId);

  const handleWorkspaceSwitch = (newWorkspaceId: string) => {
    router.push(`/workspace/${newWorkspaceId}`);
  };

  return (
    <>
      {/* Modals */}
      <PreferencesModal
        open={preferencesOpen}
        setOpen={setPreferencesOpen}
        initialValue={workspace?.name || ""}
      />
      <InviteModal
        open={inviteOpen}
        setOpen={setInviteOpen}
        name={workspace?.name || ""}
        joinCode={workspace?.joinCode || ""}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="relative size-9 overflow-hidden bg-[#ABABAD] text-slate-800 hover:bg-[#ABABAD]/80 font-semibold text-xl">
            {workspaceLoading ? (
              <Loader className="size-5 animate-spin shrink-0" />
            ) : (
              <>{workspace?.name?.charAt(0).toUpperCase()}</>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="start" className="w-64">
          {/* Active workspace */}
          <DropdownMenuItem
            onClick={() => handleWorkspaceSwitch(workspaceId)}
            className="cursor-pointer flex-col items-start capitalize"
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="shrink-0 size-9 relative overflow-hidden bg-[#616061] text-white font-semibold text-lg rounded-md flex items-center justify-center">
                  {workspace?.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <p className="font-semibold truncate">{workspace?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Active workspace
                  </p>
                </div>
              </div>

              {/* Admin Tools */}
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <Hint label="Invite People" side="top">
                    <Button
                      size="iconSm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInviteOpen(true);
                      }}
                    >
                      <Users className="size-4" />
                    </Button>
                  </Hint>

                  <Hint label="Preferences" side="top">
                    <Button
                      size="iconSm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreferencesOpen(true);
                      }}
                    >
                      <Settings className="size-4" />
                    </Button>
                  </Hint>
                </div>
              )}
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Other Workspaces */}
          {filteredWorkspaces?.map((workspace) => (
            <DropdownMenuItem
              key={workspace._id}
              className="cursor-pointer capitalize overflow-hidden"
              onClick={() => handleWorkspaceSwitch(workspace._id)}
            >
              <div className="shrink-0 size-9 relative overflow-hidden bg-[#616061] text-white font-semibold text-lg rounded-md flex items-center justify-center mr-2">
                {workspace.name.charAt(0).toUpperCase()}
              </div>
              <p className="truncate">{workspace.name}</p>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {/* Create Workspace */}
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setOpen(true)}
          >
            <div className="size-9 relative overflow-hidden bg-[#F2F2F2] text-slate-800 font-semibold text-lg rounded-md flex items-center justify-center mr-2">
              <Plus />
            </div>
            Create a new workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
