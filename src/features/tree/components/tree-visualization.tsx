"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  User,
  Building2,
  FolderKanban,
  Users,
  RotateCw,
  Eye,
  ExternalLink,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Id } from "../../../../convex/_generated/dataModel";

interface TreeVisualizationProps {
  data: {
    user: {
      _id: Id<"users">;
      name?: string;
      email?: string;
      image?: string;
    };
    workspaces: Array<{
      _id: Id<"workspaces">;
      name: string;
      projects: Array<{
        _id: Id<"projectBoards">;
        name: string;
        boardCode: string;
        members: Array<{
          _id: Id<"members">;
          role: "admin" | "member" | "lead";
          user: {
            _id: Id<"users">;
            name?: string;
            email?: string;
            image?: string;
          };
          taskCounts: {
            todo: number;
            progress: number;
            hold: number;
            review: number;
            done: number;
            total: number;
          };
        }>;
      }>;
    }>;
  };
  workspaceId: Id<"workspaces">;
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
            <AvatarFallback>
              {data.user.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">
              {data.user.name || "Unknown User"}
            </h3>
            <p className="text-sm text-muted-foreground">{data.user.email}</p>
          </div>
        </div>
        <Handle
          type="source"
          position={data.isHorizontal ? Position.Right : Position.Bottom}
          className="w-3 h-3"
        />
      </CardContent>
    </Card>
  );
};

const WorkspaceNode = ({ data }: NodeProps) => {
  return (
    <Card className="min-w-[200px] shadow-md border-purple-200 cursor-pointer hover:shadow-lg transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3"
            onClick={() => data.onToggle?.(data.workspaceId)}
          >
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => data.onToggle?.(data.workspaceId)}
              className="text-xs"
            >
              {data.isExpanded ? "−" : "+"}
            </Button>
          )}
        </div>
        <Handle
          type="target"
          position={data.isHorizontal ? Position.Left : Position.Top}
          className="w-3 h-3"
        />
        <Handle
          type="source"
          position={data.isHorizontal ? Position.Right : Position.Bottom}
          className="w-3 h-3"
        />
      </CardContent>
    </Card>
  );
};

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
                {data.viewMode === "overview" && data.memberCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {data.memberCount} members
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {data.viewMode === "overview" && data.memberCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => data.onToggleMembers?.(data.projectId)}
                className="text-xs"
              >
                {data.isMembersExpanded ? "−" : "+"}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => data.onProjectClick(data.projectId)}
              className="text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Open
            </Button>
          </div>
        </div>
        <Handle
          type="target"
          position={data.isHorizontal ? Position.Left : Position.Top}
          className="w-3 h-3"
        />
        <Handle
          type="source"
          position={data.isHorizontal ? Position.Right : Position.Bottom}
          className="w-3 h-3"
        />
      </CardContent>
    </Card>
  );
};

