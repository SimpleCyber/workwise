"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card, CardContent } from "@/components/ui/card";
import { NodePopup } from "./node-popup";
import { EditableField } from "./editable-field";
import { UserAvatars } from "./user-avatars";
import { NodeActions } from "./node-actions";
import { StatusBadge } from "./status-badge";

interface TreeNodeData {
  label: string;
  description?: string;
  status?: string;
  uniqueId?: string;
  users?: Array<{ id: string; name: string; initials: string }>;
  onAddChild: () => void;
  onDelete: () => void;
  onUpdateNode?: (updates: any) => void;
  isRoot?: boolean;
  hasChildren?: boolean;
  childNodes?: Array<{ id: string; label: string; status: string }>;
  isPopupOpen?: boolean;
  onTogglePopup?: () => void;
  onClosePopup?: () => void;
}

export function TreeNode({ data, id }: NodeProps<TreeNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  const handleLabelChange = useCallback(
    (newLabel: string) => {
      if (data.onUpdateNode) {
        data.onUpdateNode({ title: newLabel });
      }
    },
    [data.onUpdateNode],
  );

  const handleDescriptionChange = useCallback(
    (newDescription: string) => {
      if (data.onUpdateNode) {
        data.onUpdateNode({ description: newDescription });
      }
    },
    [data.onUpdateNode],
  );

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      if (data.onUpdateNode) {
        data.onUpdateNode({ status: newStatus });
      }
    },
    [data.onUpdateNode],
  );

  const handleUniqueIdChange = useCallback(
    (newId: string) => {
      if (data.onUpdateNode) {
        data.onUpdateNode({ nodeId: newId });
      }
    },
    [data.onUpdateNode],
  );

  const handleDoubleClick = () => {
    data.onAddChild();
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
    data.description && data.description.length > 50
      ? data.description.substring(0, 50) + "..."
      : data.description || "No description";

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NodePopup
        show={isHovered || data.isPopupOpen || false}
        nodeId={id}
        label={data.label}
        description={data.description || ""}
        status={data.status || "Open"}
        uniqueId={data.uniqueId || ""}
        isPersistent={data.isPopupOpen || false}
        childNodes={data.childNodes || []}
        onClose={data.onClosePopup || (() => {})}
      />

      <Card
        className="min-w-[300px] max-w-[300px] shadow-lg border-2 hover:shadow-xl transition-all duration-200 cursor-pointer"
        onDoubleClick={handleDoubleClick}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
      >
        <CardContent className="p-3">
          {!data.isRoot && (
            <Handle
              type="target"
              position={Position.Top}
              className="w-3 h-3 !bg-primary"
            />
          )}

          <div className="space-y-2">
            <EditableField
              value={data.label}
              onChange={handleLabelChange}
              type="title"
              placeholder="Enter title"
            />

            <StatusBadge
              status={data.status || "Open"}
              onChange={handleStatusChange}
            />

            <EditableField
              value={data.description || ""}
              onChange={handleDescriptionChange}
              type="description"
              placeholder="Enter description"
              displayValue={trimmedDescription}
            />

            <div className="flex items-center justify-between pt-1">
              <EditableField
                value={data.uniqueId || ""}
                onChange={handleUniqueIdChange}
                type="id"
                placeholder="Enter ID"
              />

              <UserAvatars
                users={data.users || []}
                onUsersChange={() => {}} // TODO: Implement user management
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
        canDelete={id !== "1"}
      />
    </div>
  );
}
