"use client"

import { Kanban, Filter, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkspaceSection } from "@/app/workspace/[workspaceId]/workspace-section"

export const WorkspaceSidebarContent = () => {
  return (
    <>
      <div className="mt-3 flex flex-col px-2">
        <Button variant="transparent" className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC]">
          <Kanban className="mr-1 size-3.5 shrink-0" />
          <span className="truncate text-sm">All Boards</span>
        </Button>
        <Button variant="transparent" className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC]">
          <Filter className="mr-1 size-3.5 shrink-0" />
          <span className="truncate text-sm">My Cards</span>
        </Button>
        <Button variant="transparent" className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC]">
          <Archive className="mr-1 size-3.5 shrink-0" />
          <span className="truncate text-sm">Archived</span>
        </Button>
      </div>

      <WorkspaceSection label="Boards" hint="New Board" onNew={() => {}}>
        <Button variant="transparent" className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC]">
          <span className="truncate text-sm">Development</span>
        </Button>
        <Button variant="transparent" className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC]">
          <span className="truncate text-sm">Marketing</span>
        </Button>
      </WorkspaceSection>
    </>
  )
}
