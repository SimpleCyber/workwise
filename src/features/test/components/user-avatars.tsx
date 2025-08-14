"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Plus, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetWorkspaceMembers } from "../api/use-get-workspace-members";
import { useAddUserToNode } from "../api/use-add-user-to-node";
import { toast } from "sonner";
import type { Id } from "../../../../convex/_generated/dataModel";

interface User {
  id: string;
  name: string;
  initials: string;
}

interface UserAvatarsProps {
  users: User[];
  onUsersChange: (users: User[]) => void;
  workspaceId?: Id<"workspaces">;
  nodeId?: string;
}

const avatarColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-teal-500",
  "bg-yellow-500",
  "bg-gray-500",
];

export function UserAvatars({
  users,
  onUsersChange,
  workspaceId,
  nodeId,
}: UserAvatarsProps) {
  const [showUserForm, setShowUserForm] = useState(false);
  const [showMemberSelect, setShowMemberSelect] = useState(false);

  const { data: members } = useGetWorkspaceMembers({
    workspaceId: workspaceId!,
  });
  const addUserToNode = useAddUserToNode();

  const addMemberToNode = async (
    memberId: Id<"members">,
    memberName: string,
  ) => {
    if (!workspaceId || !nodeId) {
      toast.error("Missing workspace or node information");
      return;
    }

    try {
      await addUserToNode({
        nodeId,
        memberId,
        workspaceId,
        role: "member",
      });

      const newUser = {
        id: memberId,
        name: memberName,
        initials: memberName.charAt(0).toUpperCase(),
      };
      onUsersChange([...users, newUser]);
      setShowMemberSelect(false);
      toast.success("Member added to node successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add member to node",
      );
    }
  };

  const removeUser = (userId: string) => {
    onUsersChange(users.filter((user) => user.id !== userId));
    toast.success("User removed from node");
  };

  const visibleUsers = users.slice(0, 3);
  const remainingUsers = users.slice(3);
  const hasMoreUsers = remainingUsers.length > 0;

  const availableMembers =
    members?.filter(
      (member) => !users.some((user) => user.id === member._id),
    ) || [];

  return (
    <div className="flex items-center gap-1">
      {visibleUsers.map((user, index) => (
        <DropdownMenu key={user.id}>
          <DropdownMenuTrigger asChild>
            <div
              className={`w-6 h-6 rounded-full ${avatarColors[index % avatarColors.length]} flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:scale-110 transition-transform`}
              title={`${user.name} - Click to edit/remove`}
            >
              {user.initials}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="p-2">
            <div className="text-xs font-medium mb-2">{user.name}</div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => removeUser(user.id)}
              className="w-full text-xs h-6"
            >
              Remove User
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}

      {hasMoreUsers && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:bg-gray-500 transition-colors">
              +{remainingUsers.length}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="p-2 space-y-1">
            {remainingUsers.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-2 p-1"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full ${avatarColors[(index + 3) % avatarColors.length]} flex items-center justify-center text-white text-xs`}
                  >
                    {user.initials}
                  </div>
                  <span className="text-xs">{user.name}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeUser(user.id)}
                  className="p-1 h-5 w-5 text-red-500 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <DropdownMenu open={showMemberSelect} onOpenChange={setShowMemberSelect}>
        <DropdownMenuTrigger asChild>
          <div className="w-6 h-6 rounded-full bg-dashed border-2 border-gray-300 border-dashed flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
            <Plus className="w-3 h-3 text-gray-400" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="p-2 max-h-48 overflow-y-auto">
          <div className="text-xs font-medium mb-2 text-gray-600">
            Add Member
          </div>
          {availableMembers.length === 0 ? (
            <div className="text-xs text-gray-500 p-2">
              No available members
            </div>
          ) : (
            availableMembers.map((member) => (
              <DropdownMenuItem
                key={member._id}
                onClick={() =>
                  addMemberToNode(member._id, member.user?.name || "Unknown")
                }
                className="flex items-center gap-2 cursor-pointer"
              >
                <Avatar className="w-5 h-5">
                  <AvatarImage src={member.user?.image || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">
                    {member.user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">
                  {member.user?.name || "Unknown Member"}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
