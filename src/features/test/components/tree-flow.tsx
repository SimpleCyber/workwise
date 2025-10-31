"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
  useReactFlow,
} from "reactflow";
import { TreeNode } from "./tree-node";
import { TreeLayoutManager } from "../lib/tree-layout-manager";
import type { TreeFlowProps } from "../api/tree-flow-props";
import { useGetTreeNodes } from "../api/use-get-tree-nodes";
import { useCreateTreeNode } from "../api/use-create-tree-node";
import { useUpdateTreeNode } from "../api/use-update-tree-node";
import { useDeleteTreeNode } from "../api/use-delete-tree-node";
import { useToggleStar } from "../api/use-toggle-stars";

import { useGetWorkspaceMembers } from "../api/use-get-workspace-members";
import { useExpandNodeWithAI } from "../api/use-ai-tree-generation";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AITreeDialog } from "./ai-tree-dialog";
import { aiTreeService } from "@/lib/ai-service";

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
  type: "default",
  pathOptions: {
    borderRadius: 20,
  },
};

const getMiniMapNodeColor = (node: Node) => {
  if (node.data.isStarred) {
    return "#ef4444";
  }
  if (node.data.level == 0) {
    return "#FFF000";
  }
  return "#3b82f6";
};

export function TreeFlow({
  workspaceId,
  sidebarOpen,
  activeNodeId,
}: TreeFlowProps & { sidebarOpen?: boolean; activeNodeId?: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const { data: treeNodes, isLoading: nodesLoading } = useGetTreeNodes({
    workspaceId,
  });
  const { data: members, isLoading: membersLoading } = useGetWorkspaceMembers({
    workspaceId,
  });
  const createNode = useCreateTreeNode();
  const updateNode = useUpdateTreeNode();
  const deleteNode = useDeleteTreeNode();
  const expandWithAI = useExpandNodeWithAI();
  const toggleStar = useToggleStar();

  const layoutManager = useMemo(() => new TreeLayoutManager(), []);

  // Function to check if a node should be visible (not hidden by collapsed parent)
  const isNodeVisible = useCallback(
    (nodeId: string, allNodes: any[]) => {
      const node = allNodes.find((n) => n.nodeId === nodeId);
      if (!node || !node.parentId) return true;

      // Check if any ancestor is collapsed
      let currentParentId = node.parentId;
      while (currentParentId) {
        if (collapsedNodes.has(currentParentId)) {
          return false;
        }
        const parentNode = allNodes.find((n) => n.nodeId === currentParentId);
        currentParentId = parentNode?.parentId;
      }
      return true;
    },
    [collapsedNodes],
  );

  // Function to get all descendant nodes of a given node
  const getDescendantNodes = useCallback(
    (nodeId: string, allNodes: any[]): string[] => {
      const descendants: string[] = [];
      const children = allNodes.filter((n) => n.parentId === nodeId);

      for (const child of children) {
        descendants.push(child.nodeId);
        descendants.push(...getDescendantNodes(child.nodeId, allNodes));
      }

      return descendants;
    },
    [],
  );

  // Toggle collapse state of a node
  const toggleNodeCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const createInitialWorkspaceNode = useCallback(async () => {
    // Close any pending AI dialog open state before creating a manual node
    setIsAIDialogOpen(false);
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

  const expandNodeWithAIHandler = useCallback(
    async (nodeId: string, customPrompt?: string) => {
      try {
        const node = treeNodes?.find((n) => n.nodeId === nodeId);
        if (!node) {
          toast.error("Node not found");
          return;
        }

        toast.info("Generating child nodes with AI...");

        const rootNode = treeNodes?.find((n) => n.level === 0);
        const projectContext = rootNode
          ? `${rootNode.title}: ${rootNode.description}`
          : "General project";

        const childNodes = customPrompt
          ? await aiTreeService.expandNodeWithPrompt(
              node.title,
              node.description || "",
              customPrompt,
              projectContext,
            )
          : await aiTreeService.expandNode(
              node.title,
              node.description || "",
              projectContext,
            );

        await expandWithAI({
          workspaceId,
          parentNodeId: nodeId,
          childNodes,
        });

        toast.success("Node expanded with AI successfully!");
      } catch (error) {
        console.error("AI Node Expansion Error:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to expand node with AI",
        );
      }
    },
    [workspaceId, expandWithAI, treeNodes],
  );

  useEffect(() => {
    if (!treeNodes || treeNodes.length === 0) return;

    const reactFlowNodes: Node[] = [];
    const reactFlowEdges: Edge[] = [];

    const nodeMap = new Map();
    treeNodes.forEach((node) => {
      nodeMap.set(node.nodeId, node);
    });

    const processNode = (node: any) => {
      // Only process visible nodes
      if (!isNodeVisible(node.nodeId, treeNodes)) {
        return;
      }

      const directChildren = treeNodes.filter(
        (n) => n.parentId === node.nodeId,
      );
      const hasChildren = directChildren.length > 0;
      const isCollapsed = collapsedNodes.has(node.nodeId);

      const reactFlowNode: Node = {
        id: node.nodeId,
        type: "treeNode",
        position: { x: 0, y: 0 },
        data: {
          label: node.title,
          description: node.description || "No description",
          status: node.status,
          isStarred: node.isStarred || false,
          uniqueId: node.nodeId,
          level: node.level || 0,
          users:
            node.users?.map((user: any) => ({
              id: user.memberId,
              name: user.user?.name || "Unknown",
              initials: user.user?.name?.charAt(0).toUpperCase() || "U",
              image: user.user?.image,
            })) || [],
          onAddChild: () => addChildNodeHandler(node.nodeId),
          onDelete: () => deleteNodeHandler(node.nodeId),
          onExpandWithAI: (prompt: string) =>
            expandNodeWithAIHandler(node.nodeId, prompt),
          isRoot: node.level === 0,
          hasChildren: hasChildren,
          isCollapsed: isCollapsed,
          onToggleCollapse: () => toggleNodeCollapse(node.nodeId),
          childNodes: directChildren.map((child) => ({
            id: child.nodeId,
            label: child.title,
            status: child.status,
          })),
          workspaceId,
          isActive: !!activeNodeId && node.nodeId === activeNodeId,
          onUpdateNode: updateNodeHandler,
        },
      };
      reactFlowNodes.push(reactFlowNode);

      // Only add edges to visible child nodes
      if (node.parentId && isNodeVisible(node.parentId, treeNodes)) {
        reactFlowEdges.push({
          id: `e${node.parentId}-${node.nodeId}`,
          source: node.parentId,
          target: node.nodeId,
          ...edgeOptions,
        });
      }
    };

    treeNodes.forEach(processNode);

    const positionedNodes = layoutManager.recalculateTreeLayout(
      reactFlowNodes,
      reactFlowEdges,
    );

    // Wrap the layout calculation in setTimeout
    const timer = setTimeout(() => {
      const positionedNodes = layoutManager.recalculateTreeLayout(
        reactFlowNodes,
        reactFlowEdges,
      );

      setNodes(positionedNodes);
      setEdges(reactFlowEdges);
    }, 0);

    return () => clearTimeout(timer);
  }, [
    treeNodes,
    workspaceId,
    collapsedNodes,
    setNodes,
    setEdges,
    expandNodeWithAIHandler,
    isNodeVisible,
    toggleNodeCollapse,
    activeNodeId,
    layoutManager,
  ]);

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

        // Auto-expand the parent if it was collapsed
        if (collapsedNodes.has(parentId)) {
          toggleNodeCollapse(parentId);
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to create child node",
        );
      }
    },
    [workspaceId, createNode, nodes, edges, collapsedNodes, toggleNodeCollapse],
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

  const togglestar = useCallback(
    async (nodeId: string) => {
      toggleStar({ nodeId });
    },
    [toggleStar],
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
      <>
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Start Your Workspace Tree
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Create your first workspace node manually or let AI generate a
                complete project breakdown
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={createInitialWorkspaceNode}
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
                size="lg"
              >
                <Plus className="w-4 h-4" />
                Create Manually
              </Button>
              <Button
                onClick={() => setIsAIDialogOpen(true)}
                className="flex items-center gap-2"
                size="lg"
              >
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </Button>
            </div>
          </div>
        </div>

        {/* Mount the dialog even in empty state so it can open immediately */}
        <AITreeDialog
          isOpen={isAIDialogOpen}
          onClose={() => setIsAIDialogOpen(false)}
          workspaceId={workspaceId}
        />
      </>
    );
  }

  const nodesWithCallbacks = nodes.map((node) => {
    return {
      ...node,
      data: {
        ...node.data,
        isPopupOpen: false,
        onTogglePopup: () => {},
        onClosePopup: closePopup,
        members: members || [],
        workspaceId: workspaceId || "your-workspace-id",
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
        key={`flow-${workspaceId}-${nodes.length}`}
        nodes={nodesWithCallbacks}
        edges={styledEdges}
        fitView
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        className="bg-background"
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
      >
        <Controls />
        <MiniMap
          nodeColor={getMiniMapNodeColor}
          maskColor="rgba(0, 0, 0, 0.2)"
          pannable={true}
          zoomable={true}
          className="bg-background border border-border rounded-lg transition-all duration-300"
          style={{
            width: sidebarOpen ? 150 : 200,
            height: sidebarOpen ? 120 : 150,
          }}
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
