"use client"

import { useState, useEffect } from "react"
import { Save, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUpdateProjectTask } from "@/features/projects/api/use-update-project-task"
import { useGetWorkspaceMembers } from "@/features/projects/api/use-get-workspace-members"
import { toast } from "sonner"
import { format } from "date-fns"
import type { Id } from "../../../../convex/_generated/dataModel"

interface ProjectTaskDetailModalProps {
  task: {
    _id: Id<"projectTasks">
    title: string
    description?: string
    taskCode: string
    listId: Id<"projectLists">
    boardId: Id<"projectBoards">
    createdById: Id<"members">
    assignedToId: Id<"members">
    assignedById: Id<"members">
    workspaceId: Id<"workspaces">
    position: number
    priority: "low" | "medium" | "high" | "urgent"
    dueDate?: number
    isCompleted?: boolean
    isArchived?: boolean
    labels?: string[]
    attachments?: Id<"_storage">[]
    createdAt: number
    updatedAt: number
    assignedAt: number
    assignedTo: {
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
    } | null
    assignedBy: {
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
    } | null
    createdBy: {
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
    } | null
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

export const ProjectTaskDetailModal = ({ task, open, onOpenChange }: ProjectTaskDetailModalProps) => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium")
  const [assignedToId, setAssignedToId] = useState<Id<"members"> | undefined>(undefined)
  const [dueDate, setDueDate] = useState("")
  const [isCompleted, setIsCompleted] = useState(false)

  const { mutate: updateTask, isPending } = useUpdateProjectTask()
  const { data: members } = useGetWorkspaceMembers({
    workspaceId: task?.workspaceId,
  })

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setPriority(task.priority)
      setAssignedToId(task.assignedToId)
      setDueDate(task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : "")
      setIsCompleted(task.isCompleted || false)
    }
  }, [task])

  const handleSave = () => {
    if (!task || !title.trim()) return

    const updates: any = {
      taskId: task._id,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assignedToId,
      isCompleted,
    }

    if (dueDate) {
      updates.dueDate = new Date(dueDate).getTime()
    }

    updateTask(updates, {
      onSuccess: () => {
        toast.success("Task updated successfully!")
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update task")
      },
    })
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {task.taskCode}
              </Badge>
              <Badge className={`${priorityColors[priority]}`}>{priority.toUpperCase()}</Badge>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              disabled={isPending}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description..."
              rows={4}
              disabled={isPending}
            />
          </div>

          {/* Priority and Assignment Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(value: "low" | "medium" | "high" | "urgent") => setPriority(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🔵 Medium</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee..." />
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
          </div>

          {/* Due Date and Completion */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={isCompleted ? "completed" : "pending"}
                onValueChange={(value) => setIsCompleted(value === "completed")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">📋 In Progress</SelectItem>
                  <SelectItem value="completed">✅ Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task Info */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-sm">Task Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created by:</span>
                <div className="flex items-center gap-2 mt-1">
                  {task.createdBy?.user && (
                    <>
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={task.createdBy.user.image || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {task.createdBy.user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{task.createdBy.user.name}</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <div className="mt-1">{format(task.createdAt, "MMM d, yyyy 'at' h:mm a")}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending || !title.trim()}>
              {isPending ? (
                <>
                  <Save className="size-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
