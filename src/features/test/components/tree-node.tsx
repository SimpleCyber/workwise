"use client";

import type React from "react";
import { useRef, useState, useEffect } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Card, CardContent } from "@/components/ui/card";
import { EditableField } from "./editable-field";
import { UserAvatars } from "./user-avatars";
import { NodeActions } from "./node-actions";
import { StatusBadge } from "./status-badge";
import { NodePopup } from "./node-popup";
import {
  Lightbulb,
  Pin,
  Network,
  Crown,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useToggleStar } from "../api/use-toggle-stars"; // Import the hook
import { useGetFullProjectBoard } from "../api/use-get-all-project-board-details";
import type { Id } from "../../../../convex/_generated/dataModel";

interface TreeNodeData {
  label: string;
  description?: string;
  level?: number;
  status?: string;
  uniqueId?: string;
  users?: Array<{ id: string; name: string; initials: string; image?: string }>;
  onAddChild: () => void;
  onDelete: () => void;
  onExpandWithAI?: () => void;
  isRoot?: boolean;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  childNodes?: Array<{ id: string; label: string; status: string }>;
  isPopupOpen?: boolean;
  onTogglePopup?: () => void;
  onClosePopup?: () => void;
  workspaceId?: any;
  onUpdateNode?: (
    nodeId: string,
    updates: Partial<{ title: string; description: string; status: string }>,
  ) => void;
  isStarred?: boolean; // Add this prop
}

export function TreeNode({ data, id }: NodeProps<TreeNodeData>) {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const toggleStar = useToggleStar();

  // if (!data?.uniqueId) return; // or handle it appropriately

  // const boardId = data.uniqueId as Id<"projectBoards">;

  // const { datas: boardData } = useGetFullProjectBoard({ boardId });
  // if (boardData) console.log("😎😎😎😎😎😎😎😎😎😎😎", boardData);

  const [label, setLabel] = useState(data.label);
  const [description, setDescription] = useState(
    data.description || "Default description for this node",
  );
  const [status, setStatus] = useState(data.status || "in-progress");
  const [isStarred, setIsStarred] = useState(data.isStarred || false);
  const [level, setLevel] = useState(data.level || 0);

  const uniqueId = data.uniqueId;
  const [users, setUsers] = useState(data.users || []);

  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const [lastTap, setLastTap] = useState(0);

  // Update isStarred when data changes
  useEffect(() => {
    setIsStarred(data.isStarred || false);
    setLevel(data.level || 0);
  }, [data.isStarred, data.level]);

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    data.onUpdateNode?.(id, { title: newLabel });
  };

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
    data.onUpdateNode?.(id, { description: newDescription });
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    data.onUpdateNode?.(id, { status: newStatus });
  };

  const handleStarToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await toggleStar({ nodeId: id });
      setIsStarred(result.isStarred);
    } catch (error) {
      console.error("Failed to toggle star:", error);
    }
  };

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onToggleCollapse) {
      data.onToggleCollapse();
    }
  };

  const handleDoubleClick = () => {
    // Open sidebar instead of navigating to new page
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('sidebar', 'true');
    currentUrl.searchParams.set('boardId', id);
    router.push(currentUrl.toString());
  };

  const handleTouchEnd = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTap && now - lastTap < DOUBLE_TAP_DELAY) {
      data.onAddChild();
    }
    setLastTap(now);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onTogglePopup) {
      data.onTogglePopup();
    }
  };

  const trimmedDescription =
    description.length > 50
      ? description.substring(0, 50) + "..."
      : description;

  const isRootNode = level === 0;
  const hasChildren = data.hasChildren || false;
  const isCollapsed = data.isCollapsed || false;
  const showCollapseButton = hasChildren && (isHovered || isCollapsed);

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <NodePopup
        show={isHovered || data.isPopupOpen || false}
        nodeId={id}
        label={label}
        description={description}
        status={status}
        uniqueId={uniqueId}
        isPersistent={data.isPopupOpen || false}
        childNodes={data.childNodes || []}
        onClose={data.onClosePopup || (() => {})}
        workspaceId={data.workspaceId}
      />

      <Card
        className="min-w-[300px] max-w-[300px] shadow-lg border-2 hover:shadow-xl transition-all duration-200 cursor-pointer relative"
        onDoubleClick={handleDoubleClick}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
      >
        {/* Star/Pin Button */}
        <div
          className={`absolute -top-2 -right-2 z-10 p-1 rounded-full bg-background border ${
            isStarred ? "opacity-100" : "opacity-0"
          } ${isHovered ? "opacity-100" : ""} transition-opacity duration-200`}
          onClick={handleStarToggle}
        >
          <Pin
            className={`w-4 h-4 ${
              isStarred
                ? "fill-red-400 text-red-400"
                : "text-gray-400 hover:text-red-400"
            } cursor-pointer transition-colors`}
          />
        </div>

        {/* Expand/Collapse Button */}
        {showCollapseButton && (
          <div
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-10 p-1.5 rounded-full bg-background border-2 border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
            onClick={handleToggleCollapse}
            title={isCollapsed ? "Expand children" : "Collapse children"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
            ) : (
              <ChevronDown className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
              {isCollapsed ? "Expand children" : "Collapse children"}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
            </div>
          </div>
        )}

        <CardContent className="p-3">
          {!data.isRoot && (
            <Handle
              type="target"
              position={Position.Top}
              className="w-3 h-3 !bg-primary"
            />
          )}

          <div className="space-y-2">
            <div className="flex gap-1">
              {isRootNode && (
                <div className="rounded-full mt-1">
                  <Crown className="w-4 h-4 fill-yellow-100 text-yellow-600" />
                </div>
              )}

              <EditableField
                value={label}
                onChange={handleLabelChange}
                type="title"
                placeholder="Enter title"
              />
            </div>

            <StatusBadge status={status} onChange={handleStatusChange} />

            <EditableField
              value={description}
              onChange={handleDescriptionChange}
              type="description"
              placeholder="Enter description"
              displayValue={trimmedDescription}
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-3">
                <div className="flex items-center text-xs text-gray-500 space-x-1">
                  <Network className="w-3 h-3 text-blue-500" />
                  <span className="font-medium">LV-{level}</span>
                </div>
                <p className="flex items-center text-xs text-gray-500 space-x-1">
                  <Lightbulb className="w-3 h-3 font-bold text-yellow-600" />
                  <span>{uniqueId?.slice(-5)}</span>
                </p>
              </div>

              <UserAvatars
                users={users}
                onUsersChange={setUsers}
                workspaceId={data.workspaceId}
                nodeId={id}
              />
            </div>
          </div>

          <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-primary"
          />
        </CardContent>
      </Card>

      <NodeActions
        isVisible={isHovered}
        onAddChild={data.onAddChild}
        onDelete={data.onDelete}
        onExpandWithAI={data.onExpandWithAI}
        canDelete={!data.isRoot}
      />
    </div>
  );
}
