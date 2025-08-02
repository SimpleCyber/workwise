"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { Node, Edge } from "reactflow"
import type { TreeData, ViewMode, Layout } from "./tree-types"
import type { Id } from "../../../../convex/_generated/dataModel"

interface UseTreeDataProps {
  data: TreeData
  workspaceId: Id<"workspaces">
}

export const useTreeData = ({ data, workspaceId }: UseTreeDataProps) => {
  const router = useRouter()
  const [layout, setLayout] = useState<Layout>("horizontal")
  const [viewMode, setViewMode] = useState<ViewMode>("overview")
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

  const onLayoutChange = useCallback(() => {
    setLayout(layout === "vertical" ? "horizontal" : "vertical")
  }, [layout])

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

  return {
    layout,
    viewMode,
    nodes,
    edges,
    onLayoutChange,
    setViewMode,
  }
}
