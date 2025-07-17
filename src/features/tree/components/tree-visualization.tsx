"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  User,
  Building2,
  FolderKanban,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

export const TreeVisualization = ({
  data,
  workspaceId,
}: TreeVisualizationProps) => {
  const router = useRouter();
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set(),
  );
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(),
  );

  const toggleWorkspace = (workspaceId: string) => {
    const newExpanded = new Set(expandedWorkspaces);
    if (newExpanded.has(workspaceId)) {
      newExpanded.delete(workspaceId);
    } else {
      newExpanded.add(workspaceId);
    }
    setExpandedWorkspaces(newExpanded);
  };

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleProjectClick = (projectId: Id<"projectBoards">) => {
    router.push(`/projects/${workspaceId}/board/${projectId}`);
  };

  const handleMemberClick = (memberId: Id<"members">) => {
    router.push(`/members/${workspaceId}?profileMemberId=${memberId}`);
  };

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

  return (
    <TooltipProvider>
      <div className="max-w-6xl mx-auto">
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            {/* User Root */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <Avatar className="w-10 h-10">
                <AvatarImage src={data.user.image || "/placeholder.svg"} />
                <AvatarFallback>
                  {data.user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-lg">
                  {data.user.name || "Unknown User"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {data.user.email}
                </p>
              </div>
            </div>

            {/* Workspaces */}
            <div className="space-y-4">
              {data.workspaces.map((workspace, workspaceIndex) => (
                <div key={workspace._id} className="relative">
                  {/* Vertical line from user to workspaces */}
                  {workspaceIndex === 0 && (
                    <div className="absolute left-4 -top-6 w-px h-6 bg-border" />
                  )}

                  {/* Horizontal line to workspace */}
                  <div className="absolute left-4 top-5 w-6 h-px bg-border" />

                  {/* Vertical line between workspaces */}
                  {workspaceIndex < data.workspaces.length - 1 && (
                    <div className="absolute left-4 top-5 w-px h-full bg-border" />
                  )}

                  <div className="ml-10">
                    <Button
                      variant="ghost"
                      className="h-auto p-2 justify-start hover:bg-muted/50"
                      onClick={() => toggleWorkspace(workspace._id)}
                    >
                      {expandedWorkspaces.has(workspace._id) ? (
                        <ChevronDown className="w-4 h-4 mr-2" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mr-2" />
                      )}
                      <div className="flex items-center justify-center w-6 h-6 rounded bg-purple-100 mr-3">
                        <Building2 className="w-3 h-3 text-purple-600" />
                      </div>
                      <span className="font-medium">{workspace.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {workspace.projects.length} projects
                      </Badge>
                    </Button>

                    {/* Projects */}
                    {expandedWorkspaces.has(workspace._id) && (
                      <div className="ml-6 mt-2 space-y-3">
                        {workspace.projects.map((project, projectIndex) => (
                          <div key={project._id} className="relative">
                            {/* Vertical line from workspace to projects */}
                            {projectIndex === 0 && (
                              <div className="absolute left-4 -top-2 w-px h-2 bg-border" />
                            )}

                            {/* Horizontal line to project */}
                            <div className="absolute left-4 top-4 w-6 h-px bg-border" />

                            {/* Vertical line between projects */}
                            {projectIndex < workspace.projects.length - 1 && (
                              <div className="absolute left-4 top-4 w-px h-full bg-border" />
                            )}

                            <div className="ml-10">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  className="h-auto p-2 justify-start hover:bg-muted/50"
                                  onClick={() => toggleProject(project._id)}
                                >
                                  {expandedProjects.has(project._id) ? (
                                    <ChevronDown className="w-4 h-4 mr-2" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 mr-2" />
                                  )}
                                  <div className="flex items-center justify-center w-6 h-6 rounded bg-green-100 mr-3">
                                    <FolderKanban className="w-3 h-3 text-green-600" />
                                  </div>
                                  <span className="font-medium">
                                    {project.name}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-xs font-mono"
                                  >
                                    {project.boardCode}
                                  </Badge>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleProjectClick(project._id)
                                  }
                                  className="text-xs"
                                >
                                  Open Project
                                </Button>
                              </div>

                              {/* Members */}
                              {expandedProjects.has(project._id) && (
                                <div className="ml-6 mt-3">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="flex items-center justify-center w-5 h-5 rounded bg-orange-100">
                                      <Users className="w-3 h-3 text-orange-600" />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">
                                      Members ({project.members.length})
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-6">
                                    {project.members.map((member) => (
                                      <Tooltip key={member._id}>
                                        <TooltipTrigger asChild>
                                          <Card
                                            className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() =>
                                              handleMemberClick(member._id)
                                            }
                                          >
                                            <div className="flex items-center gap-3">
                                              <Avatar className="w-8 h-8">
                                                <AvatarImage
                                                  src={
                                                    member.user.image ||
                                                    "/placeholder.svg"
                                                  }
                                                />
                                                <AvatarFallback className="text-xs">
                                                  {member.user.name
                                                    ?.charAt(0)
                                                    .toUpperCase() || "U"}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                  {member.user.name ||
                                                    "Unknown"}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                  <Badge
                                                    className={`text-xs ${getRoleBadgeColor(member.role)}`}
                                                  >
                                                    {member.role}
                                                  </Badge>
                                                  <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                  >
                                                    {member.taskCounts.total}{" "}
                                                    tasks
                                                  </Badge>
                                                </div>
                                              </div>
                                            </div>
                                          </Card>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          side="right"
                                          className="w-48"
                                        >
                                          <div className="space-y-2">
                                            <p className="font-medium text-sm">
                                              {member.user.name || "Unknown"}
                                            </p>
                                            <TaskCountTooltip
                                              taskCounts={member.taskCounts}
                                            />
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};
