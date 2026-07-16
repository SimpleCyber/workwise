"use client";

import { Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Loader, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateProjectList } from "@/features/projects/api/use-create-project-list";
import { useCreateProjectTask } from "@/features/projects/api/use-create-project-task";
import { useDeleteProjectList } from "@/features/projects/api/use-delete-project-list";
import { useDeleteProjectTask } from "@/features/projects/api/use-delete-project-task";
import { useGetProjectTasks } from "@/features/projects/api/use-get-project-tasks";
import {
  useGetWorkspaceMembers,
  type WorkspaceMember,
} from "@/features/projects/api/use-get-workspace-members";
import { useUpdateProjectList } from "@/features/projects/api/use-update-project-list";
import { useUpdateProjectTask } from "@/features/projects/api/use-update-project-task";
import { useConfirm } from "@/hooks/use-confirm";
import type { Id } from "../../../../convex/_generated/dataModel";
import { ProjectTaskCard } from "./project-task-card";
import { ProjectTaskDetailModal } from "./project-task-detail-modal";

interface ProjectKanbanBoardProps {
  boardId: Id<"projectBoards">;
  lists: Array<{
    _id: Id<"projectLists">;
    name: string;
    position: number;
    boardId: Id<"projectBoards">;
    memberId: Id<"members">;
    workspaceId: Id<"workspaces">;
    isArchived?: boolean;
    createdAt: number;
    updatedAt: number;
  }>;
  selectedMemberIds: Id<"members">[]; // Change to array
  compact?: boolean; // New prop for sidebar mode
}

