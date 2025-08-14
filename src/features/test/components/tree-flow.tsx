"use client"

import { useCallback, useState, useEffect } from "react"
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
} from "reactflow"
import "reactflow/dist/style.css"
import { TreeNode } from "./tree-node"
import { TreeLayoutManager } from "../lib/tree-layout-manager"
import type { TreeFlowProps } from "./tree-flow-props"

const nodeTypes = {
  treeNode: TreeNode,
}

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
}

export function TreeFlow({ workspaceId }: TreeFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [activePopup, setActivePopup] = useState<string | null>(null)
  const [nodeCounter, setNodeCounter] = useState(1)

  const layoutManager = new TreeLayoutManager()

  useEffect(() => {
    // Start with just the workspace root node
    const rootNodeId = `workspace-root-${workspaceId}`
    const rootNode: Node = {
      id: rootNodeId,
      type: "treeNode",
      position: { x: 400, y: 100 },
      data: {
        label: "Workspace Root",
        description: "Main workspace root node",
        status: "Open",
        uniqueId: rootNodeId,
        users: [],
        onAddChild: () => addChildNodeHandler(rootNodeId),
        onDelete: () => {}, // Root node cannot be deleted
        isRoot: true,
        hasChildren: false,
        childNodes: [],
      },
    }

    setNodes([rootNode])
    setEdges([])
  }, [workspaceId, setNodes, setEdges])

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  const addChildNodeHandler = useCallback(
    (parentId: string) => {
      const newNodeId = `node-${Date.now()}-${nodeCounter}`
      setNodeCounter((prev) => prev + 1)

      const newNode: Node = {
        id: newNodeId,
        type: "treeNode",
        position: { x: 0, y: 0 }, // Will be recalculated by layout manager
        data: {
          label: `New Node ${nodeCounter}`,
          description: "New child node",
          status: "Open",
          uniqueId: newNodeId,
          users: [],
          onAddChild: () => addChildNodeHandler(newNodeId),
          onDelete: () => deleteNodeHandler(newNodeId),
          isRoot: false,
          hasChildren: false,
          childNodes: [],
        },
      }

      const newEdge: Edge = {
        id: `e${parentId}-${newNodeId}`,
        source: parentId,
        target: newNodeId,
        ...edgeOptions,
      }

      setNodes((prevNodes) => {
        const updatedNodes = [...prevNodes, newNode]
        // Recalculate layout with new node
        const layoutedNodes = layoutManager.recalculateTreeLayout(updatedNodes, [...edges, newEdge])
        return layoutedNodes
      })

      setEdges((prevEdges) => [...prevEdges, newEdge])

      // Update parent node to show it has children
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === parentId
            ? {
                ...node,
                data: {
                  ...node.data,
                  hasChildren: true,
                  childNodes: [
                    ...(node.data.childNodes || []),
                    {
                      id: newNodeId,
                      label: `New Node ${nodeCounter}`,
                      status: "Open",
                    },
                  ],
                },
              }
            : node,
        ),
      )
    },
    [nodeCounter, edges, layoutManager, setNodes, setEdges],
  )

  const deleteNodeHandler = useCallback(
    (nodeId: string) => {
      // Find all descendant nodes to delete
      const nodesToDelete = new Set([nodeId])
      const findDescendants = (parentId: string) => {
        edges.forEach((edge) => {
          if (edge.source === parentId) {
            nodesToDelete.add(edge.target)
            findDescendants(edge.target)
          }
        })
      }
      findDescendants(nodeId)

      // Remove nodes and edges
      setNodes((prevNodes) => {
        const remainingNodes = prevNodes.filter((node) => !nodesToDelete.has(node.id))
        // Recalculate layout after deletion
        const remainingEdges = edges.filter(
          (edge) => !nodesToDelete.has(edge.source) && !nodesToDelete.has(edge.target),
        )
        const layoutedNodes = layoutManager.recalculateTreeLayout(remainingNodes, remainingEdges)
        return layoutedNodes
      })

      setEdges((prevEdges) =>
        prevEdges.filter((edge) => !nodesToDelete.has(edge.source) && !nodesToDelete.has(edge.target)),
      )

      // Update parent nodes to reflect children changes
      const parentEdge = edges.find((edge) => edge.target === nodeId)
      if (parentEdge) {
        setNodes((prevNodes) =>
          prevNodes.map((node) => {
            if (node.id === parentEdge.source) {
              const remainingChildren = node.data.childNodes?.filter((child: any) => !nodesToDelete.has(child.id)) || []
              return {
                ...node,
                data: {
                  ...node.data,
                  hasChildren: remainingChildren.length > 0,
                  childNodes: remainingChildren,
                },
              }
            }
            return node
          }),
        )
      }
    },
    [edges, layoutManager, setNodes, setEdges],
  )

  const updateNodeHandler = useCallback(
    (nodeId: string, updates: Partial<{ title: string; description: string; status: string }>) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  label: updates.title || node.data.label,
                  description: updates.description || node.data.description,
                  status: updates.status || node.data.status,
                },
              }
            : node,
        ),
      )
    },
    [setNodes],
  )

  const closePopup = useCallback(() => {
    setActivePopup(null)
  }, [])

  const togglePopup = useCallback((nodeId: string) => {
    setActivePopup((prev) => (prev === nodeId ? null : nodeId))
  }, [])

  const nodesWithCallbacks = nodes.map((node) => {
    const childNodes = nodes
      .filter((n) => edges.some((e) => e.source === node.id && e.target === n.id))
      .map((child) => ({
        id: child.id,
        label: child.data.label,
        status: child.data.status,
      }))

    return {
      ...node,
      data: {
        ...node.data,
        childNodes,
        isPopupOpen: activePopup === node.id,
        onTogglePopup: () => togglePopup(node.id),
        onClosePopup: closePopup,
        workspaceId,
        onUpdateNode: updateNodeHandler,
      },
    }
  })

  const styledEdges = edges.map((edge) => ({
    ...edge,
    ...edgeOptions,
  }))

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
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-30" />
      </ReactFlow>
    </div>
  )
}
