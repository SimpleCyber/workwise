"use client";

import {
  ImageIcon,
  FileText,
  LayoutGrid,
  FileSpreadsheet,
  PlusIcon,
  FolderIcon,
} from "lucide-react";
import { useQueryState, parseAsString } from "nuqs";

import { WorkspaceSection } from "@/app/workspace/[workspaceId]/workspace-section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useGetPinnedDataRoomFolders } from "@/features/data-room/api/use-data-room";

type SidebarFolder = "all" | "image" | "document" | "spreadsheet" | "pdf";

const SIDEBAR_FOLDERS: { id: SidebarFolder; label: string; icon: any }[] = [
  { id: "all", label: "All Files", icon: LayoutGrid },
  { id: "image", label: "Images", icon: ImageIcon },
  { id: "document", label: "Documents", icon: FileText },
  { id: "spreadsheet", label: "Spreadsheets", icon: FileSpreadsheet },
  { id: "pdf", label: "PDFs", icon: FileText },
];

export const WorkspaceSidebarContent = () => {
  const workspaceId = useWorkspaceId();
  const [activeFolder, setActiveFolder] = useQueryState(
    "folder",
    parseAsString.withDefault("all"),
  );
  const [folderId, setFolderId] = useQueryState(
    "folderId",
    parseAsString.withDefault(""),
  );

  const { data: pinnedFolders, isLoading: isLoadingPinned } =
    useGetPinnedDataRoomFolders({ workspaceId });

  return (
    <div className="flex flex-col gap-y-2 mt-3">
      <WorkspaceSection label="Quick Access" hint="Filter by type">
        {SIDEBAR_FOLDERS.map((folder) => {
          const Icon = folder.icon;
          const isActive = activeFolder === folder.id && !folderId;

          return (
            <Button
              key={folder.id}
              variant="transparent"
              size="sm"
              onClick={() => {
                setActiveFolder(folder.id);
                setFolderId("");
              }}
              className={cn(
                "h-7 justify-start px-[18px] text-sm font-normal",
                isActive
                  ? "bg-[#f9EDFF]/20 text-white font-semibold"
                  : "text-[#f9EDFFCC] hover:bg-[#f9EDFF]/10 transition",
              )}
            >
              <Icon
                className={cn(
                  "mr-2 size-3.5 shrink-0",
                  isActive ? "text-white" : "text-[#f9EDFFCC]",
                )}
              />
              <span className="truncate">{folder.label}</span>
            </Button>
          );
        })}
      </WorkspaceSection>

      {!isLoadingPinned && pinnedFolders && pinnedFolders.length > 0 && (
        <WorkspaceSection label="Pinned Folders" hint="Important shortcuts">
          {pinnedFolders.map((folder) => {
            const isActive = folderId === folder._id;

            return (
              <Button
                key={folder._id}
                variant="transparent"
                size="sm"
                onClick={() => {
                  setFolderId(folder._id);
                  setActiveFolder("all");
                }}
                className={cn(
                  "h-7 justify-start px-[18px] text-sm font-normal",
                  isActive
                    ? "bg-[#f9EDFF]/20 text-white font-semibold"
                    : "text-[#f9EDFFCC] hover:bg-[#f9EDFF]/10 transition",
                )}
              >
                <FolderIcon
                  className={cn(
                    "mr-2 size-3.5 shrink-0",
                    isActive ? "text-white" : "text-[#f9EDFFCC]",
                  )}
                />
                <span className="truncate">{folder.name}</span>
              </Button>
            );
          })}
        </WorkspaceSection>
      )}
    </div>
  );
};
