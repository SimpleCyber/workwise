"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Users, RotateCw } from "lucide-react";
import type { ViewMode, Layout, TreeData } from "../api/tree-types";

interface TreeControlsProps {
  data: TreeData;
  viewMode: ViewMode;
  layout: Layout;
  onViewModeChange: (mode: ViewMode) => void;
  onLayoutChange: () => void;
}

export const TreeControls = ({
  data,
  viewMode,
  layout,
  onViewModeChange,
  onLayoutChange,
}: TreeControlsProps) => {
  const totalProjects = data.workspaces.reduce(
    (acc, ws) => acc + ws.projects.length,
    0,
  );
  const totalTasks = data.workspaces.reduce(
    (acc, ws) => acc + ws.projects.reduce((pacc, p) => pacc + p.totalTasks, 0),
    0,
  );

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 border-b flex-shrink-0">
      <div className="flex items-center gap-3">
        <h3 className="font-medium">Organization Tree</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {totalProjects} projects
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {totalTasks} tasks
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Select value={viewMode} onValueChange={onViewModeChange}>
          <SelectTrigger className="w-28 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">
              <div className="flex items-center gap-2">
                <Eye className="w-3 h-3" />
                Overview
              </div>
            </SelectItem>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3" />
                Show All
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={onLayoutChange}
          className="h-8 bg-transparent"
        >
          <RotateCw className="w-3 h-3 mr-1" />
          {layout === "vertical" ? "Horizontal" : "Vertical"}
        </Button>
      </div>
    </div>
  );
};
