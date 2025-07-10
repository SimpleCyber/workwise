"use client"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { Id } from "@/../convex/_generated/dataModel"
import { AttendanceDetailWithChat } from "./attendance-detail-with-chat"

interface UserAttendanceDetailProps {
  attendance: any
  workspaceId: Id<"workspaces">
  isOpen: boolean
  onClose: () => void
}

export const UserAttendanceDetail = ({ attendance, workspaceId, isOpen, onClose }: UserAttendanceDetailProps) => {
  if (!attendance) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0">
        <AttendanceDetailWithChat attendance={attendance} workspaceId={workspaceId} onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}
