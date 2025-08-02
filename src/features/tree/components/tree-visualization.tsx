"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import ReactFlow, {
  type Node,
  type Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type NodeProps,
} from "reactflow"
import "reactflow/dist/style.css"
import {
  User,
  Building2,
  FolderKanban,
  Users,
  RotateCw,
  Eye,
  ExternalLink,
  List,
  CheckSquare,
  Clock,
  AlertCircle,
  MessageSquare,
  Calendar,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Id } from "../../../../convex/_generated/dataModel"

interface TreeVisualizationProps {
  data: {
    user: {
      _id: Id<"users">
      name?: string
      email?: string
      image?: string
    }
    workspaces: Array<{
      _id: Id<"workspaces">
      name: string
      projects: Array<{
        _id: Id<"projectBoards">
        name: string
        boardCode: string
        totalTasks: number
        lists: Array<{
          _id: Id<"projectLists">
          name: string
          position: number
          taskCount: number
          tasks: Array<{
            _id: Id<"projectTasks">
            title: string
            taskCode: string
            description?: string
            priority: "low" | "medium" | "high" | "urgent"
            dueDate?: number
            isCompleted?: boolean
            createdAt: number
            updatedAt: number
            assignedAt: number
            commentsCount: number
            assignedTo?: {
              _id: Id<"members">
              role: "admin" | "member" | "lead"
              user: {
                _id: Id<"users">
                name?: string
                email?: string
                image?: string
              }
            } | null
            assignedBy?: {
              _id: Id<"members">
              role: "admin" | "member" | "lead"
              user: {
                _id: Id<"users">
                name?: string
                email?: string
                image?: string
              }
            } | null
            createdBy?: {
              _id: Id<"members">
              role: "admin" | "member" | "lead"
              user: {
                _id: Id<"users">
                name?: string
                email?: string
                image?: string
              }
            } | null
          }>
        }>
        members: Array<{
          _id: Id<"members">
          role: "admin" | "member" | "lead"
          user: {
            _id: Id<"users">
            name?: string
            email?: string
            image?: string
          }
          taskCounts: {
            todo: number
            progress: number
            hold: number
            review: number
            done: number
            total: number
          }
        }>
      }>
    }>
  }
  workspaceId: Id<"workspaces">
}

// Custom Node Components
const UserNode = ({ data }: NodeProps) => {
  return (
    <Card className="min-w-[250px] shadow-lg border-2 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <Avatar className="w-12 h-12">
            <AvatarImage src={data.user.image || "/placeholder.svg"} />
            <AvatarFallback>{data.user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{data.user.name || "Unknown User"}</h3>
            <p className="text-sm text-muted-foreground">{data.user.email}</p>
          </div>
        </div>
        <Handle type="source" position={data.isHorizontal ? Position.Right : Position.Bottom} className="w-3 h-3" />
      </CardContent>
    </Card>
  )
}

const WorkspaceNode = ({ data }: NodeProps) => {
  return (
    <Card className="min-w-[200px] shadow-md border-purple-200 cursor-pointer hover:shadow-lg transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3" onClick={() => data.onToggle?.(data.workspaceId)}>
            <div className="flex items-center justify-center w-8 h-8 rounded bg-purple-100">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium">{data.name}</h4>
              <Badge variant="outline" className="text-xs mt-1">
                {data.projectCount} projects
              </Badge>
            </div>
          </div>
          {data.viewMode === "overview" && (
            <Button variant="ghost" size="sm" onClick={() => data.onToggle?.(data.workspaceId)} className="text-xs">
              {data.isExpanded ? "−" : "+"}
            </Button>
          )}
        </div>
        <Handle type="target" position={data.isHorizontal ? Position.Left : Position.Top} className="w-3 h-3" />
        <Handle type="source" position={data.isHorizontal ? Position.Right : Position.Bottom} className="w-3 h-3" />
      </CardContent>
    </Card>
  )
}

const ProjectNode = ({ data }: NodeProps) => {
  return (
    <Card className="min-w-[220px] shadow-md border-green-200 cursor-pointer hover:shadow-lg transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-green-100">
              <FolderKanban className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium">{data.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs font-mono">
                  {data.boardCode}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {data.totalTasks} tasks
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {data.viewMode === "overview" && data.listCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => data.onToggleLists?.(data.projectId)}
                className="text-xs"
              >
                {data.isListsExpanded ? "−" : "+"}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => data.onProjectClick(data.projectId)} className="text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />
              Open
            </Button>
          </div>
        </div>
        <Handle type="target" position={data.isHorizontal ? Position.Left : Position.Top} className="w-3 h-3" />
        <Handle type="source" position={data.isHorizontal ? Position.Right : Position.Bottom} className="w-3 h-3" />
      </CardContent>
    </Card>
  )
}

