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
  CheckSquare,
  ChevronDown,
  Plus,
  PanelRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAtom } from "jotai";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  const [isCompleted, setIsCompleted] = useState(card.isCompleted || false);
  const [newLabel, setNewLabel] = useState("");
  const [labels, setLabels] = useState(card.labels || []);
  const [, setViewMode] = useAtom(todoViewModeAtom);

  // Reset state when card changes
  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description || "");
    setDueDate(card.dueDate ? format(card.dueDate, "yyyy-MM-dd") : "");
    setIsCompleted(card.isCompleted || false);
    setLabels(card.labels || []);
  }, [
    card._id,
    card.title,
    card.description,
    card.dueDate,
    card.isCompleted,
    card.labels,
  ]);

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

  const [, setCard] = useAtom(selectedTodoCardAtom);

  const handleToggleComplete = () => {
    const newIsCompleted = !isCompleted;
    setIsCompleted(newIsCompleted); // optimistic UI update

    updateCard(
      {
        cardId: card._id,
        isCompleted: newIsCompleted,
      },
      {
        onSuccess: () => {
          setCard({ ...card, isCompleted: newIsCompleted });
          toast.success(
            !newIsCompleted
              ? "Card marked as incomplete"
              : "Card marked as complete",
          );
        },
        onError: (error) => {
          setIsCompleted(!newIsCompleted); // revert optimistic update
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
      <Card className="h-full w-full bg-background border-l border-y-0 border-r-0 border-border flex flex-col rounded-none shadow-none overflow-hidden">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between p-6 pb-2 border-b-0 shrink-0 space-y-0">
          <h2 className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase">
            Todo Card
          </h2>
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-md text-muted-foreground shadow-sm"
                    onClick={() => setViewMode("modal")}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Open as pop-up</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-md text-muted-foreground shadow-sm"
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
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-md text-destructive/70 hover:text-destructive hover:bg-destructive/10 shadow-sm"
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground ml-1"
                    onClick={onClose}
                  >
                    <X className="w-5 h-5" />
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
            <div className="px-6 space-y-6 pb-20">
              {/* Title Section */}
              <div className="pt-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-auto text-2xl font-bold border-0 px-0 shadow-none focus-visible:ring-0 rounded-none bg-transparent"
                  placeholder="Card title..."
                />
              </div>

              <Separator className="opacity-50" />

              {/* Properties Section */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase mb-4">
                  Properties
                </h3>

                <div className="grid grid-cols-[100px_1fr] items-center gap-y-5">
                  {/* Status row */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlignLeft className="w-4 h-4" />
                    <span>Status</span>
                  </div>
                  <div>
                    <Button
                      variant="ghost"
                      onClick={handleToggleComplete}
                      disabled={isPending}
                      className={`h-7 px-3 py-1 text-xs font-normal border-0 rounded-full flex items-center gap-1.5 hover:opacity-80 transition-opacity ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted && <CheckSquare className="w-3.5 h-3.5" />}
                      {isCompleted ? "Complete" : "Incomplete"}
                      <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />
                    </Button>
                  </div>

                  {/* Due Date row */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Due date</span>
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-7 w-auto min-w-[120px] text-sm border-0 shadow-none bg-transparent hover:bg-muted/50 px-2 py-1 rounded focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  {/* Labels row */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground self-start mt-1">
                    <Tag className="w-4 h-4" />
                    <span>Labels</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {labels.map((label: string) => (
                      <Badge
                        key={label}
                        variant="secondary"
                        className="px-2.5 py-1 text-xs font-normal gap-1.5 bg-emerald-100/70 text-emerald-800 hover:bg-emerald-200 border-0 rounded-md dark:bg-emerald-900/40 dark:text-emerald-400"
                      >
                        {label}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveLabel(label);
                          }}
                          className="hover:bg-emerald-300 dark:hover:bg-emerald-800 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddLabel();
                        }}
                        placeholder="Add label..."
                        className="bg-transparent border-b border-transparent hover:border-muted-foreground/30 focus:border-ring outline-none text-sm w-[90px] p-1 transition-colors"
                      />
                      <button
                        onClick={handleAddLabel}
                        disabled={!newLabel.trim()}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-40 p-1"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="opacity-20" />

              {/* Description Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <AlignLeft className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Description</span>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="min-h-[140px] text-sm resize-none border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-ring shadow-sm bg-transparent rounded-lg"
                />
              </div>

              {/* Timestamp */}
              <div className="pt-6">
                <p className="text-[11px] text-muted-foreground">
                  Created {format(card.createdAt, "MMM d, yyyy")}
                </p>
              </div>

              {/* Checklists (if any) */}
              {checklists && checklists.length > 0 && (
                <div className="space-y-2 pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Checklists</span>
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
                        className="border rounded-lg p-3 text-sm"
                      >
                        {checklist.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments (if any) */}
              {comments && comments.length > 0 && (
                <div className="space-y-2 pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Comments</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {comments.length}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {comments.map((comment) => (
                      <div key={comment._id} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">
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

          {/* Footer (Save actions) */}
          <div className="p-3 bg-background border-t space-y-2 mt-auto shrink-0 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
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
