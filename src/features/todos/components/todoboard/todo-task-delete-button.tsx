"use client";

import { Trash2 } from "lucide-react";
import type React from "react";
import { toast } from "sonner";

import { useDeleteCard } from "@/features/todos/api/use-delete-card";

import type { Id } from "../../../../../convex/_generated/dataModel";

interface TodoTaskDeleteButtonProps {
  cardId: Id<"todoCards">;
}

export const TodoTaskDeleteButton = ({ cardId }: TodoTaskDeleteButtonProps) => {
  const { mutate: deleteCard, isPending: isDeleting } = useDeleteCard();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        "Are you sure you want to delete this card? This action cannot be undone.",
      )
    ) {
      deleteCard(
        { cardId },
        {
          onSuccess: () => {
            toast.success("Card deleted successfully");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to delete card");
          },
        },
      );
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="
        p-1 
        rounded 
        hover:bg-red-100 
        transition-colors 
        duration-200 
        text-gray-400 
        hover:text-red-600
        disabled:opacity-50
      "
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
};
