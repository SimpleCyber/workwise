"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useUpdateProjectBoard } from "../../../projects/api/use-update-project-board"
import type { Id } from "../../../../../convex/_generated/dataModel"

interface EditProjectModalProps {
  isOpen: boolean
  onClose: () => void
  boardId: Id<"projectBoards">
  initialData: {
    name: string
    description?: string
    background?: string
  }
}

export const EditProjectModal = ({ isOpen, onClose, boardId, initialData }: EditProjectModalProps) => {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [background, setBackground] = useState("")

  const { mutate: updateProject, isPending } = useUpdateProjectBoard()

  useEffect(() => {
    if (isOpen) {
      setName(initialData.name)
      setDescription(initialData.description || "")
      setBackground(initialData.background || "")
    }
  }, [isOpen, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      await updateProject({
        boardId,
        name: name.trim(),
        description: description.trim() || undefined,
        background: background.trim() || undefined,
      })

      onClose()
    } catch (error) {
      console.error("Failed to update project:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="background">Background Color</Label>
            <Input
              id="background"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="e.g., #3b82f6 or blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Updating..." : "Update Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
