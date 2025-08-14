"use client";

import { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { TreeNode } from "./tree-node";
import { TreeLayoutManager } from "../lib/tree-layout-manager";
import type { TreeFlowProps } from "./tree-flow-props";
import { useGetTreeNodes } from "../api/use-get-tree-nodes";
import { useCreateTreeNode } from "../api/use-create-tree-node";
import { useUpdateTreeNode } from "../api/use-update-tree-node";
import { useDeleteTreeNode } from "../api/use-delete-tree-node";
import { useGetWorkspaceMembers } from "../api/use-get-workspace-members";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const nodeTypes = {
  treeNode: TreeNode,
};

const edgeOptions = {
  animated: true,
  style: {
    strokeWidth: 2,
    stroke: "#3b82f6",
    strokeDasharray: "8,4",
  },
  type: "bezier",
  pathOptions: {
    borderRadius: 20,
  },
};

export function TreeFlow({ workspaceId }: TreeFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activePopup, setActivePopup] = useState<string | null>(null);

  const { data: treeNodes, isLoading: nodesLoading } = useGetTreeNodes({
    workspaceId,
  });
  const { data: members, isLoading: membersLoading } = useGetWorkspaceMembers({
    workspaceId,
  });
  const createNode = useCreateTreeNode();
  const updateNode = useUpdateTreeNode();
  const deleteNode = useDeleteTreeNode();

  const layoutManager = new TreeLayoutManager();

  useEffect(() => {
    if (!treeNodes || treeNodes.length === 0) return;

    const reactFlowNodes: Node[] = [];
    const reactFlowEdges: Edge[] = [];

    // Convert tree nodes to ReactFlow format
    treeNodes.forEach((treeNode) => {
      const reactFlowNode: Node = {
        id: treeNode.nodeId,
        type: "treeNode",
        position: treeNode.position,
        data: {
          label: treeNode.title,
          description: treeNode.description || "No description",
          status: treeNode.status,
          uniqueId: treeNode.nodeId,
          users:
            treeNode.users?.map((user) => ({
              id: user.memberId,
              name: user.user?.name || "Unknown",
              initials: user.user?.name?.charAt(0).toUpperCase() || "U",
            })) || [],
          onAddChild: () => addChildNodeHandler(treeNode.nodeId),
          onDelete: () => deleteNodeHandler(treeNode.nodeId),
          isRoot: treeNode.level === 0,
          hasChildren: false, // Will be calculated below
          childNodes: [],
          workspaceId,
          onUpdateNode: updateNodeHandler,
        },
      };
      reactFlowNodes.push(reactFlowNode);

      // Create edges for parent-child relationships
      if (treeNode.parentId) {
        const edge: Edge = {
          id: `e${treeNode.parentId}-${treeNode.nodeId}`,
          source: treeNode.parentId,
          target: treeNode.nodeId,
          ...edgeOptions,
        };
        reactFlowEdges.push(edge);
      }
    });

    // Update hasChildren and childNodes for each node
    reactFlowNodes.forEach((node) => {
      const children = reactFlowEdges
        .filter((edge) => edge.source === node.id)
        .map((edge) => {
          const childNode = reactFlowNodes.find((n) => n.id === edge.target);
          return childNode
            ? {
                id: childNode.id,
                label: childNode.data.label,
                status: childNode.data.status,
              }
            : null;
        })
        .filter(Boolean);

      node.data.hasChildren = children.length > 0;
      node.data.childNodes = children;
    });

    setNodes(reactFlowNodes);
    setEdges(reactFlowEdges);
  }, [treeNodes, workspaceId, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const addChildNodeHandler = useCallback(
    async (parentId: string) => {
      try {
        await createNode({
          workspaceId,
          parentId,
          title: "New Node",
          description: "New child node",
          position: { x: 0, y: 0 }, // Will be recalculated by layout
        });
        toast.success("Child node created successfully!");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to create child node",
        );
      }
    },
    [workspaceId, createNode],
  );

  const deleteNodeHandler = useCallback(
    async (nodeId: string) => {
      if (
        confirm(
          "Are you sure you want to delete this node and all its children?",
        )
      ) {
        try {
          await deleteNode({ nodeId });
          toast.success("Node deleted successfully!");
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to delete node",
          );
        }
      }
    },
    [deleteNode],
  );

  const updateNodeHandler = useCallback(
    async (
      nodeId: string,
      updates: Partial<{ title: string; description: string; status: string }>,
    ) => {
      const updateData: any = { nodeId, workspaceId };
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.status) updateData.status = updates.status;

      try {
        await updateNode(updateData);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update node",
        );
      }
    },
    [workspaceId, updateNode],
  );

  const closePopup = useCallback(() => {
    setActivePopup(null);
  }, []);

  const togglePopup = useCallback((nodeId: string) => {
    setActivePopup((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  if (nodesLoading || membersLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm text-gray-500">Loading tree data...</p>
        </div>
      </div>
    );
  }

  const nodesWithCallbacks = nodes.map((node) => {
    return {
      ...node,
      data: {
        ...node.data,
        isPopupOpen: activePopup === node.id,
        onTogglePopup: () => togglePopup(node.id),
        onClosePopup: closePopup,
        members: members || [],
      },
    };
  });

  const styledEdges = edges.map((edge) => ({
    ...edge,
    ...edgeOptions,
  }));

  return (
    <div className="w-full h-full" onClick={closePopup}>
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
      >
        <Controls />
        <MiniMap
          nodeColor="#3b82f6"
          maskColor="rgba(0, 0, 0, 0.2)"
          pannable={true}
          zoomable={true}
          className="bg-background border border-border rounded-lg"
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className="opacity-30"
        />
      </ReactFlow>
    </div>
  );
}
