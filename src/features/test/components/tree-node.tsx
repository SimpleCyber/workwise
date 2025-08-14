"use client";

import type React from "react";
import { useState } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Card, CardContent } from "@/components/ui/card";
import { EditableField } from "./editable-field";
import { UserAvatars } from "./user-avatars";
import { NodeActions } from "./node-actions";
import { StatusBadge } from "./status-badge";
import { NodePopup } from "./node-popup";
import { MapPin } from "lucide-react";

interface TreeNodeData {
  label: string;
  description?: string;
  status?: string;
  uniqueId?: string;
  users?: Array<{ id: string; name: string; initials: string; image?: string }>;
  onAddChild: () => void;
  onDelete: () => void;
  isRoot?: boolean;
  hasChildren?: boolean;
  childNodes?: Array<{ id: string; label: string; status: string }>;
  isPopupOpen?: boolean;
  onTogglePopup?: () => void;
  onClosePopup?: () => void;
  workspaceId?: any;
  onUpdateNode?: (
    nodeId: string,
    updates: Partial<{ title: string; description: string; status: string }>,
  ) => void;
}

export function TreeNode({ data, id }: NodeProps<TreeNodeData>) {
  const [label, setLabel] = useState(data.label);
  const [description, setDescription] = useState(
    data.description || "Default description for this node",
  );
  const [status, setStatus] = useState(data.status || "in-progress"); //

  const uniqueId = data.uniqueId;
  const [users, setUsers] = useState(data.users || []);

  const [isHovered, setIsHovered] = useState(false);
  const [lastTap, setLastTap] = useState(0);

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
    description.length > 50
      ? description.substring(0, 50) + "..."
      : description;

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
              value={label}
              onChange={handleLabelChange}
              type="title"
              placeholder="Enter title"
            />

            <StatusBadge status={status} onChange={handleStatusChange} />

            <EditableField
              value={description}
              onChange={handleDescriptionChange}
              type="description"
              placeholder="Enter description"
              displayValue={trimmedDescription}
            />

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-gray-500">
                {" "}
                <MapPin /> {uniqueId}
              </p>

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
        canDelete={!data.isRoot}
      />
    </div>
  );
}
