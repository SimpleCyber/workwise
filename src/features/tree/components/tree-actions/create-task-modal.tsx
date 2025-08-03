"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCreateProjectTask } from "../../../projects/api/use-create-project-task"
import { useGetWorkspaceMembers } from "../../../projects/api/use-get-workspace-members"
import type { Id } from "../../../../../convex/_generated/dataModel"

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  listId: Id<"projectLists">
  workspaceId: Id<"workspaces">
}

export const CreateTaskModal = ({ isOpen, onClose, listId, workspaceId }: CreateTaskModalProps) => {
  const [title, setTitle] = useState("")
  const [assignedToId, setAssignedToId] = useState<Id<"members"> | undefined>()

  const { mutate: createTask, isPending } = useCreateProjectTask()
  const { data: members } = useGetWorkspaceMembers({ workspaceId })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      await createTask({
        title: title.trim(),
        listId,
        assignedToId,
      })

      setTitle("")
      setAssignedToId(undefined)
      onClose()
    } catch (error) {
      console.error("Failed to create task:", error)
    }
  }

  const handleClose = () => {
    setTitle("")
    setAssignedToId(undefined)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Assign To</Label>
            <Select
  value={assignedToId}
  onValueChange={(val) => setAssignedToId(val as Id<"members">)}
>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee (optional)" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member._id} value={member._id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={member.user?.image || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {member.user?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.user?.name || "Unknown"}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
