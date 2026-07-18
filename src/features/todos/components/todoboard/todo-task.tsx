"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { useSetAtom } from "jotai";

import { Card, CardContent } from "@/components/ui/card";
import { useUpdateCard } from "@/features/todos/api/use-update-card";
import { selectedTodoCardAtom } from "@/lib/panel-atoms";

import type { Id } from "../../../../../convex/_generated/dataModel";
import { TodoTaskCheckbox } from "./todo-task-checkbox";
import { TodoTaskDeleteButton } from "./todo-task-delete-button";
import { TodoTaskDueDate } from "./todo-task-due-date";
import { TodoTaskLabels } from "./todo-task-labels";

interface TodoTaskProps {
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

export const TodoTask = ({ card }: TodoTaskProps) => {
  const setSelectedCard = useSetAtom(selectedTodoCardAtom);
  const [isHovered, setIsHovered] = useState(false);
  const { mutate: updateCard } = useUpdateCard();

  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionTimeRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );

  const triggerInteraction = (e: React.SyntheticEvent) => {
    const now = Date.now();
    // Prevent double firing if both onTouchEnd and onClick are triggered within 50ms
    if (now - lastInteractionTimeRef.current < 50) return;
    lastInteractionTimeRef.current = now;

    if (tapTimeoutRef.current) {
      // It's a double tap/click
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
      handleDoubleClick(e);
    } else {
      // It's a single tap/click, wait to see if it becomes a double tap
      tapTimeoutRef.current = setTimeout(() => {
        setSelectedCard(card);
        tapTimeoutRef.current = null;
      }, 250);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const now = Date.now();
    const dx = Math.abs(e.changedTouches[0].clientX - touchStartRef.current.x);
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
    const dt = now - touchStartRef.current.time;

    // If moved more than 10px or took longer than 250ms, it was probably a scroll or drag
    if (dx > 10 || dy > 10 || dt > 250) {
      touchStartRef.current = null;
      return;
    }

    touchStartRef.current = null;
    triggerInteraction(e);
  };

  const handleDoubleClick = (e: React.SyntheticEvent) => {
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

  const linkifyText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.split(urlRegex).map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline break-all font-bold"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const showCheckCircle = card.isCompleted || isHovered;

  return (
    <Card
      className="cursor-pointer hover:bg-accent transition-all duration-200 ease-in-out bg-card border-0 shadow-sm hover:shadow-md rounded-lg mb-2"
      onClick={triggerInteraction}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-3">
        {/* Check Circle and Header */}
        <div className="flex items-start gap-2 mb-1">
          <TodoTaskCheckbox card={card} showCheckCircle={showCheckCircle} />

          {/* Title */}
          <h4
            className={`
        text-sm 
        font-medium 
        leading-5 
        text-foreground 
        flex-1 
        transition-all 
        duration-300 
        ease-in-out
        ${showCheckCircle ? "ml-0" : "-ml-7"}
      `}
          >
            {linkifyText(card.title)}
          </h4>
        </div>

        {/* Description */}
        {card.description && (
          <div
            className={`
        transition-all 
        duration-300 
        ease-in-out
        ${showCheckCircle ? "ml-7" : "ml-0"}
      `}
          >
            <p className="text-xs text-muted-foreground leading-4 line-clamp-3 mb-3">
              {linkifyText(card.description)}
            </p>
          </div>
        )}

        {/* Bottom Row */}
        <div
          className={`
      flex 
      items-center 
      justify-between 
      mt-3 
      transition-all 
      duration-300 
      ease-in-out
      ${showCheckCircle ? "ml-7" : "ml-0"}
    `}
        >
          <TodoTaskLabels labels={card.labels} />

          <div className="flex items-center gap-2">
            <TodoTaskDueDate dueDate={card.dueDate} />
            {isHovered && <TodoTaskDeleteButton cardId={card._id} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
