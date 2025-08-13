"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Node, Edge } from "reactflow";
import type { TreeData, ViewMode, Layout } from "./tree-types";
import type { Id } from "../../../../convex/_generated/dataModel";

interface UseTreeDataProps {
  data: TreeData;
  workspaceId: Id<"workspaces">;
}

export const useTreeData = ({ data, workspaceId }: UseTreeDataProps) => {
  const router = useRouter();
  const [layout, setLayout] = useState<Layout>("horizontal");
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set(),
  );
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(),
  );
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());

  // Track the last expanded item at each level to hide siblings
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [activeList, setActiveList] = useState<string | null>(null);

  const toggleWorkspace = useCallback(
    (workspaceId: string) => {
      setExpandedWorkspaces((prev) => {
        const newExpanded = new Set(prev);
        const isCurrentlyExpanded = newExpanded.has(workspaceId);

        if (isCurrentlyExpanded) {
          // If closing, remove from expanded and clear active
          newExpanded.delete(workspaceId);
          setActiveWorkspace(null);
        } else {
          // If expanding, add to expanded and set as active
          newExpanded.add(workspaceId);
          setActiveWorkspace(workspaceId);
        }

        return newExpanded;
      });

      // When changing workspace, reset project and list selections
      if (activeWorkspace !== workspaceId) {
        setExpandedProjects(new Set());
        setExpandedLists(new Set());
        setActiveProject(null);
        setActiveList(null);
      }
    },
    [activeWorkspace],
  );

  const toggleProject = useCallback(
    (projectId: string) => {
      setExpandedProjects((prev) => {
        const newExpanded = new Set(prev);
        const isCurrentlyExpanded = newExpanded.has(projectId);

        if (isCurrentlyExpanded) {
          // If closing, remove from expanded and clear active
          newExpanded.delete(projectId);
          setActiveProject(null);
        } else {
          // If expanding, add to expanded and set as active
          newExpanded.add(projectId);
          setActiveProject(projectId);
        }

        return newExpanded;
      });

      // When changing project, reset list selections
      if (activeProject !== projectId) {
        setExpandedLists(new Set());
        setActiveList(null);
      }
    },
    [activeProject],
  );

  const toggleList = useCallback((listId: string) => {
    setExpandedLists((prev) => {
      const newExpanded = new Set(prev);
      const isCurrentlyExpanded = newExpanded.has(listId);

      if (isCurrentlyExpanded) {
        // If closing, remove from expanded and clear active
        newExpanded.delete(listId);
        setActiveList(null);
      } else {
        // If expanding, add to expanded and set as active
        newExpanded.add(listId);
        setActiveList(listId);
      }

      return newExpanded;
    });
  }, []);

  const handleProjectClick = useCallback(
    (projectId: Id<"projectBoards">) => {
      router.push(`/projects/${workspaceId}/board/${projectId}`);
    },
    [router, workspaceId],
  );

  const onLayoutChange = useCallback(() => {
    setLayout(layout === "vertical" ? "horizontal" : "vertical");
  }, [layout]);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const isHorizontal = layout === "horizontal";
    const showAll = viewMode === "all";

    // Spacing configuration
    const spacing = {
      horizontal: isHorizontal ? 400 : 350,
      vertical: isHorizontal ? 250 : 300,
    };

    // Dynamic user-root position
    const workspaceCount = data.workspaces.length;
    const centerX = isHorizontal
      ? -100
      : (workspaceCount - 1) * spacing.horizontal * 0.5;
    const centerY = isHorizontal
      ? (workspaceCount - 1) * spacing.vertical * 0.5
      : 0;

    nodes.push({
      id: "user-root",
      type: "userNode",
      position: { x: centerX, y: centerY },
      data: { user: data.user, isHorizontal },
    });

    // Workspace nodes - centered arrangement
    data.workspaces.forEach((workspace, workspaceIndex) => {
      const workspaceNodeId = `workspace-${workspace._id}`;
      const isWorkspaceExpanded =
        expandedWorkspaces.has(workspace._id) || showAll;

      // Skip siblings of active workspace unless in "all" mode
      if (activeWorkspace && activeWorkspace !== workspace._id && !showAll) {
        return;
      }

      // Calculate centered position for workspaces
      const totalWorkspaces = showAll
        ? data.workspaces.length
        : activeWorkspace
          ? 1
          : data.workspaces.length;
      const centerIndex = (totalWorkspaces - 1) / 2;
      const offsetFromCenter = workspaceIndex - centerIndex;

      nodes.push({
        id: workspaceNodeId,
        type: "workspaceNode",
        position: {
          x: isHorizontal
            ? spacing.horizontal
            : centerX + offsetFromCenter * (spacing.horizontal * 0.8),
          y: isHorizontal
            ? centerY + offsetFromCenter * (spacing.vertical * 0.8)
            : spacing.vertical,
        },
        data: {
          name: workspace.name,
          projectCount: workspace.projects.length,
          isHorizontal,
          workspaceId: workspace._id,
          onToggle: toggleWorkspace,
          isExpanded: isWorkspaceExpanded,
          viewMode,
          isActive: workspace._id === activeWorkspace,
        },
      });

      edges.push({
        id: `user-${workspaceNodeId}`,
        source: "user-root",
        target: workspaceNodeId,
        type: "default",
        style: { stroke: "#8b5cf6", strokeWidth: 2 },
        animated: true,
      });

      // Project nodes - centered arrangement
      if (isWorkspaceExpanded) {
        const visibleProjects = showAll
          ? workspace.projects
          : activeProject
            ? workspace.projects.filter((p) => p._id === activeProject)
            : workspace.projects;

        visibleProjects.forEach((project, projectIndex) => {
          const projectNodeId = `project-${project._id}`;
          const isProjectExpanded =
            expandedProjects.has(project._id) || showAll;

          // Skip siblings of active project unless in "all" mode
          if (activeProject && activeProject !== project._id && !showAll) {
            return;
          }

          // Calculate centered position for projects
          const totalProjects = visibleProjects.length;
          const centerIndex = (totalProjects - 1) / 2;
          const offsetFromCenter = projectIndex - centerIndex;

          nodes.push({
            id: projectNodeId,
            type: "projectNode",
            position: {
              x: isHorizontal
                ? spacing.horizontal * 2
                : nodes.find((n) => n.id === workspaceNodeId)?.position.x! +
                  offsetFromCenter * 280,
              y: isHorizontal
                ? nodes.find((n) => n.id === workspaceNodeId)?.position.y! +
                  offsetFromCenter * 200
                : spacing.vertical * 2,
            },
            data: {
              name: project.name,
              boardCode: project.boardCode,
              projectId: project._id,
              workspaceId: workspace._id,
              listCount: project.lists.length,
              totalTasks: project.totalTasks,
              onProjectClick: handleProjectClick,
              onToggleLists: toggleProject,
              isListsExpanded: isProjectExpanded,
              isHorizontal,
              viewMode,
              isActive: project._id === activeProject,
            },
          });

          edges.push({
            id: `${workspaceNodeId}-${projectNodeId}`,
            source: workspaceNodeId,
            target: projectNodeId,
            type: "default",
            style: { stroke: "#10b981", strokeWidth: 2 },
            animated: true,
          });

          // List nodes - centered arrangement
          if (isProjectExpanded) {
            const visibleLists = showAll
              ? project.lists
              : activeList
                ? project.lists.filter((l) => l._id === activeList)
                : project.lists;

            visibleLists.forEach((list, listIndex) => {
              const listNodeId = `list-${list._id}`;
              const isListExpanded = expandedLists.has(list._id) || showAll;

              // Skip siblings of active list unless in "all" mode
              if (activeList && activeList !== list._id && !showAll) {
                return;
              }

              // Calculate centered position for lists
              const totalLists = visibleLists.length;
              const centerIndex = (totalLists - 1) / 2;
              const offsetFromCenter = listIndex - centerIndex;

              nodes.push({
                id: listNodeId,
                type: "listNode",
                position: {
                  x: isHorizontal
                    ? spacing.horizontal * 3
                    : nodes.find((n) => n.id === projectNodeId)?.position.x! +
                      offsetFromCenter * 180,
                  y: isHorizontal
                    ? nodes.find((n) => n.id === projectNodeId)?.position.y! +
                      offsetFromCenter * 180
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
                  workspaceId: workspace._id,
                  isActive: list._id === activeList,
                },
              });

              edges.push({
                id: `${projectNodeId}-${listNodeId}`,
                source: projectNodeId,
                target: listNodeId,
                type: "default",
                style: { stroke: "#f59e0b", strokeWidth: 2 },
                animated: true,
              });

              // Task nodes - centered arrangement
              if (isListExpanded && list.tasks.length > 0) {
                list.tasks.forEach((task, taskIndex) => {
                  const taskNodeId = `task-${task._id}`;

                  // Calculate centered position for tasks
                  const totalTasks = list.tasks.length;
                  const centerIndex = (totalTasks - 1) / 2;
                  const offsetFromCenter = taskIndex - centerIndex;

                  nodes.push({
                    id: taskNodeId,
                    type: "taskNode",
                    position: {
                      x: isHorizontal
                        ? spacing.horizontal * 4
                        : nodes.find((n) => n.id === listNodeId)?.position.x! +
                          offsetFromCenter * 200,
                      y: isHorizontal
                        ? nodes.find((n) => n.id === listNodeId)?.position.y! +
                          offsetFromCenter * 110
                        : spacing.vertical * 4,
                    },
                    data: {
                      task,
                      isHorizontal,
                    },
                  });

                  edges.push({
                    id: `${listNodeId}-${taskNodeId}`,
                    source: listNodeId,
                    target: taskNodeId,
                    type: "default",
                    style: { stroke: "#ef4444", strokeWidth: 1 },
                    animated: true,
                  });
                });
              }
            });
          }
        });
      }
    });

    return { nodes, edges };
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
    activeWorkspace,
    activeProject,
    activeList,
  ]);

  return {
    layout,
    viewMode,
    nodes,
    edges,
    onLayoutChange,
    setViewMode,
  };
};
