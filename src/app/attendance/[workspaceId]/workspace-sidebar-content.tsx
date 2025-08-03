"use client";

import { BarChart3, Calendar, Clock, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useWorkspaceId } from "@/hooks/use-workspace-id";

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
    const targetPath =
      path === ""
        ? `/attendance/${workspaceId}`
        : `/attendance/${workspaceId}${path}`;
    if (path === "" && currentPath === `/attendance/${workspaceId}`)
      return true;
    if (path !== "" && currentPath.includes(path)) return true;
    return false;
  };

  return (
    <>
      <div className="mt-3 flex flex-col px-2">
        {member?.role === "admin" ? (
          <>
            <Button
              variant="transparent"
              className={`h-7 justify-start px-[18px] text-sm ${
                isActive("")
                  ? "bg-white/10 text-white"
                  : "text-[#f9EDFFCC] hover:bg-white/5"
              }`}
              onClick={() => navigateTo("")}
            >
              <BarChart3 className="mr-1 size-3.5 shrink-0" />
              <span className="truncate text-sm">Admin Dashboard</span>
            </Button>
            <Button
              variant="transparent"
              className={`h-7 justify-start px-[18px] text-sm ${
                isActive("/checkin")
                  ? "bg-white/10 text-white"
                  : "text-[#f9EDFFCC] hover:bg-white/5"
              }`}
              onClick={() => navigateTo("/checkin")}
            >
              <Clock className="mr-1 size-3.5 shrink-0" />
              <span className="truncate text-sm">Check In/Out</span>
            </Button>
            <Button
              variant="transparent"
              className={`h-7 justify-start px-[18px] text-sm ${
                isActive("/members")
                  ? "bg-white/10 text-white"
                  : "text-[#f9EDFFCC] hover:bg-white/5"
              }`}
              onClick={() => navigateTo("/members")}
            >
              <Users className="mr-1 size-3.5 shrink-0" />
              <span className="truncate text-sm">Members</span>
            </Button>
            <Button
              variant="transparent"
              className={`h-7 justify-start px-[18px] text-sm ${
                isActive("/calendar")
                  ? "bg-white/10 text-white"
                  : "text-[#f9EDFFCC] hover:bg-white/5"
              }`}
              onClick={() => navigateTo("/calendar")}
            >
              <Calendar className="mr-1 size-3.5 shrink-0" />
              <span className="truncate text-sm">My Calendar</span>
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="transparent"
              className={`h-7 justify-start px-[18px] text-sm ${
                isActive("")
                  ? "bg-white/10 text-white"
                  : "text-[#f9EDFFCC] hover:bg-white/5"
              }`}
              onClick={() => navigateTo("")}
            >
              <Clock className="mr-1 size-3.5 shrink-0" />
              <span className="truncate text-sm">Check In/Out</span>
            </Button>
            <Button
              variant="transparent"
              className={`h-7 justify-start px-[18px] text-sm ${
                isActive("/calendar")
                  ? "bg-white/10 text-white"
                  : "text-[#f9EDFFCC] hover:bg-white/5"
              }`}
              onClick={() => navigateTo("/calendar")}
            >
              <Calendar className="mr-1 size-3.5 shrink-0" />
              <span className="truncate text-sm">My Calendar</span>
            </Button>
          </>
        )}
      </div>
    </>
  );
};
