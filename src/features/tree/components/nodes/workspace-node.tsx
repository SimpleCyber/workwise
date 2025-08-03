"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActionOverlay, useHoverActions } from "../tree-actions/action-overlay";
import { CreateProjectModal } from "../tree-actions/create-project-modal";

export const WorkspaceNode = ({ data }: NodeProps) => {
  const { isHovered, hoverProps } = useHoverActions();
  const [showCreateProject, setShowCreateProject] = useState(false);

  return (
    <div className="relative" {...hoverProps}>
      <Card
        className={`min-w-[200px] shadow-md border-purple-200 cursor-pointer hover:shadow-lg transition-shadow ${
          data.isActive ? "ring-2 ring-purple-500" : ""
        }`}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3"
              onClick={() => data.onToggle?.(data.workspaceId)}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded ${
                  data.isActive ? "bg-purple-200" : "bg-purple-100"
                }`}
              >
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">{data.name}</h4>
                <Badge variant="outline" className="text-xs mt-1">
                  {data.projectCount} projects
                </Badge>
              </div>
            </div>
          </div>
          <Handle
            type="target"
            position={data.isHorizontal ? Position.Left : Position.Top}
            className="w-3 h-3"
          />
          <Handle
            type="source"
            position={data.isHorizontal ? Position.Right : Position.Bottom}
            className="w-3 h-3"
          />
        </CardContent>
      </Card>

      {/* Action Overlay - Now positioned at the top */}
      {isHovered && (
        <div
          onMouseEnter={() => {
            // Keep the overlay visible when hovering over it
          }}
          onMouseLeave={() => {
            // This will be handled by the useHoverActions hook
          }}
        >
          <ActionOverlay
            onAdd={() => setShowCreateProject(true)}
            position="top"
            isVisible={isHovered}
          />
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        workspaceId={data.workspaceId}
      />
    </div>
  );
};
