"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Plus, X, MoreHorizontal, Loader, Edit, Trash2, Archive, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateProjectList } from "@/features/projects/api/use-create-project-list"
import { useCreateProjectTask } from "@/features/projects/api/use-create-project-task"
import { useUpdateProjectTask } from "@/features/projects/api/use-update-project-task"
import { useDeleteProjectTask } from "@/features/projects/api/use-delete-project-task"
import { useGetProjectTasks } from "@/features/projects/api/use-get-project-tasks"
import { useGetWorkspaceMembers } from "@/features/projects/api/use-get-workspace-members"
import { ProjectTaskCard } from "./project-task-card"
import { toast } from "sonner"
import type { Id } from "../../../../convex/_generated/dataModel"
import { useUpdateProjectList } from "@/features/projects/api/use-update-project-list"
import { useDeleteProjectList } from "@/features/projects/api/use-delete-project-list"
import { ProjectTaskDetailModal } from "./project-task-detail-modal"

interface ProjectKanbanBoardProps {
  boardId: Id<"projectBoards">
  lists: Array<{
    _id: Id<"projectLists">
    name: string
    position: number
    boardId: Id<"projectBoards">
    memberId: Id<"members">
    workspaceId: Id<"workspaces">
    isArchived?: boolean
    createdAt: number
    updatedAt: number
  }>
}

export const ProjectKanbanBoard = ({ boardId, lists }: ProjectKanbanBoardProps) => {
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [addingTaskToList, setAddingTaskToList] = useState<Id<"projectLists"> | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [selectedAssignee, setSelectedAssignee] = useState<Id<"members"> | undefined>(undefined)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingListId, setEditingListId] = useState<Id<"projectLists"> | null>(null)
  const [editingListName, setEditingListName] = useState("")

  const { mutate: createList, isPending: isCreatingList } = useCreateProjectList()
  const { mutate: createTask, isPending: isCreatingTask } = useCreateProjectTask()
  const { mutate: updateTask } = useUpdateProjectTask()
  const { mutate: deleteTask } = useDeleteProjectTask()
  const { mutate: updateList } = useUpdateProjectList()
  const { mutate: deleteList } = useDeleteProjectList()

  // Get workspace members for assignment
  const workspaceId = lists[0]?.workspaceId
  const { data: members } = useGetWorkspaceMembers({ workspaceId })

  const handleCreateList = () => {
    if (!newListName.trim()) return

    createList(
      {
        name: newListName.trim(),
        boardId,
      },
      {
        onSuccess: () => {
          setNewListName("")
          setIsAddingList(false)
          toast.success("List created successfully!")
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create list")
        },
      },
    )
  }

  const handleCreateTask = (listId: Id<"projectLists">) => {
    if (!newTaskTitle.trim()) return

    createTask(
      {
        title: newTaskTitle.trim(),
        listId,
        assignedToId: selectedAssignee,
      },
      {
        onSuccess: () => {
          setNewTaskTitle("")
          setSelectedAssignee(undefined)
          setAddingTaskToList(null)
          toast.success("Task created successfully!")
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create task")
        },
      },
    )
  }

  const handleTaskArchive = (taskId: Id<"projectTasks">) => {
    updateTask(
      {
        taskId,
        isArchived: true,
      },
      {
        onSuccess: () => {
          toast.success("Task archived successfully!")
        },
        onError: (error) => {
          toast.error(error.message || "Failed to archive task")
        },
      },
    )
  }

  const handleTaskDelete = (taskId: Id<"projectTasks">) => {
    if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      deleteTask(
        { taskId },
        {
          onSuccess: () => {
            toast.success("Task deleted successfully!")
          },
          onError: (error) => {
            toast.error(error.message || "Failed to delete task")
          },
        },
      )
    }
  }

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

    if (type === "task") {
      const taskId = draggableId as Id<"projectTasks">

      // Moving to different list
      if (source.droppableId !== destination.droppableId) {
        const newListId = destination.droppableId as Id<"projectLists">
        updateTask(
          {
            taskId,
            listId: newListId,
            position: destination.index,
          },
          {
            onError: (error) => {
              toast.error(error.message || "Failed to move task")
            },
          },
        )
      } else {
        // Reordering within same list
        updateTask(
          {
            taskId,
            position: destination.index,
          },
          {
            onError: (error) => {
              toast.error(error.message || "Failed to reorder task")
            },
          },
        )
      }
    }
  }

  const handleListRename = (listId: Id<"projectLists">, newName: string) => {
    if (!newName.trim()) return

    updateList(
      {
        listId,
        name: newName.trim(),
      },
      {
        onSuccess: () => {
          toast.success("List renamed successfully!")
          setEditingListId(null)
          setEditingListName("")
        },
        onError: (error) => {
          toast.error(error.message || "Failed to rename list")
        },
      },
    )
  }

  const handleListArchive = (listId: Id<"projectLists">) => {
    updateList(
      {
        listId,
        isArchived: true,
      },
      {
        onSuccess: () => {
          toast.success("List archived successfully!")
        },
        onError: (error) => {
          toast.error(error.message || "Failed to archive list")
        },
      },
    )
  }

  const handleListDelete = (listId: Id<"projectLists">) => {
    if (
      confirm(
        "Are you sure you want to delete this list? All tasks in this list will also be deleted. This action cannot be undone.",
      )
    ) {
      deleteList(
        { listId },
        {
          onSuccess: () => {
            toast.success("List deleted successfully!")
          },
          onError: (error) => {
            toast.error(error.message || "Failed to delete list")
          },
        },
      )
    }
  }

  const handleTaskEdit = (task: any) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }

  const sortedLists = [...lists].filter((list) => !list.isArchived).sort((a, b) => a.position - b.position)

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="board" type="list" direction="horizontal">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="flex h-full gap-4 p-4 overflow-x-auto">
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
                  setAddingTaskToList(null)
                  setNewTaskTitle("")
                  setSelectedAssignee(undefined)
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
              />
            ))}
            {provided.placeholder}

            {/* Add List Column */}
            <div className="flex-shrink-0 w-72">
              {isAddingList ? (
                <Card>
                  <CardContent className="p-3">
                    <Input
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="Enter list title..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreateList()
                        } else if (e.key === "Escape") {
                          setIsAddingList(false)
                          setNewListName("")
                        }
                      }}
                      autoFocus
                      disabled={isCreatingList}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={handleCreateList} disabled={!newListName.trim() || isCreatingList}>
                        Add List
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsAddingList(false)
                          setNewListName("")
                        }}
                        disabled={isCreatingList}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full h-12 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50"
                  onClick={() => setIsAddingList(true)}
                >
                  <Plus className="size-4 mr-2" />
                  Add a list
                </Button>
              )}
            </div>
          </div>
        )}
      </Droppable>
      <ProjectTaskDetailModal task={selectedTask} open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen} />
    </DragDropContext>
  )
}

