"use client";

import { useCallback, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TreeNode } from "./tree-node";
import { TreeLayoutManager } from "../lib/tree-layout-manager";

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

interface TreeFlowProps {
  workspaceId: string;
}

export function TreeFlow({ workspaceId }: TreeFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activePopup, setActivePopup] = useState<string | null>(null);

  const treeNodes = useQuery(api.advancetree.getTreeNodes, { workspaceId });
  const createNode = useMutation(api.advancetree.createTreeNode);
  const createChildNode = useMutation(api.advancetree.createChildNode);
  const deleteNode = useMutation(api.advancetree.deleteTreeNode);
  const updateNode = useMutation(api.advancetree.updateNodeWithPermission);

  const layoutManager = new TreeLayoutManager();

  useEffect(() => {
    if (!treeNodes) return;

    const flowNodes: Node[] = treeNodes.map((node) => ({
      id: node.nodeId,
      type: "treeNode",
      position: { x: node.positionX || 0, y: node.positionY || 0 },
      data: {
        label: node.title,
        description: node.description,
        status: node.status,
        uniqueId: node.nodeId,
        users:
          node.assignedUsers?.map((user) => ({
            id: user.userId,
            name: user.member?.name || "Unknown",
            initials:
              user.member?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "??",
          })) || [],
        onAddChild: () => addChildNode(node.nodeId),
        onDelete: () => handleDeleteNode(node.nodeId),
        isRoot: !node.parentId,
        hasChildren: treeNodes.some((n) => n.parentId === node.nodeId),
        childNodes: treeNodes
          .filter((n) => n.parentId === node.nodeId)
          .map((child) => ({
            id: child.nodeId,
            label: child.title,
            status: child.status,
          })),
        isPopupOpen: activePopup === node.nodeId,
        onTogglePopup: () => togglePopup(node.nodeId),
        onClosePopup: closePopup,
        onUpdateNode: (updates: any) => handleUpdateNode(node.nodeId, updates),
      },
    }));

    const flowEdges: Edge[] = treeNodes
      .filter((node) => node.parentId)
      .map((node) => ({
        id: `${node.parentId}-${node.nodeId}`,
        source: node.parentId!,
        target: node.nodeId,
        ...edgeOptions,
      }));

    const positionedNodes = layoutManager.recalculateTreeLayout(
      flowNodes,
      flowEdges,
    );

    setNodes(positionedNodes);
    setEdges(flowEdges);
  }, [treeNodes, activePopup]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const addChildNode = useCallback(
    async (parentId: string) => {
      try {
        await createChildNode({
          workspaceId,
          parentId,
          title: `New Node`,
          description: "New node description",
        });
      } catch (error) {
        console.error("Failed to create child node:", error);
      }
    },
    [workspaceId, createChildNode],
  );

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      try {
        await deleteNode({ workspaceId, nodeId });
      } catch (error) {
        console.error("Failed to delete node:", error);
      }
    },
    [workspaceId, deleteNode],
  );

  const handleUpdateNode = useCallback(
    async (nodeId: string, updates: any) => {
      try {
        await updateNode({
          workspaceId,
          nodeId,
          ...updates,
        });
      } catch (error) {
        console.error("Failed to update node:", error);
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

  if (!treeNodes) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-lg">Loading tree structure...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full" onClick={closePopup}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
