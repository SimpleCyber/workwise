"use client"

import { Users, UserPlus, Shield, Clock, Crown, UserCheck, Settings } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { WorkspaceSection } from "@/app/workspace/[workspaceId]/workspace-section"
import { useCurrentMember } from "@/features/members/api/use-current-member"
import { useWorkspaceId } from "@/hooks/use-workspace-id"

export const WorkspaceSidebarContent = () => {
  const router = useRouter()
  const pathname = usePathname()
  const workspaceId = useWorkspaceId()
  const { data: member } = useCurrentMember({ workspaceId })

  const navigateTo = (path: string) => {
    const fullPath = path === "" ? `/members/${workspaceId}` : `/members/${workspaceId}${path}`
    router.push(fullPath)
  }

  const isActive = (path: string) => {
    const currentPath = pathname
    const targetPath = path === "" ? `/members/${workspaceId}` : `/members/${workspaceId}${path}`

    if (path === "" && currentPath === `/members/${workspaceId}`) return true
    if (path !== "" && currentPath.includes(path)) return true
    return false
  }

  return (
    <>
      <div className="mt-3 flex flex-col px-2">
        <Button
          variant="transparent"
          className={`h-7 justify-start px-[18px] text-sm ${
            isActive("") ? "bg-white/10 text-white" : "text-[#f9EDFFCC] hover:bg-white/5"
          }`}
          onClick={() => navigateTo("")}
        >
          <Users className="mr-1 size-3.5 shrink-0" />
          <span className="truncate text-sm">All Members</span>
        </Button>

        {(member?.role === "admin" || member?.role === "lead") && (
          <Button
            variant="transparent"
            className={`h-7 justify-start px-[18px] text-sm ${
              isActive("/admins") ? "bg-white/10 text-white" : "text-[#f9EDFFCC] hover:bg-white/5"
            }`}
            onClick={() => navigateTo("/admins")}
          >
            <Shield className="mr-1 size-3.5 shrink-0" />
            <span className="truncate text-sm">Admins</span>
          </Button>
        )}

        {(member?.role === "admin" || member?.role === "lead") && (
          <Button
            variant="transparent"
            className={`h-7 justify-start px-[18px] text-sm ${
              isActive("/leads") ? "bg-white/10 text-white" : "text-[#f9EDFFCC] hover:bg-white/5"
            }`}
            onClick={() => navigateTo("/leads")}
          >
            <Crown className="mr-1 size-3.5 shrink-0" />
            <span className="truncate text-sm">Team Leads</span>
          </Button>
        )}

        <Button
          variant="transparent"
          className={`h-7 justify-start px-[18px] text-sm ${
            isActive("/active") ? "bg-white/10 text-white" : "text-[#f9EDFFCC] hover:bg-white/5"
          }`}
          onClick={() => navigateTo("/active")}
        >
          <UserCheck className="mr-1 size-3.5 shrink-0" />
          <span className="truncate text-sm">Active Members</span>
        </Button>

        <Button
          variant="transparent"
          className={`h-7 justify-start px-[18px] text-sm ${
            isActive("/recent") ? "bg-white/10 text-white" : "text-[#f9EDFFCC] hover:bg-white/5"
          }`}
          onClick={() => navigateTo("/recent")}
        >
          <Clock className="mr-1 size-3.5 shrink-0" />
          <span className="truncate text-sm">Recently Joined</span>
        </Button>

        {member?.role === "admin" && (
          <Button
            variant="transparent"
            className={`h-7 justify-start px-[18px] text-sm ${
              isActive("/invite") ? "bg-white/10 text-white" : "text-[#f9EDFFCC] hover:bg-white/5"
            }`}
            onClick={() => navigateTo("/invite")}
          >
            <UserPlus className="mr-1 size-3.5 shrink-0" />
            <span className="truncate text-sm">Invite Members</span>
          </Button>
        )}
      </div>

      <WorkspaceSection label="Quick Actions" hint="Manage" onNew={() => {}}>
        {member?.role === "admin" && (
          <Button
            variant="transparent"
            className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC] hover:bg-white/5"
            onClick={() => navigateTo("/settings")}
          >
            <Settings className="mr-1 size-3.5 shrink-0" />
            <span className="truncate text-sm">Member Settings</span>
          </Button>
        )}

        <Button
          variant="transparent"
          className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC] hover:bg-white/5"
          onClick={() => navigateTo("/teams")}
        >
          <Users className="mr-1 size-3.5 shrink-0" />
          <span className="truncate text-sm">Teams</span>
        </Button>
      </WorkspaceSection>
    </>
  )
}
