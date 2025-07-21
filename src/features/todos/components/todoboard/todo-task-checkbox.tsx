"use client";

import { Check } from "lucide-react";
import type React from "react";
import { useState } from "react";
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
  const [showAnimation, setShowAnimation] = useState(false);

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Trigger animation when marking as complete
    if (!card.isCompleted) {
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 1000);
    }

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
          <div className="relative flex-shrink-0">
            {/* Animated Lines */}
            {showAnimation && (
              <div className="absolute inset-0 pointer-events-none w-4 h-4">
                {/* Top line */}
                <div className="absolute -top-3 left-1/2 w-0.5 h-2 bg-green-400 -translate-x-0.5 animate-line-fade" />

                {/* Bottom line */}
                <div className="absolute -bottom-3 left-1/2 w-0.5 h-2 bg-green-400 -translate-x-0.5 animate-line-fade" />

                {/* Left line */}
                <div className="absolute -left-3 top-1/2 h-0.5 w-2 bg-green-400 -translate-y-0.5 animate-line-fade" />

                {/* Right line */}
                <div className="absolute -right-3 top-1/2 h-0.5 w-2 bg-green-400 -translate-y-0.5 animate-line-fade" />
              </div>
            )}

            {/* Main Checkbox Circle */}
            <div
              className={`
                w-4
                h-4
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
                mr-1
                ${showCheckCircle ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-75 -translate-x-2"}
                ${card.isCompleted ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"}
                ${showAnimation ? "scale-110" : ""}
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
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          {card.isCompleted ? "Mark Incomplete" : "Mark Complete"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
