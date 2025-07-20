"use client";

import { Check } from "lucide-react";
import type React from "react";
import { toast } from "sonner";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUpdateCard } from "@/features/todos/api/use-update-card";

import type { Id } from "../../../../../convex/_generated/dataModel";

interface TodoTaskCheckboxProps {
  card: {
    _id: Id<"todoCards">;
    isCompleted?: boolean;
  };
  showCheckCircle: boolean;
}

export const TodoTaskCheckbox = ({
  card,
  showCheckCircle,
}: TodoTaskCheckboxProps) => {
  const { mutate: updateCard } = useUpdateCard();

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
              flex-shrink-0 
              w-5 
              h-5 
              rounded-full 
              border-2 
              flex 
              items-center 
              justify-center 
              cursor-pointer 
              transition-all 
              duration-300 
              ease-in-out
              transform
              ${showCheckCircle ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-75 -translate-x-2"}
              ${card.isCompleted ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"}
            `}
            onClick={handleToggleComplete}
          >
            {card.isCompleted && (
              <Check
                className={`
                  h-3 
                  w-3 
                  text-white 
                  transition-all 
                  duration-200 
                  ${card.isCompleted ? "scale-100" : "scale-0"}
                `}
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          {card.isCompleted ? "Mark Incomplete" : "Mark Complete"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
