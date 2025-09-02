"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProjectKanbanBoard } from "@/features/projects/components/project-kanban-board";
import { useGetWorkspaceMembers } from "@/features/projects/api/use-get-workspace-members";
import AIAssistantUI from "@/features/projects/components/chatbot/AIAssistantUI";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { useUpdateProjectTask } from "@/features/projects/api/use-update-project-task";
import { toast } from "sonner";

export default function ProjectBoardPage({
  params,
}: {
  params: { workspaceId: Id<"workspaces">; boardId: Id<"projectBoards"> };
}) {
  const { workspaceId, boardId } = params;
  const board = useQuery(api.projects.getProjectBoard, { boardId });
  const lists = useQuery(api.projects.getProjectLists, { boardId });
  const { data: workspaceMembers, isLoading: membersLoading } =
    useGetWorkspaceMembers({ workspaceId });
  const [selectedMemberIds, setSelectedMemberIds] = useState<Id<"members">[]>(
    [],
  ); // Change to array
  const { mutate: updateTask } = useUpdateProjectTask();
  const lastDragPayloadRef = useRef<any | null>(null);

  useEffect(() => {
    function handleDragStartEvt(ev: any) {
      lastDragPayloadRef.current = ev?.detail || null;
    }
    window.addEventListener("kanban:task-drag-start", handleDragStartEvt);
    return () =>
      window.removeEventListener("kanban:task-drag-start", handleDragStartEvt);
  }, []);

  function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    if (type === "task") {
      // Dropped into chat -> attach to chat and do not reorder
      if (destination.droppableId === "chat-dropzone") {
        const payload = lastDragPayloadRef.current;
        if (payload?.type === "project-task" && payload?.task) {
          try {
            window.dispatchEvent(
              new CustomEvent("kanban:task-drop-to-chat", { detail: payload }),
            );
          } catch {}
        } else {
          // Fallback minimal payload
          window.dispatchEvent(
            new CustomEvent("kanban:task-drop-to-chat", {
              detail: {
                type: "project-task",
                task: { taskId: String(draggableId) },
              },
            }),
          );
        }
        return;
      }

      // Otherwise perform normal move/reorder
      const taskId = draggableId as Id<"projectTasks">;
      if (source.droppableId !== destination.droppableId) {
        const newListId = destination.droppableId as Id<"projectLists">;
        updateTask(
          {
            taskId,
            listId: newListId,
            position: destination.index,
          },
          {
            onError: (error) => {
              toast.error(error.message || "Failed to move task");
            },
          },
        );
      } else {
        updateTask(
          {
            taskId,
            position: destination.index,
          },
          {
            onError: (error) => {
              toast.error(error.message || "Failed to reorder task");
            },
          },
        );
      }
    }
  }

  // Derive a best-effort currentUserId from the members list.
  // Ideally, you'd fetch the authenticated user's "users" table id explicitly.
  // If available, prefer a member with a matching "isCurrentUser" flag or similar.
  // As a fallback, pick the first member's userId to avoid failing Convex mutations.
  const currentUserId = useMemo(() => {
    if (!workspaceMembers || workspaceMembers.length === 0)
      return undefined as unknown as Id<"users"> | undefined;
    // Try to find a member flagged as the current user if such data exists
    const self =
      (workspaceMembers as any[]).find((m) => m.isCurrentUser) ||
      (workspaceMembers as any[])[0];
    return self?.userId as Id<"users"> | undefined;
  }, [workspaceMembers]);

  const currentUser = useMemo(() => {
    if (!workspaceMembers || workspaceMembers.length === 0) return undefined;
    const self =
      (workspaceMembers as any[]).find((m) => m.isCurrentUser) ||
      (workspaceMembers as any[])[0];
    return self?.user || undefined;
  }, [workspaceMembers]);

  if (!board || !lists || membersLoading) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleMemberToggle = (memberId: Id<"members">) => {
    setSelectedMemberIds(
      (prev) =>
        prev.includes(memberId)
          ? prev.filter((id) => id !== memberId) // Remove if already selected
          : [...prev, memberId], // Add if not selected
    );
  };

  const handleClearFilter = () => {
    setSelectedMemberIds([]);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[49px] items-center border-b bg-white px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{board.name}</h1>
          <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
            {board.boardCode}
          </span>
        </div>
        {board.description && (
          <span className="ml-4 text-sm text-muted-foreground">
            {board.description}
          </span>
        )}

        {/* User Avatars for Filtering */}
        <div className="ml-auto flex items-center gap-3">
          <Button
            variant={selectedMemberIds.length === 0 ? "secondary" : "ghost"}
            size="sm"
            onClick={handleClearFilter}
            className="rounded-full px-3 py-1 text-xs"
          >
            All Users
            {selectedMemberIds.length > 0 && (
              <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1">
                {selectedMemberIds.length}
              </span>
            )}
          </Button>
          {workspaceMembers?.map((member) => {
            const isSelected = selectedMemberIds.includes(member._id);
            return (
              <Button
                key={member._id}
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 transition-all hover:bg-muted"
                onClick={() => handleMemberToggle(member._id)}
                title={`${isSelected ? "Remove filter for" : "Filter tasks assigned to"} ${member.user?.name || "Unknown User"}`}
              >
                <Avatar
                  className={`h-9 w-9 border-2 ${isSelected ? "border-blue-500" : "border-transparent"}`}
                >
                  <AvatarImage src={member.user?.image || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">
                    {member.user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">
                  {member.user?.name || "Unknown User"}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex overflow-hidden w-full h-full">
          <div className="basis-[50%] flex-shrink-0 flex-grow">
            <ProjectKanbanBoard
              boardId={boardId}
              lists={lists || []}
              selectedMemberIds={selectedMemberIds}
            />
          </div>

          {/* Chat side as a Droppable target */}
          <Droppable droppableId="chat-dropzone" type="task">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={
                  "basis-[50%] flex-shrink-0 flex-grow border-l-[3px] border-gray-200 " +
                  (snapshot.isDraggingOver ? "bg-blue-50" : "")
                }
              >
                {currentUserId ? (
                  <AIAssistantUI
                    workspaceId={workspaceId}
                    boardId={boardId}
                    currentUserId={currentUserId}
                    currentUser={{
                      name: currentUser?.name,
                      email: currentUser?.email,
                      image: currentUser?.image,
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Loading your chat session...
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
}
