"use client";

import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";

import type { Id } from "../../../../../convex/_generated/dataModel";
import { CardDetailModal } from "../card-detail-modal";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
    <>
      <Card
        className="cursor-pointer hover:bg-slate-50 transition-all duration-200 ease-in-out bg-white border-0 shadow-sm hover:shadow-md rounded-lg mb-2"
        onClick={() => setIsModalOpen(true)}
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
        text-gray-800 
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
              <p className="text-xs text-gray-600 leading-4 line-clamp-3 mb-3">
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

      <CardDetailModal
        card={card}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
};
