"use client";

import { Network, BarChart3 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { WorkspaceSection } from "@/app/workspace/[workspaceId]/workspace-section";
import { Button } from "@/components/ui/button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";

export const WorkspaceSidebarContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const workspaceId = useWorkspaceId();

  const navigateTo = (path: string) => {
    const fullPath = `/tree/${workspaceId}${path}`;
    router.push(fullPath);
  };

  const isActive = (path: string) => {
    const currentPath = pathname;
    const targetPath = `/tree/${workspaceId}${path}`;
    if (path === "" && currentPath === `/tree/${workspaceId}`) return true;
    if (path !== "" && currentPath.includes(path)) return true;
    return false;
  };

  return (
    <>
      <div className="mt-3 flex flex-col px-2">
        <Button
          variant="transparent"
          className={`h-7 justify-start px-[18px] text-sm ${
            isActive("")
              ? "bg-white/10 text-white"
              : "text-[#f9EDFFCC] hover:bg-white/5"
          }`}
          onClick={() => navigateTo("")}
        >
          <Network className="mr-1 size-3.5 shrink-0" />
          <span className="truncate text-sm">Tree View</span>
        </Button>
      </div>

      <WorkspaceSection label="Views" hint="Explore" onNew={() => {}}>
        <Button
          variant="transparent"
          className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC] hover:bg-white/5"
          onClick={() => navigateTo("/overview")}
        >
          <BarChart3 className="mr-1 size-3.5 shrink-0" />
          <span className="truncate text-sm">Overview</span>
        </Button>
        <Button
          variant="transparent"
          className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC] hover:bg-white/5"
          onClick={() => navigateTo("/analytics")}
        >
          <BarChart3 className="mr-1 size-3.5 shrink-0" />
          <span className="truncate text-sm">Analytics</span>
        </Button>
      </WorkspaceSection>
    </>
  );
};
