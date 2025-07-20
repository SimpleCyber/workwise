"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreateList } from "@/features/todos/api/use-create-list";

import type { Id } from "../../../../../convex/_generated/dataModel";

interface TodoAddListProps {
  boardId: Id<"todoBoards">;
}

export const TodoAddList = ({ boardId }: TodoAddListProps) => {
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");

  const { mutate: createList, isPending: isCreatingList } = useCreateList();

  const handleCreateList = () => {
    if (!newListName.trim()) return;

    createList(
      {
        name: newListName.trim(),
        boardId,
      },
      {
        onSuccess: () => {
          setNewListName("");
          setIsAddingList(false);
          toast.success("List created successfully!");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create list");
        },
      },
    );
  };

  const handleCancel = () => {
    setIsAddingList(false);
    setNewListName("");
  };

  return (
    <div className="flex-shrink-0 w-72">
      {isAddingList ? (
        <Card>
          <CardContent className="p-3">
            <Input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Enter list title..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateList();
                } else if (e.key === "Escape") {
                  handleCancel();
                }
              }}
              autoFocus
              disabled={isCreatingList}
            />
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                onClick={handleCreateList}
                disabled={!newListName.trim() || isCreatingList}
              >
                Add List
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isCreatingList}
              >
                <X className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="ghost"
          className="w-full h-12 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50"
          onClick={() => setIsAddingList(true)}
        >
          <Plus className="size-4 mr-2" />
          Add a list
        </Button>
      )}
    </div>
  );
};
