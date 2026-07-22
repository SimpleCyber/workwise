"use client";

import { BarChart3, Calendar, Clock, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { WorkspaceSection } from "@/app/workspace/[workspaceId]/workspace-section";
import { Button } from "@/components/ui/button";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { cn } from "@/lib/utils";

export const WorkspaceSidebarContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const workspaceId = useWorkspaceId();
  const { data: member } = useCurrentMember({ workspaceId });

  const navigateTo = (path: string) => {
    const fullPath =
      path === ""
        ? `/attendance/${workspaceId}`
        : `/attendance/${workspaceId}${path}`;
    router.push(fullPath);
  };

  const isActive = (path: string) => {
    const currentPath = pathname;
    if (path === "" && currentPath === `/attendance/${workspaceId}`)
      return true;
    if (path !== "" && currentPath.includes(path)) return true;
    return false;
  };

  return (
    <div className="flex flex-col gap-y-2 mt-3">
      <WorkspaceSection label="Attendance Navigation">
        {member?.role === "admin" ? (
          <>
            <Button
              variant="transparent"
              size="sm"
              className={cn(
                "h-7 justify-start px-[18px] text-sm font-normal w-full",
                isActive("")
                  ? "bg-[#f9EDFF]/20 text-white font-semibold"
                  : "text-[#f9EDFFCC] hover:bg-[#f9EDFF]/10 transition",
              )}
              onClick={() => navigateTo("")}
            >
              <BarChart3
                className={cn(
                  "mr-2 size-3.5 shrink-0",
                  isActive("") ? "text-white" : "text-[#f9EDFFCC]",
                )}
              />
              <span className="truncate">Admin Dashboard</span>
            </Button>
            <Button
              variant="transparent"
              size="sm"
              className={cn(
                "h-7 justify-start px-[18px] text-sm font-normal w-full",
                isActive("/checkin")
                  ? "bg-[#f9EDFF]/20 text-white font-semibold"
                  : "text-[#f9EDFFCC] hover:bg-[#f9EDFF]/10 transition",
              )}
              onClick={() => navigateTo("/checkin")}
            >
              <Clock
                className={cn(
                  "mr-2 size-3.5 shrink-0",
                  isActive("/checkin") ? "text-white" : "text-[#f9EDFFCC]",
                )}
              />
              <span className="truncate">Check In/Out</span>
            </Button>
            <Button
              variant="transparent"
              size="sm"
              className={cn(
                "h-7 justify-start px-[18px] text-sm font-normal w-full",
                isActive("/members")
                  ? "bg-[#f9EDFF]/20 text-white font-semibold"
                  : "text-[#f9EDFFCC] hover:bg-[#f9EDFF]/10 transition",
              )}
              onClick={() => navigateTo("/members")}
            >
              <Users
                className={cn(
                  "mr-2 size-3.5 shrink-0",
                  isActive("/members") ? "text-white" : "text-[#f9EDFFCC]",
                )}
              />
              <span className="truncate">Members</span>
            </Button>
            <Button
              variant="transparent"
              size="sm"
              className={cn(
                "h-7 justify-start px-[18px] text-sm font-normal w-full",
                isActive("/calendar")
                  ? "bg-[#f9EDFF]/20 text-white font-semibold"
                  : "text-[#f9EDFFCC] hover:bg-[#f9EDFF]/10 transition",
              )}
              onClick={() => navigateTo("/calendar")}
            >
              <Calendar
                className={cn(
                  "mr-2 size-3.5 shrink-0",
                  isActive("/calendar") ? "text-white" : "text-[#f9EDFFCC]",
                )}
              />
              <span className="truncate">My Calendar</span>
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="transparent"
              size="sm"
              className={cn(
                "h-7 justify-start px-[18px] text-sm font-normal w-full",
                isActive("")
                  ? "bg-[#f9EDFF]/20 text-white font-semibold"
                  : "text-[#f9EDFFCC] hover:bg-[#f9EDFF]/10 transition",
              )}
              onClick={() => navigateTo("")}
            >
              <Clock
                className={cn(
                  "mr-2 size-3.5 shrink-0",
                  isActive("") ? "text-white" : "text-[#f9EDFFCC]",
                )}
              />
              <span className="truncate">Check In/Out</span>
            </Button>
            <Button
              variant="transparent"
              size="sm"
              className={cn(
                "h-7 justify-start px-[18px] text-sm font-normal w-full",
                isActive("/calendar")
                  ? "bg-[#f9EDFF]/20 text-white font-semibold"
                  : "text-[#f9EDFFCC] hover:bg-[#f9EDFF]/10 transition",
              )}
              onClick={() => navigateTo("/calendar")}
            >
              <Calendar
                className={cn(
                  "mr-2 size-3.5 shrink-0",
                  isActive("/calendar") ? "text-white" : "text-[#f9EDFFCC]",
                )}
              />
              <span className="truncate">My Calendar</span>
            </Button>
          </>
        )}
      </WorkspaceSection>
    </div>
  );
};
