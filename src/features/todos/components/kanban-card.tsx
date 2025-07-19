"use client";

import { format } from "date-fns";
import {
  Calendar,
  Check,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDeleteCard } from "@/features/todos/api/use-delete-card";
import { useUpdateCard } from "@/features/todos/api/use-update-card";

import type { Id } from "../../../../convex/_generated/dataModel";
import { CardDetailModal } from "./card-detail-modal";

interface KanbanCardProps {
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
}

const labelColors = [
  "bg-green-500",
  "bg-yellow-500", 
  "bg-orange-500",
  "bg-red-500",
  "bg-purple-500",
  "bg-blue-500",
  "bg-sky-500",
  "bg-pink-500",
  "bg-lime-500",
];

export const KanbanCard = ({ card }: KanbanCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLabelsHovered, setIsLabelsHovered] = useState(false);
  const { mutate: updateCard } = useUpdateCard();
  const { mutate: deleteCard, isPending: isDeleting } = useDeleteCard();

  const isDueSoon =
    card.dueDate && card.dueDate < Date.now() + 24 * 60 * 60 * 1000;
  const isOverdue = card.dueDate && card.dueDate < Date.now();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        "Are you sure you want to delete this card? This action cannot be undone.",
      )
    ) {
      deleteCard(
        { cardId: card._id },
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

  const showCheckCircle = card.isCompleted || isHovered;

  return (
    <>
      <Card
        className="cursor-pointer hover:bg-slate-50 transition-all duration-200 ease-in-out bg-white border-0 shadow-sm hover:shadow-md rounded-lg mb-2"
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-3">
          {/* Check Circle and Header */}
          <div className="flex items-start gap-2 mb-2">
            {/* Check Circle with Animation */}
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
                      ${showCheckCircle 
                        ? 'opacity-100 scale-100 translate-x-0' 
                        : 'opacity-0 scale-75 -translate-x-2'
                      }
                      ${card.isCompleted 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300 hover:border-green-400'
                      }
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
                          ${card.isCompleted ? 'scale-100' : 'scale-0'}
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

            {/* Title */}
            <h4 
              className={`
                text-sm 
                font-medium 
                leading-5 
                text-gray-800 
                flex-1 
                transition-all 
                duration-300 
                ease-in-out
                ${showCheckCircle ? 'ml-0' : '-ml-7'}
              `}
            >
              {card.title}
            </h4>
          </div>

          {/* Description */}
          {card.description && (
            <div 
              className={`
                transition-all 
                duration-300 
                ease-in-out
                ${showCheckCircle ? 'ml-7' : 'ml-0'}
              `}
            >
              <p className="text-xs text-gray-600 leading-4 line-clamp-3 mb-3">
                {card.description}
              </p>
            </div>
          )}

          {/* Bottom Row: Label, Date + Delete */}
          <div 
            className={`
              flex 
              items-center 
              justify-between 
              mt-3 
              transition-all 
              duration-300 
              ease-in-out
              ${showCheckCircle ? 'ml-7' : 'ml-0'}
            `}
          >
            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
              <div className="relative">
                <div
                  className="flex items-center gap-1"
                  onMouseEnter={() => setIsLabelsHovered(true)}
                  onMouseLeave={() => setIsLabelsHovered(false)}
                >

                  
                  <div
                    className={`
                      border-2                      rounded-sm 
                      px-2
                      text-xs 
                      font-medium 
                      ${labelColors[0]} 
                      text-white 
                      border-transparent
                    `}
                    title={card.labels[0]}
                  >
                    {card.labels[0]}
                  </div>


                  {card.labels.length > 1 && (
                    <span className="text-xs text-gray-500 font-medium cursor-pointer">
                      +{card.labels.length - 1}
                    </span>
                  )}
                </div>

                {/* Additional Labels Tooltip */}
                {isLabelsHovered && card.labels.length > 1 && (
                  <div className="absolute top-full left-0 mt-1 bg-black text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap">
                    {card.labels.slice(1).join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Date and Delete together */}
            <div className="flex items-center gap-2">
              {/* Due Date */}
              {card.dueDate && (
                <div className={`
                  flex 
                  items-center 
                  gap-1 
                  px-2 
                  py-1 
                  rounded 
                  text-xs 
                  font-medium
                  ${isOverdue 
                    ? 'bg-red-100 text-red-700' 
                    : isDueSoon 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-gray-100 text-gray-700'
                  }
                `}>
                  <Calendar className="h-3 w-3" />
                  <span>{format(card.dueDate, "MMM d")}</span>
                </div>
              )}

              {/* Delete Icon */}
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
            </div>
          </div>
        </CardContent>
      </Card>

      <CardDetailModal
        card={card}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
};