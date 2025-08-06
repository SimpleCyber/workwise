// components/Tooltip.tsx
import React from "react";

export type Direction = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  text: string;
  direction: Direction;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, direction }) => {
  const positionStyles: Record<Direction, string> = {
    top: "bottom-full mb-1 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-1 left-1/2 -translate-x-1/2",
    left: "right-full mr-1 top-1/2 -translate-y-1/2",
    right: "left-full ml-1 top-1/2 -translate-y-1/2",
  };

  const arrowStyles: Record<Direction, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-300",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-300",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-300",
    right: "right-full top-1/2 -translate-y-1/2 border-r-gray-300",
  };

  return (
    <div
      className={`absolute ${positionStyles[direction]} hidden group-hover:block z-50`}
    >
      <div className="relative whitespace-nowrap rounded-md bg-gray-300 px-2 py-1 text-xs text-black shadow-lg border border-gray-700">
        {text}
        <div
          className={`absolute w-0 h-0 border-4 border-transparent ${arrowStyles[direction]}`}
        />
      </div>
    </div>
  );
};
