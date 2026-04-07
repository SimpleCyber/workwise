"use client";

import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ResponsiveModal, ModalClose } from "@/components/responsive-modal";
import { Input } from "@/components/ui/input";
import { useRemoveWorkspace } from "@/features/workspaces/api/use-remove-workspace";
import { useUpdateWorkspace } from "@/features/workspaces/api/use-update-workspace";
import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspaceId } from "@/hooks/use-workspace-id";

interface PreferencesModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialValue: string;
}

export const PreferencesModal = ({
  open,
  setOpen,
  initialValue,
}: PreferencesModalProps) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const [ConfirmDialog, confirmDeleteWorkspace] = useConfirm(
    "Are you sure?",
    "This action cannot be undone.",
  );

  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const [editOpen, setEditOpen] = useState(false);

  const { mutate: updateWorkspace, isPending: isUpdatingWorkspace } =
    useUpdateWorkspace();
  const { mutate: removeWorkspace, isPending: isRemovingWorkspace } =
    useRemoveWorkspace();

  const handleRemove = async () => {
    const ok = await confirmDeleteWorkspace();

    if (!ok) return;

    removeWorkspace(
      {
        id: workspaceId,
      },
      {
        onSuccess: () => {
          toast.success("Workspace removed.");

          setOpen(false);
          router.replace("/");
        },
        onError: () => {
          toast.error("Failed to remove workspace.");
        },
      },
    );
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    updateWorkspace(
      {
        id: workspaceId,
        name: value,
      },
      {
        onSuccess: () => {
          toast.success("Workspace updated.");
          setEditOpen(false);
        },
        onError: () => {
          toast.error("Failed to update workspace.");
        },
      },
    );
  };

  return (
    <>
      <ConfirmDialog />

      <ResponsiveModal
        open={open || isUpdatingWorkspace || isRemovingWorkspace}
        onOpenChange={setOpen}
        title={value}
        description="Your workspace preferences"
      >
        <div className="flex flex-col gap-y-2 px-4 pb-4">
          <button
            disabled={isUpdatingWorkspace || isRemovingWorkspace}
            onClick={() => setEditOpen(true)}
            className="flex w-full cursor-pointer flex-col rounded-lg border bg-card px-5 py-4 hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            <div className="flex w-full items-center justify-between">
              <p className="text-sm font-semibold">Workspace name</p>
              <p className="cursor-pointer text-sm font-semibold text-[#1264A3] hover:underline">
                Edit
              </p>
            </div>
            <p className="text-sm">{value}</p>
          </button>

          <ResponsiveModal
            open={editOpen}
            onOpenChange={setEditOpen}
            title="Rename this workspace"
            description="Rename your workspace to match your case."
          >
            <form className="space-y-4" onSubmit={handleEdit}>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={isUpdatingWorkspace}
                required
                autoFocus
                minLength={3}
                maxLength={20}
                placeholder="Workspace name e.g 'Work', 'Personal', 'Home'"
              />
              <div className="flex justify-end gap-x-2">
                <ModalClose>
                  <Button variant="outline" disabled={isUpdatingWorkspace}>
                    Cancel
                  </Button>
                </ModalClose>
                <Button disabled={isUpdatingWorkspace}>Save</Button>
              </div>
            </form>
          </ResponsiveModal>

          <button
            disabled={isRemovingWorkspace}
            onClick={handleRemove}
            className="flex cursor-pointer items-center gap-x-2 rounded-lg border bg-card px-5 py-4 text-rose-600 hover:bg-rose-500/10 disabled:pointer-events-none disabled:opacity-50"
          >
            <Trash className="size-4" />
            <p className="text-sm font-semibold">Delete workspace</p>
          </button>
        </div>
      </ResponsiveModal>
    </>
  );
};
