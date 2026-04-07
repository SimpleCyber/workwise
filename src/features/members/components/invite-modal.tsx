"use client";

import { useMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/../convex/_generated/dataModel";
import { useNewJoinCode } from "@/features/workspaces/api/use-new-join-code";

interface InviteModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  workspaceId: Id<"workspaces">;
  name: string;
  joinCode: string;
}

export const InviteModal = ({
  open,
  setOpen,
  workspaceId,
  name,
  joinCode,
}: InviteModalProps) => {
  const isMobile = useMobile();
  const [isPending, setIsPending] = useState(false);
  const { mutate: newJoinCode } = useNewJoinCode();

  const handleNewCode = async () => {
    setIsPending(true);
    await newJoinCode(
      { workspaceId },
      {
        onSuccess: () => {
          toast.success("New invite code generated!");
        },
        onError: () => {
          toast.error("Failed to generate new code");
        },
        onSettled: () => {
          setIsPending(false);
        },
      },
    );
  };

  const handleCopy = () => {
    const inviteLink = `${window.location.origin}/join/${workspaceId}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      toast.success("Invite link copied to clipboard!");
    });
  };

  const renderContent = () => (
    <div className="space-y-4 py-4 px-4 md:px-0">
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase text-muted-foreground">Workspace name</Label>
        <Input disabled value={name} className="bg-muted/50 font-medium" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Invite code</Label>
          <Button
            onClick={handleNewCode}
            disabled={isPending}
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-primary hover:text-primary hover:bg-primary/5"
          >
            <RefreshCw className="size-3 mr-2" />
            New code
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Input disabled value={joinCode} className="bg-muted/50 font-mono font-bold tracking-widest text-center text-lg" />
          <Button onClick={handleCopy} size="sm" className="h-10 shrink-0 px-4">
            <Copy className="size-4 mr-2" />
            Copy
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground bg-muted/30 p-3 rounded-lg border border-dashed text-center">
        Anyone with this code or link can join your workspace. Be careful whom you share it with.
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Invite people to {name}</DrawerTitle>
            <DrawerDescription>
              Share the invite link or code below
            </DrawerDescription>
          </DrawerHeader>
          {renderContent()}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite people to {name}</DialogTitle>
          <DialogDescription>
            Use the invite code below to invite people to your workspace
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};
