"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ActionOverlayProps {
  onAdd?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onMore?: () => void
  position?: "top" | "bottom" | "left" | "right"
  className?: string
  isVisible: boolean
}

export const ActionOverlay = ({
  onAdd,
  onEdit,
  onDelete,
  onMore,
  position = "top",
  className = "",
}: ActionOverlayProps) => {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: "-top-12 left-1/2 transform -translate-x-1/2",
    bottom: "-bottom-12 left-1/2 transform -translate-x-1/2",
    left: "-left-12 top-1/2 transform -translate-y-1/2 flex-col",
    right: "-right-12 top-1/2 transform -translate-y-1/2 flex-col",
  }

  return (
    <div
      className={`absolute ${positionClasses[position]} flex gap-1 bg-white border rounded-lg shadow-lg p-1 z-50 transition-all duration-200 ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      } ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <TooltipProvider>
        {onAdd && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                onClick={(e) => {
                  e.stopPropagation()
                  onAdd()
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add</TooltipContent>
          </Tooltip>
        )}

        {onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
        )}

        {onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        )}

        {onMore && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onMore()
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More</TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  )
}

// Hook to manage hover state
export const useHoverActions = () => {
  const [isHovered, setIsHovered] = useState(false)

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  }

  return { isHovered, hoverProps }
}
