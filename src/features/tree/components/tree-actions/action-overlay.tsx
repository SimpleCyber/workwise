"use client";

import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";

interface ActionOverlayProps {
  onAdd?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  position?: "top" | "bottom" | "left" | "right";
  isVisible: boolean;
}

export const ActionOverlay = ({
  onAdd,
  onEdit,
  onDelete,
  position = "top",
  isVisible,
}: ActionOverlayProps) => {
  if (!isVisible) return null;

  const positionClasses = {
    top: "-top-12 left-1/2 transform -translate-x-1/2",
    bottom: "-bottom-12 left-1/2 transform -translate-x-1/2",
    left: "-left-12 top-1/2 transform -translate-y-1/2 flex-col",
    right: "-right-12 top-1/2 transform -translate-y-1/2 flex-col",
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} flex gap-1 bg-white rounded-lg shadow-lg p-1 z-[9999]`}
      style={{ zIndex: 9999 }}
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseLeave={(e) => e.stopPropagation()}
    >
      {onAdd && (
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-green-100 rounded text-gray-400 hover:text-green-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          title="Add"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}

      {onEdit && (
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-blue-100 rounded text-gray-400 hover:text-blue-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}

      {onDelete && (
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-red-100 rounded text-gray-400 hover:text-red-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Simplified hook to manage hover state
export const useHoverActions = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const hoverProps = {
    onMouseEnter: () => {
      console.log("Mouse entered"); // Debug log
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      setIsHovered(true);
    },
    onMouseLeave: () => {
      console.log("Mouse left"); // Debug log
      const id = setTimeout(() => {
        setIsHovered(false);
      }, 100); // Small delay to allow moving to overlay
      setTimeoutId(id);
    },
  };

  return { isHovered, hoverProps };
};