const MemberGroupNode = ({ data }: NodeProps) => {
  const TaskCountTooltip = ({ taskCounts }: { taskCounts: any }) => (
    <div className="space-y-1 text-xs">
      <div className="flex justify-between">
        <span>Todo:</span>
        <span className="font-medium">{taskCounts.todo}</span>
      </div>
      <div className="flex justify-between">
        <span>Progress:</span>
        <span className="font-medium">{taskCounts.progress}</span>
      </div>
      <div className="flex justify-between">
        <span>Hold:</span>
        <span className="font-medium">{taskCounts.hold}</span>
      </div>
      <div className="flex justify-between">
        <span>Review:</span>
        <span className="font-medium">{taskCounts.review}</span>
      </div>
      <div className="flex justify-between">
        <span>Done:</span>
        <span className="font-medium">{taskCounts.done}</span>
      </div>
      <hr className="my-1" />
      <div className="flex justify-between font-semibold">
        <span>Total:</span>
        <span>{taskCounts.total}</span>
      </div>
    </div>
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "lead":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <TooltipProvider>
      <Card className="min-w-[300px] max-w-[400px] shadow-md border-orange-200">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-orange-100">
              <Users className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-sm font-medium">
              Members ({data.members.length})
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
            {data.members.map((member: any) => (
              <Tooltip key={member._id}>
                <TooltipTrigger asChild>
                  <Card
                    className="p-2 hover:shadow-sm transition-shadow cursor-pointer border"
                    onClick={() => data.onMemberClick(member._id)}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={member.user.image || "/placeholder.svg"}
                        />
                        <AvatarFallback className="text-xs">
                          {member.user.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.user.name || "Unknown"}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge
                            className={`text-xs ${getRoleBadgeColor(member.role)}`}
                          >
                            {member.role}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {member.taskCounts.total} tasks
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="right" className="w-48">
                  <div className="space-y-2">
                    <p className="font-medium text-sm">
                      {member.user.name || "Unknown"}
                    </p>
                    <TaskCountTooltip taskCounts={member.taskCounts} />
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <Handle
            type="target"
            position={data.isHorizontal ? Position.Left : Position.Top}
            className="w-3 h-3"
          />
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

const nodeTypes = {
  userNode: UserNode,
  workspaceNode: WorkspaceNode,
  projectNode: ProjectNode,
  memberGroupNode: MemberGroupNode,
};

export const TreeVisualization = ({
  data,
  workspaceId,
}: TreeVisualizationProps) => {
  const router = useRouter();
  const [layout, setLayout] = useState<"vertical" | "horizontal">("vertical");
  const [viewMode, setViewMode] = useState<"all" | "overview">("overview");
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set(),
  );
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(),
  );

  const toggleWorkspace = useCallback((workspaceId: string) => {
    setExpandedWorkspaces((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(workspaceId)) {
        newExpanded.delete(workspaceId);
      } else {
        newExpanded.add(workspaceId);
      }
      return newExpanded;
    });
  }, []);

  const toggleProject = useCallback((projectId: string) => {
    setExpandedProjects((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(projectId)) {
        newExpanded.delete(projectId);
      } else {
        newExpanded.add(projectId);
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

  const handleMemberClick = useCallback(
    (memberId: Id<"members">) => {
      router.push(`/members/${workspaceId}?profileMemberId=${memberId}`);
    },
    [router, workspaceId],
  );

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const isHorizontal = layout === "horizontal";
    const showAllMembers = viewMode === "all";

    // Spacing configuration
    const spacing = {
      horizontal: isHorizontal ? 350 : 300,
      vertical: isHorizontal ? 200 : 250,
    };

    // User node (root)
    nodes.push({
      id: "user-root",
      type: "userNode",
      position: { x: 0, y: 0 },
      data: { user: data.user, isHorizontal },
    });

    let projectCounter = 0;

    // Workspace nodes
    data.workspaces.forEach((workspace, workspaceIndex) => {
      const workspaceNodeId = `workspace-${workspace._id}`;
      const isWorkspaceExpanded =
        expandedWorkspaces.has(workspace._id) || showAllMembers;

      nodes.push({
        id: workspaceNodeId,
        type: "workspaceNode",
        position: {
          x: isHorizontal
            ? spacing.horizontal
            : workspaceIndex * spacing.horizontal,
          y: isHorizontal
            ? workspaceIndex * spacing.vertical
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
        },
      });

      edges.push({
        id: `user-${workspaceNodeId}`,
        source: "user-root",
        target: workspaceNodeId,
        type: "smoothstep",
        style: { stroke: "#8b5cf6", strokeWidth: 2 },
      });

      // Project nodes (show if workspace is expanded or in "all" mode)
      if (isWorkspaceExpanded) {
        workspace.projects.forEach((project, projectIndex) => {
          const projectNodeId = `project-${project._id}`;
          const isProjectMembersExpanded =
            expandedProjects.has(project._id) || showAllMembers;

          nodes.push({
            id: projectNodeId,
            type: "projectNode",
            position: {
              x: isHorizontal
                ? spacing.horizontal * 2
                : workspaceIndex * spacing.horizontal + projectIndex * 280,
              y: isHorizontal
                ? workspaceIndex * spacing.vertical + projectIndex * 220
                : spacing.vertical * 2,
            },
            data: {
              name: project.name,
              boardCode: project.boardCode,
              projectId: project._id,
              memberCount: project.members.length,
              onProjectClick: handleProjectClick,
              onToggleMembers: toggleProject,
              isMembersExpanded: isProjectMembersExpanded,
              isHorizontal,
              viewMode,
            },
          });

          edges.push({
            id: `${workspaceNodeId}-${projectNodeId}`,
            source: workspaceNodeId,
            target: projectNodeId,
            type: "smoothstep",
            style: { stroke: "#10b981", strokeWidth: 2 },
          });

          // Member group nodes (show if project members are expanded or in "all" mode)
          if (isProjectMembersExpanded && project.members.length > 0) {
            const memberGroupNodeId = `members-${project._id}`;

            nodes.push({
              id: memberGroupNodeId,
              type: "memberGroupNode",
              position: {
                x: isHorizontal
                  ? spacing.horizontal * 3
                  : workspaceIndex * spacing.horizontal + projectIndex * 280,
                y: isHorizontal
                  ? workspaceIndex * spacing.vertical + projectIndex * 220
                  : spacing.vertical * 3,
              },
              data: {
                members: project.members,
                onMemberClick: handleMemberClick,
                isHorizontal,
              },
            });

            edges.push({
              id: `${projectNodeId}-${memberGroupNodeId}`,
              source: projectNodeId,
              target: memberGroupNodeId,
              type: "smoothstep",
              style: { stroke: "#f97316", strokeWidth: 2 },
            });
          }

          projectCounter++;
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
    handleProjectClick,
    handleMemberClick,
    toggleWorkspace,
    toggleProject,
  ]);

  const [flowNodes, setNodes, onNodesChange] = useNodesState([]);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update nodes when layout or viewMode changes
  useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  const onLayout = useCallback(() => {
    setLayout(layout === "vertical" ? "horizontal" : "vertical");
  }, [layout]);

  return (
    <div className="w-full h-[800px] border rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Organization Tree</h2>
          <Badge variant="outline">
            {data.workspaces.reduce((acc, ws) => acc + ws.projects.length, 0)}{" "}
            projects total
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={viewMode}
            onValueChange={(value: any) => setViewMode(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Overview
                </div>
              </SelectItem>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Full Details
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={onLayout}>
            <RotateCw className="w-4 h-4 mr-2" />
            {layout === "vertical" ? "Horizontal" : "Vertical"}
          </Button>
        </div>
      </div>

      {/* React Flow */}
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
  );
};
