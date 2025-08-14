"use client";

import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface NodeActionsProps {
  isVisible: boolean;
  onAddChild: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function NodeActions({
  isVisible,
  onAddChild,
  onDelete,
  canDelete,
}: NodeActionsProps) {
  return (
    <div
      className={`absolute left-full ml-3 flex flex-col gap-1 transition-all duration-200 ${
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
      }`}
    >
      <Button
        size="sm"
        variant="outline"
        onClick={onAddChild}
        className="h-8 w-8 p-0 bg-white hover:bg-blue-50 border-blue-200"
        title="Add Child"
      >
        <Plus className="w-4 h-4 text-blue-600" />
      </Button>

      {canDelete && (
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          className="h-8 w-8 p-0 bg-white hover:bg-red-50 border-red-200"
          title="Delete Node"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </Button>
      )}
    </div>
  );
}
