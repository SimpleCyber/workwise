"use client";

import { useEffect, useState, useCallback } from "react";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";
import { WorkspaceNode } from "./components/nodes/workspace-node";
import { ProjectNode } from "./components/nodes/project-node";
import { ListNode } from "./components/nodes/list-node";
import { TaskNode } from "./components/nodes/task-node";
import { TreeControls } from "./components/tree-controls";
import type { TreeData } from "./api/tree-types";
import type { Id } from "../../../convex/_generated/dataModel";
import { useWorkspaceTreeData } from "./api/use-workspace-tree-data";
import { useMobile } from "@/hooks/use-mobile";

const nodeTypes = {
  workspaceNode: WorkspaceNode,
  projectNode: ProjectNode,
  listNode: ListNode,
  taskNode: TaskNode,
};

// MiniMap node color logic
const getMinimapNodeColor = (node: any) => {
  switch (node.type) {
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

interface WorkspaceOnlyVisualizationProps {
  data: TreeData;
  workspaceId: Id<"workspaces">;
}

export const WorkspaceOnlyVisualization = ({
  data,
  workspaceId,
}: WorkspaceOnlyVisualizationProps) => {
  const isMobile = useMobile();
  const { layout, viewMode, nodes, edges, onLayoutChange, setViewMode } =
    useWorkspaceTreeData({ data, workspaceId });

  const [flowNodes, setNodes, onNodesChange] = useNodesState([]);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState([]);

  const [initialViewport, setInitialViewport] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedViewport = localStorage.getItem(`workspace-tree-viewport-${workspaceId}`);
      if (savedViewport) {
        try {
          setInitialViewport(JSON.parse(savedViewport));
        } catch (e) {
          console.error("Failed to parse saved viewport", e);
        }
      }
    }
    setIsMounted(true);
  }, [workspaceId]);

  const handleMoveEnd = useCallback((event: any, viewport: any) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`workspace-tree-viewport-${workspaceId}`, JSON.stringify(viewport));
    }
  }, [workspaceId]);

  useEffect(() => {
    const nodesWithTransition = nodes.map((node) => ({
      ...node,
      style: { ...node.style, transition: "all 0.5s ease" },
    }));
    setNodes(nodesWithTransition);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  if (!isMounted) return null;

  return (
    <div className="w-full h-full flex flex-col">
      {/* <TreeControls
        data={data}
        viewMode={viewMode}
        layout={layout}
        onViewModeChange={setViewMode}
        onLayoutChange={onLayoutChange}
      /> */}

      <div className="flex-1 overflow-hidden">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView={!initialViewport}
          defaultViewport={initialViewport || undefined}
          onMoveEnd={handleMoveEnd}
          // fitViewOptions={{ padding: 10 }}
          defaultEdgeOptions={{
            type: "default",
            animated: true,
            style: {
              strokeWidth: 2,
              stroke: "#94a3b8",
            },
          }}
        >
          {/* <Background className="bg-gray-200 dark:bg-gray-800" /> */}
          <Controls />

          {/* Enhanced MiniMap */}
          <MiniMap
            nodeColor={getMinimapNodeColor}
            nodeStrokeWidth={2}
            nodeStrokeColor={(node) =>
              node.data?.isActive ? "#1f2937" : "transparent"
            }
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
              width: isMobile ? 120 : 200,
              height: isMobile ? 90 : 150,
            }}
            pannable
            zoomable
            ariaLabel="Interactive tree structure minimap - click and drag to navigate"
          />
        </ReactFlow>
      </div>
    </div>
  );
};
