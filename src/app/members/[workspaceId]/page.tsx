"use client"

import { useState } from "react"
import { Loader, TriangleAlert, UserPlus, Shield, Crown, MoreHorizontal, Search } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useGetMembers } from "@/features/members/api/use-get-members"
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info"
import { useCurrentMember } from "@/features/members/api/use-current-member"
import { useGetMemberStats } from "@/features/members/api/use-get-member-stats"
import { useUpdateMemberRole } from "@/features/members/api/use-update-member-role"
import { useRemoveMember } from "@/features/members/api/use-remove-member"
import { useWorkspaceId } from "@/hooks/use-workspace-id"
import { InviteModal } from "@/features/members/components/invite-modal"

const MembersWorkspacePage = () => {
  const workspaceId = useWorkspaceId()
  const [searchTerm, setSearchTerm] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null)

  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspaceInfo({ id: workspaceId })
  const { data: members, isLoading: membersLoading } = useGetMembers({ workspaceId })
  const { data: currentMember } = useCurrentMember({ workspaceId })
  const { data: stats } = useGetMemberStats({ workspaceId })
  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateMemberRole()
  const { mutate: removeMember, isPending: isRemoving } = useRemoveMember()

  if (workspaceLoading || membersLoading) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <TriangleAlert className="size-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Workspace not found.</span>
      </div>
    )
  }

  const handleRoleUpdate = async (memberId: string, newRole: "admin" | "member" | "lead") => {
    await updateRole(
      { memberId: memberId as any, role: newRole },
      {
        onSuccess: () => {
          toast.success(`Member role updated to ${newRole}`)
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update member role")
        },
      },
    )
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    await removeMember(
      { memberId: memberToRemove as any },
      {
        onSuccess: () => {
          toast.success("Member removed successfully")
          setMemberToRemove(null)
        },
        onError: (error) => {
          toast.error(error.message || "Failed to remove member")
        },
      },
    )
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-red-100 text-red-800">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        )
      case "lead":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Crown className="w-3 h-3 mr-1" />
            Lead
          </Badge>
        )
      default:
        return <Badge variant="secondary">Member</Badge>
    }
  }

  const filteredMembers =
    members?.filter(
      (member) =>
        member.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []

  const canManageMembers = currentMember?.role === "admin"

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[49px] items-center justify-between border-b bg-white px-4">
        <h1 className="text-lg font-semibold">Members - {workspace.name}</h1>
        {canManageMembers && (
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 size-4" />
            Invite Members
          </Button>
        )}
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold">Team Members</h2>
            <p className="text-muted-foreground">
              Manage team members and their roles in the {workspace.name} workspace.
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-xs text-muted-foreground">Total Members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.admins}</p>
                      <p className="text-xs text-muted-foreground">Admins</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Crown className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.leads}</p>
                      <p className="text-xs text-muted-foreground">Team Leads</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <UserPlus className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.members}</p>
                      <p className="text-xs text-muted-foreground">Regular Members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle>All Members ({filteredMembers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMembers.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.user.image || "/placeholder.svg"} />
                        <AvatarFallback>{member.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-lg">{member.user.name}</p>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getRoleBadge(member.role)}
                      {canManageMembers && member._id !== currentMember?._id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={isUpdatingRole || isRemoving}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRoleUpdate(member._id, "member")}>
                              Make Member
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleUpdate(member._id, "lead")}>
                              <Crown className="w-4 h-4 mr-2" />
                              Make Lead
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleUpdate(member._id, "admin")}>
                              <Shield className="w-4 h-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setMemberToRemove(member._id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
                {filteredMembers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No members found</p>
                    <p className="text-sm">Try adjusting your search terms</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invite Modal */}
      {workspace.name && workspace.joinCode && (
        <InviteModal
          open={inviteOpen}
          setOpen={setInviteOpen}
          workspaceId={workspaceId}
          name={workspace.name}
          joinCode={workspace.joinCode}
        />
      )}

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} disabled={isRemoving}>
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default MembersWorkspacePage
