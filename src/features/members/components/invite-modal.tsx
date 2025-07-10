"use client"

import { useState } from "react"
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNewJoinCode } from "@/features/workspaces/api/use-new-join-code"
import type { Id } from "@/../convex/_generated/dataModel"

interface InviteModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  workspaceId: Id<"workspaces">
  name: string
  joinCode: string
}

export const InviteModal = ({ open, setOpen, workspaceId, name, joinCode }: InviteModalProps) => {
  const [isPending, setIsPending] = useState(false)
  const { mutate: newJoinCode } = useNewJoinCode()

  const handleNewCode = async () => {
    setIsPending(true)
    await newJoinCode(
      { workspaceId },
      {
        onSuccess: () => {
          toast.success("New invite code generated!")
        },
        onError: () => {
          toast.error("Failed to generate new code")
        },
        onSettled: () => {
          setIsPending(false)
        },
      },
    )
  }

  const handleCopy = () => {
    const inviteLink = `${window.location.origin}/join/${workspaceId}`
    navigator.clipboard.writeText(inviteLink).then(() => {
      toast.success("Invite link copied to clipboard!")
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite people to {name}</DialogTitle>
          <DialogDescription>Use the invite code below to invite people to your workspace</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Workspace name</Label>
            <Input disabled value={name} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Invite code</Label>
              <Button onClick={handleNewCode} disabled={isPending} variant="ghost" size="sm">
                <RefreshCw className="size-4 mr-2" />
                New code
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Input disabled value={joinCode} />
              <Button onClick={handleCopy} size="sm">
                <Copy className="size-4 mr-2" />
                Copy link
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Anyone with this code can join your workspace</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
