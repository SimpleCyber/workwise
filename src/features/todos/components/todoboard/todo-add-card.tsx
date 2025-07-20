"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateCard } from "@/features/todos/api/use-create-card";

import type { Id } from "../../../../../convex/_generated/dataModel";

interface TodoAddCardProps {
  listId: Id<"todoLists">;
  isAddingCard: boolean;
  setIsAddingCard: (isAdding: boolean) => void;
}

export const TodoAddCard = ({
  listId,
  isAddingCard,
  setIsAddingCard,
}: TodoAddCardProps) => {
  const [newCardTitle, setNewCardTitle] = useState("");
  const { mutate: createCard, isPending: isCreatingCard } = useCreateCard();

  const handleCreateCard = () => {
    if (!newCardTitle.trim()) return;

    createCard(
      {
        title: newCardTitle.trim(),
        listId,
      },
      {
        onSuccess: () => {
          setNewCardTitle("");
          setIsAddingCard(false);
          toast.success("Card created successfully!");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create card");
        },
      },
    );
  };

  const handleCancel = () => {
    setIsAddingCard(false);
    setNewCardTitle("");
  };

  if (isAddingCard) {
    return (
      <div className="space-y-2">
        <Input
          value={newCardTitle}
          onChange={(e) => setNewCardTitle(e.target.value)}
          placeholder="Enter a title for this card..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCreateCard();
            } else if (e.key === "Escape") {
              handleCancel();
            }
          }}
          autoFocus
          disabled={isCreatingCard}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleCreateCard}
            disabled={!newCardTitle.trim() || isCreatingCard}
          >
            Add card
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isCreatingCard}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start text-muted-foreground hover:text-foreground"
      onClick={() => setIsAddingCard(true)}
    >
      <Plus className="size-4 mr-2" />
      Add a card
    </Button>
  );
};
