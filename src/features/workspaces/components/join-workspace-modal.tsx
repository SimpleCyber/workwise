"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import VerificationInput from "react-verification-input";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useJoinByCode } from "../api/use-join-by-code";
import { useJoinWorkspaceModal } from "../store/use-join-workspace-modal";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const JoinWorkspaceModal = () => {
  const router = useRouter();
  const isMobile = useMobile();

  const [open, setOpen] = useJoinWorkspaceModal();
  const { mutate, isPending } = useJoinByCode();

  const handleClose = () => {
    setOpen(false);
  };

  const handleComplete = (value: string) => {
    mutate(
      { joinCode: value.toLowerCase() },
      {
        onSuccess: (id) => {
          router.push(`/workspace/${id}`);
          toast.success("Workspace joined!");
          handleClose();
        },
        onError: () => {
          toast.error("Invalid code or already a member.");
        },
      },
    );
  };

  const renderContent = () => (
    <div className="flex flex-col items-center justify-center gap-y-6 p-6">
      <p className="text-sm text-muted-foreground text-center">
        Enter the 6-digit workspace code to join an existing workspace.
      </p>

      <VerificationInput
        onComplete={handleComplete}
        validChars="A-Za-z0-9"
        length={6}
        classNames={{
          container: cn(
            "flex gap-x-2",
            isPending && "opacity-50 cursor-not-allowed pointer-events-none",
          ),
          character:
            "uppercase h-12 w-10 sm:h-14 sm:w-12 rounded-md border border-gray-300 flex items-center justify-center text-lg font-medium text-gray-500",
          characterInactive: "bg-muted",
          characterSelected: "bg-white text-black border-primary",
          characterFilled: "bg-white text-black",
        }}
        autoFocus
      />

      <Button
        variant="ghost"
        onClick={handleClose}
        className="w-full md:w-auto"
      >
        Cancel
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Join a workspace</DrawerTitle>
            <DrawerDescription>
              Enter a code to join an existing workspace.
            </DrawerDescription>
          </DrawerHeader>
          {renderContent()}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a workspace</DialogTitle>
          <DialogDescription>
            Enter a code to join an existing workspace.
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};
