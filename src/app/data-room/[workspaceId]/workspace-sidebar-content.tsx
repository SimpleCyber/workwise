"use client";

import { useFeatureFlag } from "@/components/feature-flags";

import {
  ImageIcon,
  FileText,
  LayoutGrid,
  FileSpreadsheet,
  PlusIcon,
  FolderIcon,
  FileStack,
  Upload,
  Plus,
} from "lucide-react";
import { useQueryState, parseAsString, parseAsBoolean } from "nuqs";

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
  const { enabled: toolsEnabled } = useFeatureFlag("data_room_tools");
  const [activeFolder, setActiveFolder] = useQueryState(
    "folder",
    parseAsString.withDefault("all"),
  );
  const [tool, setTool] = useQueryState("tool", parseAsString);
  const [folderId, setFolderId] = useQueryState(
    "folderId",
    parseAsString.withDefault(""),
  );
  const [isUploadParam, setIsUploadParam] = useQueryState(
    "upload",
    parseAsBoolean.withDefault(false),
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
                  setTool(null);
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

      {toolsEnabled && (
        <WorkspaceSection label="Tools" hint="PDF & Image editing">
          <Button
            variant="transparent"
            size="sm"
            onClick={() => {
              setTool("create");
              setFolderId("");
            }}
            className={cn(
              "h-7 justify-start px-[18px] text-sm font-normal",
              tool === "create"
                ? "bg-[#f9EDFF]/20 text-white font-semibold"
                : "text-[#f9EDFFCC] hover:bg-[#f9EDFF]/10 transition",
            )}
          >
            <Plus
              className={cn(
                "mr-2 size-3.5 shrink-0",
                tool === "create" ? "text-white" : "text-[#f9EDFFCC]",
              )}
            />
            <span>Create</span>
          </Button>
          <Button
            variant="transparent"
            size="sm"
            onClick={() => {
              setTool("merge");
              setFolderId("");
            }}
            className={cn(
              "h-7 justify-start px-[18px] text-sm font-normal",
              tool === "merge"
                ? "bg-[#f9EDFF]/20 text-white font-semibold"
                : "text-[#f9EDFFCC] hover:bg-[#f9EDFF]/10 transition",
            )}
          >
            <FileStack
              className={cn(
                "mr-2 size-3.5 shrink-0",
                tool === "merge" ? "text-white" : "text-[#f9EDFFCC]",
              )}
            />
            <span>Merge</span>
          </Button>
          <Button
            variant="transparent"
            size="sm"
            onClick={() => setIsUploadParam(true)}
            className="h-7 justify-start px-[18px] text-sm font-normal text-[#f9EDFFCC] hover:bg-[#f9EDFF]/10 transition"
          >
            <Upload className="mr-2 size-3.5 shrink-0 text-[#f9EDFFCC]" />
            <span>Upload</span>
          </Button>
        </WorkspaceSection>
      )}
    </div>
  );
};