export const ProjectKanbanBoard = ({
  boardId,
  lists,
  selectedMemberIds,
  compact = false,
}: ProjectKanbanBoardProps) => {
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [addingTaskToList, setAddingTaskToList] =
    useState<Id<"projectLists"> | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState<
    Id<"members"> | undefined
  >(undefined);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<Id<"projectLists"> | null>(
    null,
  );
  const [editingListName, setEditingListName] = useState("");

  const { mutate: createList, isPending: isCreatingList } =
    useCreateProjectList();
  const { mutate: createTask, isPending: isCreatingTask } =
    useCreateProjectTask();
  const { mutate: updateTask } = useUpdateProjectTask();
  const { mutate: deleteTask } = useDeleteProjectTask();
  const { mutate: updateList } = useUpdateProjectList();
  const { mutate: deleteList } = useDeleteProjectList();

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "This action cannot be undone.",
  );

  // Get workspace members for assignment
  const workspaceId = lists[0]?.workspaceId;
  const { data: members } = useGetWorkspaceMembers({ workspaceId });

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    createList(
      {
        name: newListName.trim(),
        boardId,
      },
      {
        onSuccess: () => {
          setNewListName("");
          setIsAddingList(false);
          toast.success("List created successfully!");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create list");
        },
      },
    );
  };

  const handleCreateTask = (listId: Id<"projectLists">) => {
    if (!newTaskTitle.trim()) return;
    createTask(
      {
        title: newTaskTitle.trim(),
        listId,
        assignedToId: selectedAssignee,
      },
      {
        onSuccess: () => {
          setNewTaskTitle("");
          setSelectedAssignee(undefined);
          setAddingTaskToList(null);
          toast.success("Task created successfully!");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create task");
        },
      },
    );
  };

  const handleTaskArchive = (taskId: Id<"projectTasks">) => {
    updateTask(
      {
        taskId,
        isArchived: true,
      },
      {
        onSuccess: () => {
          toast.success("Task archived successfully!");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to archive task");
        },
      },
    );
  };

  const handleTaskDelete = async (taskId: Id<"projectTasks">) => {
    const ok = await confirm();

    if (ok) {
      deleteTask(
        { taskId },
        {
          onSuccess: () => {
            toast.success("Task deleted successfully!");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to delete task");
          },
        },
      );
    }
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === "list") {
      const listId = draggableId as Id<"projectLists">;
      const sortedListsArray = [...lists]
        .filter((list) => !list.isArchived)
        .sort((a, b) => a.position - b.position);

      const startIndex = source.index;
      const endIndex = destination.index;

      let newPosition = 0;
      if (endIndex === 0) {
        newPosition = sortedListsArray[0].position - 1000;
      } else if (endIndex === sortedListsArray.length - 1) {
        newPosition =
          sortedListsArray[sortedListsArray.length - 1].position + 1000;
      } else {
        const itemBefore =
          sortedListsArray[endIndex < startIndex ? endIndex - 1 : endIndex];
        const itemAfter =
          sortedListsArray[endIndex < startIndex ? endIndex : endIndex + 1];
        newPosition = (itemBefore.position + itemAfter.position) / 2;
      }

      updateList(
        {
          listId,
          position: newPosition,
        },
        {
          onError: (error) => {
            toast.error(error.message || "Failed to reorder list");
          },
        },
      );
      return;
    }

    if (type === "task") {
      const taskId = draggableId as Id<"projectTasks">;
      // Moving to different list
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
        // Reordering within same list
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
  };

  const handleListRename = (listId: Id<"projectLists">, newName: string) => {
    if (!newName.trim()) return;
    updateList(
      {
        listId,
        name: newName.trim(),
      },
      {
        onSuccess: () => {
          toast.success("List renamed successfully!");
          setEditingListId(null);
          setEditingListName("");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to rename list");
        },
      },
    );
  };

  const handleListArchive = (listId: Id<"projectLists">) => {
    updateList(
      {
        listId,
        isArchived: true,
      },
      {
        onSuccess: () => {
          toast.success("List archived successfully!");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to archive list");
        },
      },
    );
  };

  const handleListDelete = async (listId: Id<"projectLists">) => {
    const ok = await confirm();

    if (ok) {
      deleteList(
        { listId },
        {
          onSuccess: () => {
            toast.success("List deleted successfully!");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to delete list");
          },
        },
      );
    }
  };

  const handleTaskEdit = (task: any) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const sortedLists = [...lists]
    .filter((list) => !list.isArchived)
    .sort((a, b) => a.position - b.position);

  return (
    <>
      <ConfirmDialog />
      <Droppable droppableId="board" type="list" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex h-full overflow-x-auto ${compact ? "gap-2 p-2" : "gap-4 p-4"}`}
          >
            {sortedLists.map((list, index) => (
              <ProjectKanbanList
                key={list._id}
                list={list}
                index={index}
                isAddingTask={addingTaskToList === list._id}
                newTaskTitle={newTaskTitle}
                setNewTaskTitle={setNewTaskTitle}
                selectedAssignee={selectedAssignee}
                setSelectedAssignee={setSelectedAssignee}
                members={members}
                onAddTask={() => setAddingTaskToList(list._id)}
                onCancelAddTask={() => {
                  setAddingTaskToList(null);
                  setNewTaskTitle("");
                  setSelectedAssignee(undefined);
                }}
                onCreateTask={() => handleCreateTask(list._id)}
                isCreatingTask={isCreatingTask}
                onTaskArchive={handleTaskArchive}
                onTaskDelete={handleTaskDelete}
                onListRename={handleListRename}
                onListArchive={handleListArchive}
                onListDelete={handleListDelete}
                onTaskEdit={handleTaskEdit}
                editingListId={editingListId}
                editingListName={editingListName}
                setEditingListId={setEditingListId}
                setEditingListName={setEditingListName}
                selectedMemberIds={selectedMemberIds}
                compact={compact}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <ProjectTaskDetailModal
        task={selectedTask}
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        lists={lists || []}
      />
    </>
  );
};

interface ProjectKanbanListProps {
  list: {
    _id: Id<"projectLists">;
    name: string;
    position: number;
    boardId: Id<"projectBoards">;
    memberId: Id<"members">;
    workspaceId: Id<"workspaces">;
    isArchived?: boolean;
    createdAt: number;
    updatedAt: number;
  };
  index: number;
  isAddingTask: boolean;
  newTaskTitle: string;
  setNewTaskTitle: (title: string) => void;
  selectedAssignee: Id<"members"> | undefined;
  setSelectedAssignee: (memberId: Id<"members"> | undefined) => void;
  members: WorkspaceMember[];
  onAddTask: () => void;
  onCancelAddTask: () => void;
  onCreateTask: () => void;
  isCreatingTask: boolean;
  onTaskArchive: (taskId: Id<"projectTasks">) => void;
  onTaskDelete: (taskId: Id<"projectTasks">) => void;
  onListRename: (listId: Id<"projectLists">, newName: string) => void;
  onListArchive: (listId: Id<"projectLists">) => void;
  onListDelete: (listId: Id<"projectLists">) => void;
  onTaskEdit: (task: any) => void;
  editingListId: Id<"projectLists"> | null;
  editingListName: string;
  setEditingListId: (id: Id<"projectLists"> | null) => void;
  setEditingListName: (name: string) => void;
  selectedMemberIds: Id<"members">[]; // Change to array
  compact?: boolean; // New prop for sidebar mode
}

const ProjectKanbanList = ({
  list,
  index,
  isAddingTask,
  newTaskTitle,
  setNewTaskTitle,
  selectedAssignee,
  setSelectedAssignee,
  members,
  onAddTask,
  onCancelAddTask,
  onCreateTask,
  isCreatingTask,
  onTaskArchive,
  onTaskDelete,
  onListRename,
  onListArchive,
  onListDelete,
  onTaskEdit,
  editingListId,
  editingListName,
  setEditingListId,
  setEditingListName,
  selectedMemberIds, // Change to array
  compact = false,
}: ProjectKanbanListProps) => {
  // Pass selectedMemberIds array to the query
  const { data: tasks, isLoading } = useGetProjectTasks({
    listId: list._id,
    assignedToIds: selectedMemberIds.length > 0 ? selectedMemberIds : undefined,
  });

  const [hiddenTaskIds, setHiddenTaskIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    function onHide(e: any) {
      const id = e?.detail?.taskId as string | undefined;
      if (!id) return;
      setHiddenTaskIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setTimeout(() => {
        setHiddenTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 1200);
    }
    window.addEventListener("kanban:optimistic-hide", onHide);
    return () => window.removeEventListener("kanban:optimistic-hide", onHide);
  }, []);

  const sortedTasks = tasks
    ? [...tasks]
        .filter(
          (task) => !task.isArchived && !hiddenTaskIds.has(task._id as any),
        )
        .sort((a, b) => a.position - b.position)
    : [];

  return (
    <Draggable draggableId={list._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex-shrink-0 ${compact ? "w-56" : "w-72"} ${snapshot.isDragging ? "rotate-2" : ""}`}
        >
          <Card className="bg-muted/50 border-border">
            <CardHeader className="pb-2">
              <div
                className="flex items-center justify-between cursor-grab active:cursor-grabbing"
                {...provided.dragHandleProps}
              >
                <div className="flex items-center gap-2 flex-1">
                  {editingListId === list._id ? (
                    <Input
                      value={editingListName}
                      onChange={(e) => setEditingListName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onListRename(list._id, editingListName);
                        } else if (e.key === "Escape") {
                          setEditingListId(null);
                          setEditingListName("");
                        }
                      }}
                      onBlur={() => {
                        if (editingListName.trim()) {
                          onListRename(list._id, editingListName);
                        } else {
                          setEditingListId(null);
                          setEditingListName("");
                        }
                      }}
                      className="h-6 text-sm font-medium"
                      autoFocus
                    />
                  ) : (
                    <h3
                      className="font-medium text-sm flex justify-center cursor-pointer hover:bg-muted p-1 rounded transition-colors"
                      onClick={() => {
                        setEditingListId(list._id);
                        setEditingListName(list.name);
                      }}
                      title="Click to rename list"
                    >
                      {list.name}
                      {sortedTasks.length > 0 && (
                        <div className="text-xs text-muted-foreground ml-2 border-2 border-border rounded-sm px-1 bg-muted">
                          {sortedTasks.length}/{sortedTasks.length}
                        </div>
                      )}
                    </h3>
                  )}
                </div>
              </div>
            </CardHeader>
            {/* Keep the rest of the existing Droppable content */}
            <Droppable droppableId={list._id} type="task">
              {(provided, snapshot) => (
                <CardContent
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 min-h-[100px] ${snapshot.isDraggingOver ? "bg-muted/50" : ""}`}
                >
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader className="size-4 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Task form placed at the top of every list */}
                      {isAddingTask ? (
                        <div className="space-y-2 mb-3">
                          <Input
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Enter task title..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                onCreateTask();
                              } else if (e.key === "Escape") {
                                onCancelAddTask();
                              }
                            }}
                            autoFocus
                            disabled={isCreatingTask}
                          />
                          <div className="flex items-center gap-2">
                            <Select
                              value={selectedAssignee ?? ""}
                              onValueChange={(value) =>
                                setSelectedAssignee(value as Id<"members">)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Assign to..." />
                              </SelectTrigger>
                              <SelectContent>
                                {members.map((member) => (
                                  <SelectItem
                                    key={member._id}
                                    value={member._id}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-5 h-5">
                                        <AvatarImage
                                          src={
                                            member.user?.image ||
                                            "/placeholder.svg"
                                          }
                                        />
                                        <AvatarFallback className="text-xs">
                                          {member.user?.name
                                            ?.charAt(0)
                                            .toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span>{member.user?.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={onCreateTask}
                              disabled={!newTaskTitle.trim() || isCreatingTask}
                            >
                              Add task
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={onCancelAddTask}
                              disabled={isCreatingTask}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-muted-foreground hover:text-foreground mb-2"
                          onClick={onAddTask}
                        >
                          <Plus className="size-4 mr-2" />
                          Add a task
                        </Button>
                      )}

                      {sortedTasks.map((task, taskIndex) => (
                        <Draggable
                          key={task._id}
                          draggableId={task._id}
                          index={taskIndex}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? "rotate-2" : ""}
                              onDragStart={(e) => {
                                try {
                                  const payload = {
                                    type: "project-task",
                                    task: {
                                      taskId: String(task._id),
                                      taskCode: task.taskCode,
                                      title: task.title,
                                      description: task.description,
                                      priority: task.priority,
                                      dueDate: task.dueDate || null,
                                      labels: Array.isArray(task.labels)
                                        ? task.labels
                                        : [],
                                      boardId: String(task.boardId),
                                      listId: String(task.listId),
                                      assignedTo: task.assignedTo?.user
                                        ? {
                                            id: String(
                                              task.assignedTo.user._id,
                                            ),
                                            name:
                                              task.assignedTo.user.name || null,
                                            email:
                                              task.assignedTo.user.email ||
                                              null,
                                            image:
                                              task.assignedTo.user.image ||
                                              null,
                                          }
                                        : null,
                                      assignedBy: task.assignedBy?.user
                                        ? {
                                            id: String(
                                              task.assignedBy.user._id,
                                            ),
                                            name:
                                              task.assignedBy.user.name || null,
                                            email:
                                              task.assignedBy.user.email ||
                                              null,
                                            image:
                                              task.assignedBy.user.image ||
                                              null,
                                          }
                                        : null,
                                      createdBy: task.createdBy?.user
                                        ? {
                                            id: String(task.createdBy.user._id),
                                            name:
                                              task.createdBy.user.name || null,
                                            email:
                                              task.createdBy.user.email || null,
                                            image:
                                              task.createdBy.user.image || null,
                                          }
                                        : null,
                                    },
                                  };
                                  const json = JSON.stringify(payload);
                                  // Provide both MIME types for broad browser support
                                  e.dataTransfer?.setData(
                                    "application/json",
                                    json,
                                  );
                                  e.dataTransfer?.setData("text/plain", json);
                                  e.dataTransfer!.effectAllowed = "copy";
                                  // Emit a global event so page-level onDragEnd can access full payload
                                  (window as any).__lastTaskDragPayload =
                                    payload;
                                  window.dispatchEvent(
                                    new CustomEvent("kanban:task-drag-start", {
                                      detail: payload,
                                    }),
                                  );
                                } catch {
                                  // ignore
                                }
                              }}
                            >
                              <ProjectTaskCard
                                task={task}
                                onEdit={() => onTaskEdit(task)}
                                onArchive={() => onTaskArchive(task._id)}
                                onDelete={() => onTaskDelete(task._id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </>
                  )}
                  {provided.placeholder}
                </CardContent>
              )}
            </Droppable>
          </Card>
        </div>
      )}
    </Draggable>
  );
};