interface ProjectKanbanListProps {
  list: {
    _id: Id<"projectLists">
    name: string
    position: number
    boardId: Id<"projectBoards">
    memberId: Id<"members">
    workspaceId: Id<"workspaces">
    isArchived?: boolean
    createdAt: number
    updatedAt: number
  }
  index: number
  isAddingTask: boolean
  newTaskTitle: string
  setNewTaskTitle: (title: string) => void
  selectedAssignee: Id<"members"> | undefined
  setSelectedAssignee: (memberId: Id<"members"> | undefined) => void
  members: Array<{
    _id: Id<"members">
    userId: Id<"users">
    workspaceId: Id<"workspaces">
    role: "admin" | "member" | "lead"
    user: {
      _id: Id<"users">
      name?: string
      email?: string
      image?: string
    } | null
  }>
  onAddTask: () => void
  onCancelAddTask: () => void
  onCreateTask: () => void
  isCreatingTask: boolean
  onTaskArchive: (taskId: Id<"projectTasks">) => void
  onTaskDelete: (taskId: Id<"projectTasks">) => void
  onListRename: (listId: Id<"projectLists">, newName: string) => void
  onListArchive: (listId: Id<"projectLists">) => void
  onListDelete: (listId: Id<"projectLists">) => void
  onTaskEdit: (task: any) => void
  editingListId: Id<"projectLists"> | null
  editingListName: string
  setEditingListId: (id: Id<"projectLists"> | null) => void
  setEditingListName: (name: string) => void
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
}: ProjectKanbanListProps) => {
  const { data: tasks, isLoading } = useGetProjectTasks({ listId: list._id })

  const sortedTasks = tasks ? [...tasks].filter((task) => !task.isArchived).sort((a, b) => a.position - b.position) : []

  return (
    <Draggable draggableId={list._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex-shrink-0 w-72 ${snapshot.isDragging ? "rotate-2" : ""}`}
        >
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="size-4 text-muted-foreground hover:text-foreground" />
                  </div>
                  {editingListId === list._id ? (
                    <Input
                      value={editingListName}
                      onChange={(e) => setEditingListName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onListRename(list._id, editingListName)
                        } else if (e.key === "Escape") {
                          setEditingListId(null)
                          setEditingListName("")
                        }
                      }}
                      onBlur={() => {
                        if (editingListName.trim()) {
                          onListRename(list._id, editingListName)
                        } else {
                          setEditingListId(null)
                          setEditingListName("")
                        }
                      }}
                      className="h-6 text-sm font-medium"
                      autoFocus
                    />
                  ) : (
                    <h3 className="font-medium text-sm flex-1">{list.name}</h3>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingListId(list._id)
                        setEditingListName(list.name)
                      }}
                    >
                      <Edit className="size-4 mr-2" />
                      Rename List
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onListArchive(list._id)}>
                      <Archive className="size-4 mr-2" />
                      Archive List
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onListDelete(list._id)}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete List
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {sortedTasks.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {sortedTasks.length} task{sortedTasks.length !== 1 ? "s" : ""}
                </div>
              )}
            </CardHeader>

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
                    sortedTasks.map((task, taskIndex) => (
                      <Draggable key={task._id} draggableId={task._id} index={taskIndex}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? "rotate-2" : ""}
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
                    ))
                  )}
                  {provided.placeholder}

                  {isAddingTask ? (
                    <div className="space-y-2">
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Enter task title..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            onCreateTask()
                          } else if (e.key === "Escape") {
                            onCancelAddTask()
                          }
                        }}
                        autoFocus
                        disabled={isCreatingTask}
                      />
                      <div className="flex items-center gap-2">
                        <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Assign to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {members.map((member) => (
                              <SelectItem key={member._id} value={member._id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-5 h-5">
                                    <AvatarImage src={member.user?.image || "/placeholder.svg"} />
                                    <AvatarFallback className="text-xs">
                                      {member.user?.name?.charAt(0).toUpperCase()}
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
                        <Button size="sm" onClick={onCreateTask} disabled={!newTaskTitle.trim() || isCreatingTask}>
                          Add task
                        </Button>
                        <Button size="sm" variant="ghost" onClick={onCancelAddTask} disabled={isCreatingTask}>
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-muted-foreground hover:text-foreground"
                      onClick={onAddTask}
                    >
                      <Plus className="size-4 mr-2" />
                      Add a task
                    </Button>
                  )}
                </CardContent>
              )}
            </Droppable>
          </Card>
        </div>
      )}
    </Draggable>
  )
}
