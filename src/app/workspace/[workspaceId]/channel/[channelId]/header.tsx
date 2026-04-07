import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { ChevronLeft, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ResponsiveModal, ModalClose } from "@/components/responsive-modal";
import { Input } from "@/components/ui/input";
import { useRemoveChannel } from "@/features/channels/api/use-remove-channel";
import { useUpdateChannel } from "@/features/channels/api/use-update-channel";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useChannelId } from "@/hooks/use-channel-id";
import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  channelName: string;
}

export const Header = ({ channelName }: HeaderProps) => {
  const router = useRouter();
  const isMobile = useMobile();
  const channelId = useChannelId();
  const workspaceId = useWorkspaceId();
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "This action cannot be undone.",
  );

  const [value, setValue] = useState(channelName);
  const [headerOpen, setHeaderOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data: member, isLoading: memberLoading } = useCurrentMember({
    workspaceId,
  });
  const { mutate: updateChannel, isPending: isUpdatingChannel } =
    useUpdateChannel();
  const { mutate: removeChannel, isPending: isRemovingChannel } =
    useRemoveChannel();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "-").toLowerCase();

    setValue(value);
  };

  const handleEditOpen = (value: boolean) => {
    if (member?.role !== "admin") return;

    setEditOpen(value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    updateChannel(
      { id: channelId, name: value },
      {
        onSuccess: () => {
          toast.success("Channel updated.");
          setEditOpen(false);
        },
        onError: () => {
          toast.error("Failed to update channel.");
        },
      },
    );
  };

  const handleDelete = async () => {
    const ok = await confirm();

    if (!ok) return;

    removeChannel(
      { id: channelId },
      {
        onSuccess: () => {
          toast.success("Channel deleted");

          router.push(`/workspace/${workspaceId}`);
        },
        onError: () => {
          toast.error("Failed to delete channel.");
        },
      },
    );
  };

  return (
    <div className="flex h-[49px] items-center overflow-hidden border-b bg-background px-4">
      <ConfirmDialog />

      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => router.push(`/workspace/${workspaceId}`)}
        >
          <ChevronLeft className="size-5" />
        </Button>
      )}

      <Button
        disabled={memberLoading}
        variant="ghost"
        className="w-auto overflow-hidden px-2 text-lg font-semibold"
        size="sm"
        onClick={() => setHeaderOpen(true)}
      >
        <span className="truncate"># {channelName}</span>
        <FaChevronDown className="ml-2 size-2.5" />
      </Button>

      <ResponsiveModal
        open={headerOpen}
        onOpenChange={setHeaderOpen}
        title={`# ${channelName}`}
        description="Your channel preferences"
      >
        <div className="flex flex-col gap-y-2">
          <button
            disabled={isUpdatingChannel}
            onClick={() => handleEditOpen(true)}
            className="flex w-full cursor-pointer flex-col rounded-lg border bg-card px-5 py-4 hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            <div className="flex w-full items-center justify-between">
              <p className="text-sm font-semibold">Channel name</p>
              {member?.role === "admin" && (
                <p className="text-sm font-semibold text-[#1264A3] hover:underline">
                  Edit
                </p>
              )}
            </div>

            <p className="text-sm"># {channelName}</p>
          </button>

          <ResponsiveModal
            open={editOpen}
            onOpenChange={setEditOpen}
            title="Rename this channel"
            description="Rename this channel to match your case."
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                value={value}
                disabled={isUpdatingChannel}
                onChange={handleChange}
                required
                autoFocus
                minLength={3}
                maxLength={20}
                placeholder="e.g. plan-budget"
              />

              <div className="flex justify-end gap-x-2">
                <ModalClose>
                  <Button variant="outline" disabled={isUpdatingChannel}>
                    Cancel
                  </Button>
                </ModalClose>

                <Button disabled={isUpdatingChannel}>Save</Button>
              </div>
            </form>
          </ResponsiveModal>

          {member?.role === "admin" && (
            <button
              onClick={handleDelete}
              disabled={isRemovingChannel}
              className="flex cursor-pointer items-center gap-x-2 rounded-lg border bg-card px-5 py-4 text-rose-600 hover:bg-rose-500/10 disabled:pointer-events-none disabled:opacity-50"
            >
              <Trash className="size-4" />
              <p className="text-sm font-semibold">Delete channel</p>
            </button>
          )}
        </div>
      </ResponsiveModal>
    </div>
  );
};
