"use client";

import { format } from "date-fns";
import {
  AlignLeft,
  Archive,
  Calendar,
  ExternalLink,
  FileText,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAtom } from "jotai";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { selectedTodoCardAtom, todoViewModeAtom } from "@/lib/panel-atoms";

import type { Id } from "../../../../convex/_generated/dataModel";

export const CardDetailPanel = () => {
  const [card, setCard] = useAtom(selectedTodoCardAtom);

  if (!card) return null;

  return <CardDetailPanelInner card={card} onClose={() => setCard(null)} />;
};

interface CardDetailPanelInnerProps {
  card: any;
  onClose: () => void;
}

const CardDetailPanelInner = ({ card, onClose }: CardDetailPanelInnerProps) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState(
    card.dueDate ? format(card.dueDate, "yyyy-MM-dd") : "",
  );
  const [newLabel, setNewLabel] = useState("");
  const [labels, setLabels] = useState(card.labels || []);
  const [, setViewMode] = useAtom(todoViewModeAtom);

  // Reset state when card changes
  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description || "");
    setDueDate(card.dueDate ? format(card.dueDate, "yyyy-MM-dd") : "");
    setLabels(card.labels || []);
  }, [card._id, card.title, card.description, card.dueDate, card.labels]);

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
          onClose();
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
    setLabels(labels.filter((label: string) => label !== labelToRemove));
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
          onClose();
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
            onClose();
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
      <Card className="h-full w-full bg-card border-l border-y-0 border-r-0 border-border flex flex-col rounded-none shadow-none overflow-hidden">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between p-1.5 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground pl-1">
            Card details
          </h2>
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center border rounded-lg overflow-hidden divide-x">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => setViewMode("modal")}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Open as pop-up</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={handleArchive}
                    disabled={isPending}
                  >
                    <Archive className="w-3.5 h-3.5" />
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
                    className="h-7 w-7 rounded-none text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Delete</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={onClose}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Close</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </CardHeader>

        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Title Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="font-medium">Title</span>
                </div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-sm border-muted-foreground/20 shadow-sm bg-transparent rounded-lg"
                  placeholder="Card title..."
                />
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlignLeft className="h-3.5 w-3.5" />
                  <span className="font-medium">Description</span>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="min-h-[100px] text-sm resize-none border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-ring shadow-sm bg-transparent rounded-lg"
                />
              </div>

              {/* <Separator className="opacity-40" /> */}

              {/* Due Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="font-medium">Due date</span>
                </div>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9 text-sm border-muted-foreground/20 shadow-sm bg-transparent rounded-lg"
                />
              </div>

              {/* Labels */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" />
                  <span className="font-medium">Labels</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 min-h-[36px] border border-muted-foreground/20 rounded-lg px-3 py-1.5 shadow-sm bg-transparent">
                  {labels.map((label: string) => (
                    <Badge
                      key={label}
                      variant="secondary"
                      className="px-2 py-0.5 text-xs font-normal gap-1 bg-green-100 text-green-800 hover:bg-green-200 border-0 rounded-md dark:bg-green-900/40 dark:text-green-400"
                    >
                      {label}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLabel(label);
                        }}
                        className="hover:bg-green-300 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
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
                    className="bg-transparent border-0 outline-none text-sm flex-1 min-w-[50px] p-0 h-5 focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>

              {/* <Separator className="opacity-40" /> */}

              {/* Checklists */}
              {checklists && checklists.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">Checklists</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {checklists.length}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {checklists.map((checklist) => (
                      <div
                        key={checklist._id}
                        className="border rounded-lg p-2.5 text-sm"
                      >
                        {checklist.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {comments && comments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">Comments</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {comments.length}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {comments.map((comment) => (
                      <div
                        key={comment._id}
                        className="border rounded-lg p-2.5"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {comment.user?.name || "Unknown User"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(comment.createdAt, "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/80">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-3 space-y-2 mt-auto shrink-0">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isPending || !title.trim()}
                className="flex-1 rounded-lg bg-foreground text-background hover:bg-foreground/90"
              >
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
