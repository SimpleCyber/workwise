"use client";

import { useState } from "react";

interface TodoTaskLabelsProps {
  labels?: string[];
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

export const TodoTaskLabels = ({ labels }: TodoTaskLabelsProps) => {
  const [isLabelsHovered, setIsLabelsHovered] = useState(false);

  if (!labels || labels.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div
        className="flex items-center gap-1"
        onMouseEnter={() => setIsLabelsHovered(true)}
        onMouseLeave={() => setIsLabelsHovered(false)}
      >
        <div
          className={`
            border-2
            rounded-sm 
            px-2
            text-xs 
            font-medium 
            ${labelColors[0]} 
            text-white 
            border-transparent
          `}
          title={labels[0]}
        >
          {labels[0]}
        </div>
        {labels.length > 1 && (
          <span className="text-xs text-gray-500 font-medium cursor-pointer">
            +{labels.length - 1}
          </span>
        )}
      </div>
      {/* Additional Labels Tooltip */}
      {isLabelsHovered && labels.length > 1 && (
        <div className="absolute top-full left-0 mt-1 bg-black text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap">
          {labels.slice(1).join(", ")}
        </div>
      )}
    </div>
  );
};
