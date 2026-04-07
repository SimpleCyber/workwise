"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Loader2, X, MessageSquare, Users, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetWorkspaceMembers } from "@/features/projects/api/use-get-workspace-members";
import { motion, AnimatePresence } from "framer-motion";
import { useGetWorkspaceProjects } from "@/features/test/api/all-data-hook";
import { useCurrentUser } from "../../auth/api/use-current-user";
import { ProjectKanbanBoard } from "./project-kanban-board";
import CompactAIAssistantUI from "./chatbot/CompactAIAssistantUI";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { useUpdateProjectTask } from "@/features/projects/api/use-update-project-task";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMobile } from "@/hooks/use-mobile";

interface ProjectSidebarKanbanProps {
  workspaceId: Id<"workspaces">;
  boardId: Id<"projectBoards">;
  isOpen: boolean;
  initialTab?: "tasks" | "chat";
  onClose: () => void;
}

const MIN_WIDTH = 400;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 600;

export const ProjectSidebarKanban = ({
  workspaceId,
  boardId,
  isOpen,
  initialTab = "tasks",
  onClose,
}: ProjectSidebarKanbanProps) => {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: projectDetails, isLoading } =
    useGetWorkspaceProjects(workspaceId);

  const board = useQuery(api.projects.getProjectBoard, { boardId });
  const lists = useQuery(api.projects.getProjectLists, { boardId });
  const { data: workspaceMembers, isLoading: membersLoading } =
    useGetWorkspaceMembers({ workspaceId });
  const { mutate: updateTask } = useUpdateProjectTask();

  const [selectedMemberIds, setSelectedMemberIds] = useState<Id<"members">[]>(
    [],
  );
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "chat">(initialTab);
  const isMobile = useMobile();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleMemberToggle = (memberId: Id<"members">) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    if (type === "task") {
      const taskId = draggableId as Id<"projectTasks">;
      if (source.droppableId !== destination.droppableId) {
        const newListId = destination.droppableId as Id<"projectLists">;
        updateTask(
          { taskId, listId: newListId, position: destination.index },
          {
            onError: (err) => toast.error(err.message || "Failed to move task"),
          },
        );
      } else {
        updateTask(
          { taskId, position: destination.index },
          {
            onError: (err) =>
              toast.error(err.message || "Failed to reorder task"),
          },
        );
      }
    }
  };

  const handleClearFilter = () => setSelectedMemberIds([]);

  // Resize functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  if (!board || !lists || membersLoading || userLoading) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-[600px] bg-background border-l border-border shadow-xl ring-1 ring-border z-50 flex items-center justify-center"
          >
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Sidebar - No overlay so we can interact with nodes */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 40,
              opacity: { duration: 0.2 },
            }}
            className="fixed right-0 top-0 h-full bg-background border-l-2 border-border shadow-2xl z-[60] flex flex-col rounded-l-2xl"
            style={{ width: isMobile ? "100vw" : sidebarWidth }}
          >
            {/* Resize Handle */}
            {!isMobile && (
              <div
                className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-transparent hover:bg-blue-500 hover:bg-opacity-40 transition-all z-[70] rounded-l-2xl"
                onMouseDown={handleMouseDown}
              />
            )}

            {/* Single Consolidated Header */}
            <div className="flex h-[60px] items-center border-b border-border bg-card px-4 flex-shrink-0 rounded-tl-3xl shadow-sm">
              {/* Left side - Project info and AI indicator */}
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold truncate">
                    {board.name}
                  </h1>
                  <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                    {board.boardCode}
                  </span>
                </div>

                <div className="h-4 w-px bg-border" />

                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                  <Button
                    variant={activeTab === "tasks" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("tasks")}
                    className="h-8 px-3 text-xs"
                  >
                    Tasks
                  </Button>
                  <Button
                    variant={activeTab === "chat" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("chat")}
                    className="h-8 px-3 text-xs"
                  >
                    AI Chat
                  </Button>
                </div>
              </div>

              {/* Right side - Member Filters and Close */}
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          selectedMemberIds.length === 0 ? "default" : "ghost"
                        }
                        size="sm"
                        onClick={handleClearFilter}
                        className="h-7 px-2 text-xs"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        All
                        {selectedMemberIds.length > 0 && (
                          <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1">
                            {selectedMemberIds.length}
                          </span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Show all users</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {workspaceMembers?.slice(0, 3).map((member) => {
                  const isSelected = selectedMemberIds.includes(member._id);
                  return (
                    <TooltipProvider key={member._id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full p-0"
                            onClick={() => handleMemberToggle(member._id)}
                          >
                            <Avatar
                              className={`h-6 w-6 border ${isSelected ? "border-blue-500" : "border-transparent"}`}
                            >
                              <AvatarImage
                                src={member.user?.image || "/placeholder.svg"}
                              />
                              <AvatarFallback className="text-xs">
                                {member.user?.name?.charAt(0).toUpperCase() ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isSelected ? "Remove filter for" : "Filter tasks by"}{" "}
                          {member.user?.name || "Unknown User"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}

                {workspaceMembers && workspaceMembers.length > 3 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        +{workspaceMembers.length - 3} more members
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <div className="h-4 w-px bg-border mx-1" />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="h-full">
                  {activeTab === "tasks" ? (
                    <div className="h-full overflow-hidden flex flex-col">
                      <ProjectKanbanBoard
                        boardId={boardId}
                        lists={lists || []}
                        selectedMemberIds={selectedMemberIds}
                        compact={true}
                      />
                    </div>
                  ) : (
                    <div className="h-full overflow-hidden">
                      {currentUser ? (
                        <CompactAIAssistantUI
                          workspaceId={workspaceId}
                          boardId={boardId}
                          currentUserId={currentUser._id}
                          currentUser={{
                            name: currentUser.name,
                            email: currentUser.email,
                            image: currentUser.image,
                          }}
                          projectDetails={projectDetails}
                          lists={lists || []}
                          selectedMemberIds={selectedMemberIds}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground font-medium">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Initialising AI session...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DragDropContext>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
