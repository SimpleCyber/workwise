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
                  ? "bg-accent/50 text-foreground"
                  : "text-sidebar-foreground/80 hover:bg-accent/30"
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
                  ? "bg-accent/50 text-foreground"
                  : "text-sidebar-foreground/80 hover:bg-accent/30"
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
                  ? "bg-accent/50 text-foreground"
                  : "text-sidebar-foreground/80 hover:bg-accent/30"
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
                  ? "bg-accent/50 text-foreground"
                  : "text-sidebar-foreground/80 hover:bg-accent/30"
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
                  ? "bg-accent/50 text-foreground"
                  : "text-sidebar-foreground/80 hover:bg-accent/30"
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
                  ? "bg-accent/50 text-foreground"
                  : "text-sidebar-foreground/80 hover:bg-accent/30"
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
