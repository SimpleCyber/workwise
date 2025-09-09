"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProjectKanbanBoard } from "@/features/projects/components/project-kanban-board";
import { useGetWorkspaceMembers } from "@/features/projects/api/use-get-workspace-members";
import AIAssistantUI from "@/features/projects/components/chatbot/AIAssistantUI";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { useUpdateProjectTask } from "@/features/projects/api/use-update-project-task";
import { toast } from "sonner";

import { useCurrentUser } from "../../../../../features/auth/api/use-current-user";

export default function ProjectBoardPage({
  params,
}: {
  params: { workspaceId: Id<"workspaces">; boardId: Id<"projectBoards"> };
}) {
  const { workspaceId, boardId } = params;

  // ✅ get the signed-in user directly from auth
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  const board = useQuery(api.projects.getProjectBoard, { boardId });
  const lists = useQuery(api.projects.getProjectLists, { boardId });
  const { data: workspaceMembers, isLoading: membersLoading } =
    useGetWorkspaceMembers({ workspaceId });

  const [selectedMemberIds, setSelectedMemberIds] = useState<Id<"members">[]>(
    [],
  );
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
      if (destination.droppableId === "chat-dropzone") {
        const payload = lastDragPayloadRef.current;
        const cached = (window as any).__lastDraggedTask;
        const detail =
          (payload?.type === "project-task" && payload?.task && payload) ||
          (cached
            ? { type: "project-task", task: cached }
            : { type: "project-task", task: { taskId: String(draggableId) } });

        window.dispatchEvent(
          new CustomEvent("kanban:task-drop-to-chat", { detail }),
        );
        return;
      }

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
  }

  if (!board || !lists || membersLoading || userLoading) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleMemberToggle = (memberId: Id<"members">) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const handleClearFilter = () => setSelectedMemberIds([]);

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
          <Droppable droppableId="chat-dropzone" type="task">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={
                  "basis-[50%] flex-shrink-0 flex-grow border-r-[3px] border-gray-200 " +
                  (snapshot.isDraggingOver ? "bg-blue-50" : "")
                }
              >
                {currentUser ? (
                  <AIAssistantUI
                    workspaceId={workspaceId}
                    boardId={boardId}
                    currentUserId={currentUser._id} // ✅ from useCurrentUser
                    currentUser={{
                      name: currentUser.name,
                      email: currentUser.email,
                      image: currentUser.image,
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

          <div className="basis-[50%] flex-shrink-0 flex-grow">
            <ProjectKanbanBoard
              boardId={boardId}
              lists={lists || []}
              selectedMemberIds={selectedMemberIds}
            />
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
