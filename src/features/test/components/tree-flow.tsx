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
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const createInitialWorkspaceNode = useCallback(async () => {
    try {
      await createNode({
        workspaceId,
        title: "Workspace",
        description: "Main workspace node",
        position: { x: 400, y: 100 },
      });
      toast.success("Workspace node created!");
    } catch (error) {
      toast.error("Failed to create workspace node");
    }
  }, [workspaceId, createNode]);

  useEffect(() => {
    if (!treeNodes || treeNodes.length === 0) return;

    const reactFlowNodes: Node[] = [];
    const reactFlowEdges: Edge[] = [];

    const nodeMap = new Map();
    treeNodes.forEach((node) => {
      nodeMap.set(node.nodeId, node);
    });

    const processNode = (node: any) => {
      const reactFlowNode: Node = {
        id: node.nodeId,
        type: "treeNode",
        position: { x: 0, y: 0 }, // let layout manager handle positions
        data: {
          label: node.title,
          description: node.description || "No description",
          status: node.status,
          uniqueId:
            node.nodeId.length > 15
              ? `...${node.nodeId.slice(-8)}`
              : node.nodeId,
          users:
            node.users?.map((user: any) => ({
              id: user.memberId,
              name: user.user?.name || "Unknown",
              initials: user.user?.name?.charAt(0).toUpperCase() || "U",
              image: user.user?.image,
            })) || [],
          onAddChild: () => addChildNodeHandler(node.nodeId),
          onDelete: () => deleteNodeHandler(node.nodeId),
          isRoot: node.level === 0,
          hasChildren: false,
          childNodes: [],
          workspaceId,
          onUpdateNode: updateNodeHandler,
        },
      };
      reactFlowNodes.push(reactFlowNode);

      if (node.parentId) {
        reactFlowEdges.push({
          id: `e${node.parentId}-${node.nodeId}`,
          source: node.parentId,
          target: node.nodeId,
          ...edgeOptions,
        });
      }
    };

    treeNodes.forEach(processNode);

    // Update child metadata
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

    // Apply symmetrical layout
    const positionedNodes = layoutManager.recalculateTreeLayout(
      reactFlowNodes,
      reactFlowEdges,
    );

    setNodes(positionedNodes);
    setEdges(reactFlowEdges);
  }, [treeNodes, workspaceId, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const addChildNodeHandler = useCallback(
    async (parentId: string) => {
      try {
        const parentNode = nodes.find((n) => n.id === parentId);
        const childrenCount = edges.filter((e) => e.source === parentId).length;
        const newPosition = {
          x: (parentNode?.position.x || 0) + 350,
          y: (parentNode?.position.y || 0) + childrenCount * 150 - 75,
        };

        await createNode({
          workspaceId,
          parentId,
          title: "New Node",
          description: "New child node",
          position: newPosition,
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
    [workspaceId, createNode, nodes, edges],
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

  if (!treeNodes || treeNodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Start Your Workspace Tree
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Create your first workspace node to begin organizing your project
            </p>
          </div>
          <Button
            onClick={createInitialWorkspaceNode}
            className="flex items-center gap-2"
            size="lg"
          >
            <Plus className="w-4 h-4" />
            Create Workspace Node
          </Button>
        </div>
      </div>
    );
  }

  const nodesWithCallbacks = nodes.map((node) => {
    return {
      ...node,
      data: {
        ...node.data,
        isPopupOpen: false, // Disable popup by default
        onTogglePopup: () => {}, // Disable popup functionality
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
