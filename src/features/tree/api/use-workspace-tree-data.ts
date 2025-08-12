"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Node, Edge } from "reactflow";
import type { TreeData, ViewMode, Layout } from "./tree-types";
import type { Id } from "../../../../convex/_generated/dataModel";

interface UseWorkspaceTreeDataProps {
  data: TreeData;
  workspaceId: Id<"workspaces">;
}

export const useWorkspaceTreeData = ({
  data,
  workspaceId,
}: UseWorkspaceTreeDataProps) => {
  const router = useRouter();
  const [layout, setLayout] = useState<Layout>("horizontal");
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(),
  );
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());

  // Track active items for focused view
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [activeList, setActiveList] = useState<string | null>(null);

  const toggleProject = useCallback(
    (projectId: string) => {
      setExpandedProjects((prev) => {
        const newExpanded = new Set(prev);
        const isCurrentlyExpanded = newExpanded.has(projectId);

        if (isCurrentlyExpanded) {
          newExpanded.delete(projectId);
          setActiveProject(null);
        } else {
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
        newExpanded.delete(listId);
        setActiveList(null);
      } else {
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

    // Find the current workspace
    const currentWorkspace = data.workspaces.find(
      (ws) => ws._id === workspaceId,
    );
    if (!currentWorkspace) return { nodes, edges };

    // Spacing configuration
    const spacing = {
      horizontal: isHorizontal ? 400 : 350,
      vertical: isHorizontal ? 250 : 300,
    };

    const workspaceNodeId = `workspace-${currentWorkspace._id}`;
    nodes.push({
      id: workspaceNodeId,
      type: "workspaceNode",
      position: { x: 0, y: 0 }, // Root position
      data: {
        name: currentWorkspace.name,
        projectCount: currentWorkspace.projects.length,
        isHorizontal,
        workspaceId: currentWorkspace._id,
        onToggle: () => {}, // No toggle needed for root
        isExpanded: true, // Always expanded as root
        viewMode,
        isActive: true,
      },
    });

    // Project nodes - centered arrangement
    currentWorkspace.projects.forEach((project, projectIndex) => {
      const projectNodeId = `project-${project._id}`;
      const isProjectExpanded = expandedProjects.has(project._id) || showAll;

      // Skip siblings of active project unless in "all" mode
      if (activeProject && activeProject !== project._id && !showAll) {
        return;
      }

      // Calculate centered position for projects
      const visibleProjects = showAll
        ? currentWorkspace.projects
        : activeProject
          ? currentWorkspace.projects.filter((p) => p._id === activeProject)
          : currentWorkspace.projects;

      const totalProjects = visibleProjects.length;
      const centerIndex = (totalProjects - 1) / 2;
      const offsetFromCenter = projectIndex - centerIndex;

      nodes.push({
        id: projectNodeId,
        type: "projectNode",
        position: {
          x: isHorizontal ? spacing.horizontal : offsetFromCenter * 280,
          y: isHorizontal ? offsetFromCenter * 200 : spacing.vertical,
        },
        data: {
          name: project.name,
          boardCode: project.boardCode,
          projectId: project._id,
          workspaceId: workspaceId,
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
                ? spacing.horizontal * 2
                : nodes.find((n) => n.id === projectNodeId)?.position.x! +
                  offsetFromCenter * 180,
              y: isHorizontal
                ? nodes.find((n) => n.id === projectNodeId)?.position.y! +
                  offsetFromCenter * 180
                : spacing.vertical * 2,
            },
            data: {
              name: list.name,
              listId: list._id,
              taskCount: list.taskCount,
              onToggleTasks: toggleList,
              isTasksExpanded: isListExpanded,
              isHorizontal,
              viewMode,
              workspaceId: currentWorkspace._id,
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
                    ? spacing.horizontal * 3
                    : nodes.find((n) => n.id === listNodeId)?.position.x! +
                      offsetFromCenter * 200,
                  y: isHorizontal
                    ? nodes.find((n) => n.id === listNodeId)?.position.y! +
                      offsetFromCenter * 110
                    : spacing.vertical * 3,
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

    return { nodes, edges };
  }, [
    data,
    workspaceId,
    layout,
    viewMode,
    expandedProjects,
    expandedLists,
    handleProjectClick,
    toggleProject,
    toggleList,
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
