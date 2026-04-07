"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Input } from "@/components/ui/input";
import { useWorkspaceId } from "@/hooks/use-workspace-id";

import { useCreateChannel } from "../api/use-create-channel";
import { useCreateChannelModal } from "../store/use-create-channel-modal";

export const CreateChannelModal = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const [open, setOpen] = useCreateChannelModal();
  const [name, setName] = useState("");

  const { mutate, isPending } = useCreateChannel();

  const handleClose = () => {
    setName("");
    setOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "-").toLowerCase();

    setName(value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    mutate(
      {
        name,
        workspaceId,
      },
      {
        onSuccess: (id) => {
          toast.success("Channel created.");

          router.push(`/workspace/${workspaceId}/channel/${id}`);
          handleClose();
        },
        onError: () => {
          toast.error("Failed to create channel.");
        },
      },
    );
  };

  return (
    <ResponsiveModal
      open={open || isPending}
      onOpenChange={handleClose}
      title="Add a channel"
      description="Channels are where your team communicates. They are best when organized around a topic."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          value={name}
          onChange={handleChange}
          disabled={isPending}
          required
          autoFocus
          minLength={3}
          maxLength={20}
          placeholder="e.g. plan-budget"
        />

        <div className="flex justify-end">
          <Button disabled={isPending}>Create</Button>
        </div>
      </form>
    </ResponsiveModal>
  );
};
