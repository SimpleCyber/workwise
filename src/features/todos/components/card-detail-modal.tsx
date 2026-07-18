"use client";

import { format } from "date-fns";
import {
  Archive,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  PanelRight,
  FileText,
  AlignLeft,
  Trash2,
  Plus,
  Tag,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAtom } from "jotai";

import { todoViewModeAtom } from "@/lib/panel-atoms";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ResponsiveModal, ModalClose } from "@/components/responsive-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDeleteCard } from "@/features/todos/api/use-delete-card";
import { useGetChecklists } from "@/features/todos/api/use-get-checklists";
import { useGetComments } from "@/features/todos/api/use-get-comments";
import { useUpdateCard } from "@/features/todos/api/use-update-card";
import { useConfirm } from "@/hooks/use-confirm";

import type { Id } from "../../../../convex/_generated/dataModel";

interface CardDetailModalProps {
  card: {
    _id: Id<"todoCards">;
    title: string;
    description?: string;
    listId: Id<"todoLists">;
    boardId: Id<"todoBoards">;
    memberId: Id<"members">;
    workspaceId: Id<"workspaces">;
    position: number;
    dueDate?: number;
    isCompleted?: boolean;
    isArchived?: boolean;
    labels?: string[];
    attachments?: Id<"_storage">[];
    createdAt: number;
    updatedAt: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CardDetailModal = ({
  card,
  open,
  onOpenChange,
}: CardDetailModalProps) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState(
    card.dueDate ? format(card.dueDate, "yyyy-MM-dd") : "",
  );
  const [newLabel, setNewLabel] = useState("");
  const [labels, setLabels] = useState(card.labels || []);

  const [, setViewMode] = useAtom(todoViewModeAtom);

  // Sync state if card prop changes
  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description || "");
    setDueDate(card.dueDate ? format(card.dueDate, "yyyy-MM-dd") : "");
    setLabels(card.labels || []);
  }, [card]);

  // Collapsible states
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [isLabelsOpen, setIsLabelsOpen] = useState(!!card.labels?.length);
  const [isChecklistsOpen, setIsChecklistsOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const { mutate: updateCard, isPending } = useUpdateCard();
  const { mutate: deleteCard, isPending: isDeleting } = useDeleteCard();
  const { data: checklists } = useGetChecklists({ cardId: card._id });
  const { data: comments } = useGetComments({ cardId: card._id });

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "This action cannot be undone.",
  );

  const handleSave = () => {
    updateCard(
      {
        cardId: card._id,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        labels: labels.length > 0 ? labels : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Card updated successfully!");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update card");
        },
      },
    );
  };

  const handleAddLabel = () => {
    if (!newLabel.trim() || labels.includes(newLabel.trim())) return;
    setLabels([...labels, newLabel.trim()]);
    setNewLabel("");
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter((label) => label !== labelToRemove));
  };

  const handleToggleComplete = () => {
    updateCard(
      {
        cardId: card._id,
        isCompleted: !card.isCompleted,
      },
      {
        onSuccess: () => {
          toast.success(
            card.isCompleted
              ? "Card marked as incomplete"
              : "Card marked as complete",
          );
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update card");
        },
      },
    );
  };

  const handleArchive = () => {
    updateCard(
      {
        cardId: card._id,
        isArchived: true,
      },
      {
        onSuccess: () => {
          toast.success("Card archived successfully");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to archive card");
        },
      },
    );
  };

  const handleDelete = async () => {
    const ok = await confirm();

    if (ok) {
      deleteCard(
        { cardId: card._id },
        {
          onSuccess: () => {
            toast.success("Card deleted successfully");
            onOpenChange(false);
          },
          onError: (error) => {
            toast.error(error.message || "Failed to delete card");
          },
        },
      );
    }
  };

  return (
    <>
      <ConfirmDialog />
      <ResponsiveModal
        open={open}
        onOpenChange={onOpenChange}
        hideClose
        className="sm:max-w-2xl xl:max-w-2xl px-6 py-2 border-0 shadow-xl rounded-2xl"
      >
        <div className="flex flex-col h-full space-y-5 pt-1">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground">
                Card details
              </h2>
            </div>
            <TooltipProvider delayDuration={200}>
              <div className="flex items-center border rounded-lg overflow-hidden divide-x">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={() => setViewMode("panel")}
                    >
                      <PanelRight className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Dock to sidebar</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={handleArchive}
                      disabled={isPending}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Archive</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Delete</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          {/* Title Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Title</span>
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 text-sm border-muted-foreground/20 shadow-sm bg-transparent rounded-lg"
              placeholder="Card title..."
            />
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlignLeft className="h-4 w-4" />
              <span className="font-medium">Description</span>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="min-h-[120px] text-sm resize-none border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-ring shadow-sm bg-transparent rounded-lg"
            />
          </div>

          {/* <Separator className="opacity-40" /> */}

          {/* Due Date & Labels */}
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Due Date */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Due date</span>
              </div>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 text-sm border-muted-foreground/20 shadow-sm bg-transparent rounded-lg"
              />
            </div>

            {/* Labels */}
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span className="font-medium">Labels</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 min-h-[40px] border border-muted-foreground/20 rounded-lg px-3 py-1.5 shadow-sm bg-transparent">
                {labels.map((label: string) => (
                  <Badge
                    key={label}
                    variant="secondary"
                    className="px-2.5 py-0.5 text-xs font-normal gap-1.5 bg-green-100 text-green-800 hover:bg-green-200 border-0 rounded-md dark:bg-green-900/40 dark:text-green-400"
                  >
                    {label}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLabel(label);
                      }}
                      className="hover:bg-green-300 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddLabel();
                  }}
                  placeholder={
                    labels.length === 0 ? "Add a label..." : "Add..."
                  }
                  className="bg-transparent border-0 outline-none text-sm flex-1 min-w-[60px] p-0 h-6 focus:ring-0 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* <Separator className="opacity-40" /> */}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <Button
              variant="outline"
              className="px-6 rounded-lg"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="px-6 rounded-lg bg-foreground text-background hover:bg-foreground/90"
              onClick={handleSave}
              disabled={isPending || !title.trim()}
            >
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
};