const ListNode = ({ data }: NodeProps) => {
  const getListIcon = (listName: string) => {
    const name = listName.toLowerCase()
    if (name.includes("todo") || name.includes("to do")) {
      return <List className="w-4 h-4 text-blue-600" />
    } else if (name.includes("progress") || name.includes("doing")) {
      return <Clock className="w-4 h-4 text-yellow-600" />
    } else if (name.includes("hold") || name.includes("blocked")) {
      return <AlertCircle className="w-4 h-4 text-red-600" />
    } else if (name.includes("review") || name.includes("testing")) {
      return <Eye className="w-4 h-4 text-purple-600" />
    } else if (name.includes("done") || name.includes("completed")) {
      return <CheckSquare className="w-4 h-4 text-green-600" />
    }
    return <List className="w-4 h-4 text-gray-600" />
  }

  const getListColor = (listName: string) => {
    const name = listName.toLowerCase()
    if (name.includes("todo") || name.includes("to do")) {
      return "border-blue-200 bg-blue-50"
    } else if (name.includes("progress") || name.includes("doing")) {
      return "border-yellow-200 bg-yellow-50"
    } else if (name.includes("hold") || name.includes("blocked")) {
      return "border-red-200 bg-red-50"
    } else if (name.includes("review") || name.includes("testing")) {
      return "border-purple-200 bg-purple-50"
    } else if (name.includes("done") || name.includes("completed")) {
      return "border-green-200 bg-green-50"
    }
    return "border-gray-200 bg-gray-50"
  }

  return (
    <Card
      className={`min-w-[180px] shadow-md cursor-pointer hover:shadow-lg transition-shadow ${getListColor(data.name)}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded">{getListIcon(data.name)}</div>
            <div>
              <h5 className="font-medium text-sm">{data.name}</h5>
              <Badge variant="outline" className="text-xs mt-1">
                {data.taskCount} tasks
              </Badge>
            </div>
          </div>
          {data.viewMode === "overview" && data.taskCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => data.onToggleTasks?.(data.listId)} className="text-xs">
              {data.isTasksExpanded ? "−" : "+"}
            </Button>
          )}
        </div>
        <Handle type="target" position={data.isHorizontal ? Position.Left : Position.Top} className="w-3 h-3" />
        <Handle type="source" position={data.isHorizontal ? Position.Right : Position.Bottom} className="w-3 h-3" />
      </CardContent>
    </Card>
  )
}

const TaskNode = ({ data }: NodeProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  const TaskTooltip = ({ task }: { task: any }) => (
    <div className="space-y-3 text-xs max-w-sm">
      <div>
        <h4 className="font-semibold text-sm mb-1">{task.title}</h4>
        <p className="text-muted-foreground font-mono">{task.taskCode}</p>
      </div>

      {task.description && (
        <div>
          <p className="font-medium mb-1">Description:</p>
          <p className="text-muted-foreground">{task.description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="font-medium">Priority:</p>
          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
        </div>
        <div>
          <p className="font-medium">Status:</p>
          <Badge variant={task.isCompleted ? "default" : "secondary"} className="text-xs">
            {task.isCompleted ? "Completed" : "In Progress"}
          </Badge>
        </div>
      </div>

      {task.assignedTo && (
        <div>
          <p className="font-medium mb-1">Assigned to:</p>
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={task.assignedTo.user.image || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">
                {task.assignedTo.user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <span>{task.assignedTo.user.name || "Unknown"}</span>
          </div>
        </div>
      )}

      {task.assignedBy && (
        <div>
          <p className="font-medium mb-1">Assigned by:</p>
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={task.assignedBy.user.image || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">
                {task.assignedBy.user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <span>{task.assignedBy.user.name || "Unknown"}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="font-medium">Created:</p>
          <p className="text-muted-foreground">{formatDate(task.createdAt)}</p>
        </div>
        <div>
          <p className="font-medium">Assigned:</p>
          <p className="text-muted-foreground">{formatDate(task.assignedAt)}</p>
        </div>
      </div>

      {task.dueDate && (
        <div>
          <p className="font-medium">Due Date:</p>
          <p className="text-muted-foreground">{formatDate(task.dueDate)}</p>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          <span>{task.commentsCount} comments</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Updated {formatDate(task.updatedAt)}</span>
        </div>
      </div>
    </div>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="min-w-[200px] max-w-[250px] shadow-sm border cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-2">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h6 className="font-medium text-sm truncate flex-1 mr-2">{data.task.title}</h6>
                  <Badge className={`text-xs ${getPriorityColor(data.task.priority)}`}>{data.task.priority}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-mono">
                    {data.task.taskCode}
                  </Badge>
                  {data.task.assignedTo && (
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={data.task.assignedTo.user.image || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {data.task.assignedTo.user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {data.task.commentsCount > 0 && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{data.task.commentsCount}</span>
                    </div>
                  )}
                  {data.task.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(data.task.dueDate)}</span>
                    </div>
                  )}
                </div>
              </div>
              <Handle type="target" position={data.isHorizontal ? Position.Left : Position.Top} className="w-3 h-3" />
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="right" className="w-96">
          <TaskTooltip task={data.task} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const nodeTypes = {
  userNode: UserNode,
  workspaceNode: WorkspaceNode,
  projectNode: ProjectNode,
  listNode: ListNode,
  taskNode: TaskNode,
}

export const TreeVisualization = ({ data, workspaceId }: TreeVisualizationProps) => {
  const router = useRouter()
  const [layout, setLayout] = useState<"vertical" | "horizontal">("horizontal")
  const [viewMode, setViewMode] = useState<"all" | "overview">("overview")
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set())
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set())

  const toggleWorkspace = useCallback((workspaceId: string) => {
    setExpandedWorkspaces((prev) => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(workspaceId)) {
        newExpanded.delete(workspaceId)
      } else {
        newExpanded.add(workspaceId)
      }
      return newExpanded
    })
  }, [])

  const toggleProject = useCallback((projectId: string) => {
    setExpandedProjects((prev) => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(projectId)) {
        newExpanded.delete(projectId)
      } else {
        newExpanded.add(projectId)
      }
      return newExpanded
    })
  }, [])

  const toggleList = useCallback((listId: string) => {
    setExpandedLists((prev) => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(listId)) {
        newExpanded.delete(listId)
      } else {
        newExpanded.add(listId)
      }
      return newExpanded
    })
  }, [])

  const handleProjectClick = useCallback(
    (projectId: Id<"projectBoards">) => {
      router.push(`/projects/${workspaceId}/board/${projectId}`)
    },
    [router, workspaceId],
  )

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []
    const isHorizontal = layout === "horizontal"
    const showAll = viewMode === "all"

    // Spacing configuration
    const spacing = {
      horizontal: isHorizontal ? 400 : 350,
      vertical: isHorizontal ? 250 : 300,
    }

    // Dynamic user-root position
    const workspaceCount = data.workspaces.length
    const centerX = isHorizontal ? -100 : (workspaceCount - 1) * spacing.horizontal * 0.5
    const centerY = isHorizontal ? (workspaceCount - 1) * spacing.vertical * 0.5 : 0

    nodes.push({
      id: "user-root",
      type: "userNode",
      position: { x: centerX, y: centerY },
      data: { user: data.user, isHorizontal },
    })

    // Workspace nodes
    data.workspaces.forEach((workspace, workspaceIndex) => {
      const workspaceNodeId = `workspace-${workspace._id}`
      const isWorkspaceExpanded = expandedWorkspaces.has(workspace._id) || showAll

      nodes.push({
        id: workspaceNodeId,
        type: "workspaceNode",
        position: {
          x: isHorizontal ? spacing.horizontal : workspaceIndex * spacing.horizontal,
          y: isHorizontal ? workspaceIndex * spacing.vertical : spacing.vertical,
        },
        data: {
          name: workspace.name,
          projectCount: workspace.projects.length,
          isHorizontal,
          workspaceId: workspace._id,
          onToggle: toggleWorkspace,
          isExpanded: isWorkspaceExpanded,
          viewMode,
        },
      })

      edges.push({
        id: `user-${workspaceNodeId}`,
        source: "user-root",
        target: workspaceNodeId,
        type: "smoothstep",
        style: { stroke: "#8b5cf6", strokeWidth: 2 },
      })

      // Project nodes
      if (isWorkspaceExpanded) {
        workspace.projects.forEach((project, projectIndex) => {
          const projectNodeId = `project-${project._id}`
          const isProjectExpanded = expandedProjects.has(project._id) || showAll

          nodes.push({
            id: projectNodeId,
            type: "projectNode",
            position: {
              x: isHorizontal ? spacing.horizontal * 2 : workspaceIndex * spacing.horizontal + projectIndex * 300,
              y: isHorizontal ? workspaceIndex * spacing.vertical + projectIndex * 250 : spacing.vertical * 2,
            },
            data: {
              name: project.name,
              boardCode: project.boardCode,
              projectId: project._id,
              listCount: project.lists.length,
              totalTasks: project.totalTasks,
              onProjectClick: handleProjectClick,
              onToggleLists: toggleProject,
              isListsExpanded: isProjectExpanded,
              isHorizontal,
              viewMode,
            },
          })

          edges.push({
            id: `${workspaceNodeId}-${projectNodeId}`,
            source: workspaceNodeId,
            target: projectNodeId,
            type: "smoothstep",
            style: { stroke: "#10b981", strokeWidth: 2 },
          })

          // List nodes
          if (isProjectExpanded) {
            project.lists.forEach((list, listIndex) => {
              const listNodeId = `list-${list._id}`
              const isListExpanded = expandedLists.has(list._id) || showAll

              nodes.push({
                id: listNodeId,
                type: "listNode",
                position: {
                  x: isHorizontal
                    ? spacing.horizontal * 3
                    : workspaceIndex * spacing.horizontal + projectIndex * 300 + listIndex * 200,
                  y: isHorizontal
                    ? workspaceIndex * spacing.vertical + projectIndex * 250 + listIndex * 200
                    : spacing.vertical * 3,
                },
                data: {
                  name: list.name,
                  listId: list._id,
                  taskCount: list.taskCount,
                  onToggleTasks: toggleList,
                  isTasksExpanded: isListExpanded,
                  isHorizontal,
                  viewMode,
                },
              })

              edges.push({
                id: `${projectNodeId}-${listNodeId}`,
                source: projectNodeId,
                target: listNodeId,
                type: "smoothstep",
                style: { stroke: "#f59e0b", strokeWidth: 2 },
              })

              // Task nodes
              if (isListExpanded && list.tasks.length > 0) {
                list.tasks.forEach((task, taskIndex) => {
                  const taskNodeId = `task-${task._id}`

                  nodes.push({
                    id: taskNodeId,
                    type: "taskNode",
                    position: {
                      x: isHorizontal
                        ? spacing.horizontal * 4
                        : workspaceIndex * spacing.horizontal + projectIndex * 300 + listIndex * 200 + taskIndex * 220,
                      y: isHorizontal
                        ? workspaceIndex * spacing.vertical + projectIndex * 250 + listIndex * 200 + taskIndex * 120
                        : spacing.vertical * 4,
                    },
                    data: {
                      task,
                      isHorizontal,
                    },
                  })

                  edges.push({
                    id: `${listNodeId}-${taskNodeId}`,
                    source: listNodeId,
                    target: taskNodeId,
                    type: "smoothstep",
                    style: { stroke: "#ef4444", strokeWidth: 1 },
                  })
                })
              }
            })
          }
        })
      }
    })

    return { nodes, edges }
  }, [
    data,
    layout,
    viewMode,
    expandedWorkspaces,
    expandedProjects,
    expandedLists,
    handleProjectClick,
    toggleWorkspace,
    toggleProject,
    toggleList,
  ])

  const [flowNodes, setNodes, onNodesChange] = useNodesState([])
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState([])

  // Update nodes when layout or viewMode changes
  useEffect(() => {
    setNodes(nodes)
    setEdges(edges)
  }, [nodes, edges, setNodes, setEdges])

  const onLayout = useCallback(() => {
    setLayout(layout === "vertical" ? "horizontal" : "vertical")
  }, [layout])

  const totalTasks = data.workspaces.reduce(
    (acc, ws) => acc + ws.projects.reduce((pacc, p) => pacc + p.totalTasks, 0),
    0,
  )

  return (
    <div className="w-full h-full flex flex-col">
      {/* Compact Controls Bar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="font-medium">Organization Tree</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {data.workspaces.reduce((acc, ws) => acc + ws.projects.length, 0)} projects
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {totalTasks} tasks
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
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
          <Button variant="outline" size="sm" onClick={onLayout} className="h-8 bg-transparent">
            <RotateCw className="w-3 h-3 mr-1" />
            {layout === "vertical" ? "Horizontal" : "Vertical"}
          </Button>
        </div>
      </div>

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
