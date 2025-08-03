"use client"

import {  useEffect } from "react"
import ReactFlow, {

  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "reactflow"
import "reactflow/dist/style.css"

import { UserNode } from "./components/nodes/user-node"
import { WorkspaceNode } from "./components/nodes/workspace-node"
import { ProjectNode } from "./components/nodes/project-node"
import { ListNode } from "./components/nodes/list-node"
import { TaskNode } from "./components/nodes/task-node"
import { TreeControls } from "./components/tree-controls"

import type { TreeData } from "./api/tree-types"
import type { Id } from "../../../convex/_generated/dataModel"
import { useTreeData } from "./api/use-tree-data"

const nodeTypes = {
  userNode: UserNode,
  workspaceNode: WorkspaceNode,
  projectNode: ProjectNode,
  listNode: ListNode,
  taskNode: TaskNode,
}

interface TreeVisualizationProps {
  data: TreeData
  workspaceId: Id<"workspaces">
}

export const TreeVisualization = ({ data, workspaceId }: TreeVisualizationProps) => {
  const {
    layout,
    viewMode,
    nodes,
    edges,
    onLayoutChange,
    setViewMode,
  } = useTreeData({ data, workspaceId })

  const [flowNodes, setNodes, onNodesChange] = useNodesState([])
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState([])

  // Update nodes when layout or viewMode changes
  useEffect(() => {
    setNodes(nodes)
    setEdges(edges)
  }, [nodes, edges, setNodes, setEdges])

  const totalTasks = data.workspaces.reduce(
    (acc, ws) => acc + ws.projects.reduce((pacc, p) => pacc + p.totalTasks, 0),
    0,
  )

  return (
    <div className="w-full h-full flex flex-col">
      <TreeControls 
        data={data}
        viewMode={viewMode}
        layout={layout}
        onViewModeChange={setViewMode}
        onLayoutChange={onLayoutChange}
      />

      {/* Full Height React Flow */}
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
            animated: true,
            style: { strokeWidth: 2 },
          }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}