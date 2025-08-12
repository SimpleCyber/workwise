"use client";

import { useEffect, useState } from "react";
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { UserNode } from "./components/nodes/user-node";
import { WorkspaceNode } from "./components/nodes/workspace-node";
import { ProjectNode } from "./components/nodes/project-node";
import { ListNode } from "./components/nodes/list-node";
import { TaskNode } from "./components/nodes/task-node";
import { TreeControls } from "./components/tree-controls";
import { MinimapLegend } from "./components/minimap-legend";
import type { TreeData } from "./api/tree-types";
import type { Id } from "../../../convex/_generated/dataModel";
import { useTreeData } from "./api/use-tree-data";

const nodeTypes = {
  userNode: UserNode,
  workspaceNode: WorkspaceNode,
  projectNode: ProjectNode,
  listNode: ListNode,
  taskNode: TaskNode,
};

// Enhanced minimap node color function
const getMinimapNodeColor = (node: any) => {
  switch (node.type) {
    case "userNode":
      return "#3b82f6"; // Blue
    case "workspaceNode":
      return "#8b5cf6"; // Purple
    case "projectNode":
      return node.data?.hasHoldTasks ? "#ef4444" : "#10b981"; // Red or Green
    case "listNode":
      return "#f59e0b"; // Amber
    case "taskNode":
      switch (node.data?.task?.priority) {
        case "urgent":
          return "#dc2626"; // Red
        case "high":
          return "#ea580c"; // Orange
        case "medium":
          return "#ca8a04"; // Yellow
        case "low":
          return "#16a34a"; // Green
        default:
          return "#6b7280"; // Gray
      }
    default:
      return "#6b7280"; // Gray
  }
};

interface EnhancedTreeVisualizationProps {
  data: TreeData;
  workspaceId: Id<"workspaces">;
}

export const TreeVisualization = ({
  data,
  workspaceId,
}: EnhancedTreeVisualizationProps) => {
  const { layout, viewMode, nodes, edges, onLayoutChange, setViewMode } =
    useTreeData({ data, workspaceId });

  const [flowNodes, setNodes, onNodesChange] = useNodesState([]);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showLegend, setShowLegend] = useState(false);

  // Update nodes when layout or viewMode changes
  useEffect(() => {
    const nodesWithTransition = nodes.map((node) => ({
      ...node,
      style: { ...node.style, transition: "all 0.5s ease" },
    }));
    setNodes(nodesWithTransition);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  return (
    <div className="w-full h-full flex flex-col relative">
      <TreeControls
        data={data}
        viewMode={viewMode}
        layout={layout}
        onViewModeChange={setViewMode}
        onLayoutChange={onLayoutChange}
      />

      <div className="flex-1 overflow-hidden">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 50 }}
          defaultEdgeOptions={{
            type: "default",
            animated: true,
            style: {
              strokeWidth: 2,
              stroke: "#94a3b8",
            },
          }}
        >
          <Background className="bg-gray-200 dark:bg-gray-800" />
          <Controls />

          {/* Enhanced MiniMap with better styling */}
          <MiniMap
            nodeColor={getMinimapNodeColor}
            nodeStrokeWidth={2}
            nodeStrokeColor={(node) => {
              if (node.data?.isActive) {
                return "#1f2937";
              }
              return "transparent";
            }}
            nodeBorderRadius={6}
            maskColor="rgba(0, 0, 0, 0.05)"
            maskStrokeColor="rgba(0, 0, 0, 0.1)"
            maskStrokeWidth={1}
            position="bottom-right"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.98)",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              width: 200,
              height: 150,
            }}
            pannable
            zoomable
            ariaLabel="Interactive tree structure minimap - click and drag to navigate"
          />
        </ReactFlow>
      </div>

      {/* Minimap Legend */}
      <MinimapLegend
        isVisible={showLegend}
        onToggle={() => setShowLegend(!showLegend)}
      />
    </div>
  );
};
