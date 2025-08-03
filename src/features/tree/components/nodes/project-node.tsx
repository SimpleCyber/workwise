"use client"

import { useState } from "react"
import { Goal, ExternalLink } from "lucide-react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ActionOverlay, useHoverActions } from "../tree-actions/action-overlay"
import { CreateListModal } from "../tree-actions/create-list-modal"
import { EditProjectModal } from "../tree-actions/edit-project-modal"
import { DeleteConfirmationModal } from "../tree-actions/delete-confirmation-modal"
import { useRemoveProjectBoard } from "../../../projects/api/use-remove-project-board"

export const ProjectNode = ({ data }: NodeProps) => {
  const { isHovered, hoverProps } = useHoverActions()
  const [showCreateList, setShowCreateList] = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)
  const [showDeleteProject, setShowDeleteProject] = useState(false)

  const { mutate: deleteProject, isPending: isDeleting } = useRemoveProjectBoard()

  const handleDeleteProject = async () => {
    try {
      await deleteProject({ boardId: data.projectId })
      setShowDeleteProject(false)
    } catch (error) {
      console.error("Failed to delete project:", error)
    }
  }

  return (
    <div className="relative" {...hoverProps}>
      <div className="flex flex-col items-center">
        <Card
          className={`shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 border-green-200 ${
            data.isListsExpanded ? "w-20 h-20 animate-pulse" : "w-16 h-16"
          } ${data.isActive ? "ring-2 ring-green-500" : ""} relative`}
          onClick={() => data.onToggleLists?.(data.projectId)}
        >
          <CardContent className="flex items-center justify-center h-full p-2">
            {!data.isListsExpanded ? (
              <div className="flex items-center justify-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded ${
                    data.isActive ? "bg-green-200" : "bg-green-100"
                  }`}
                >
                  <Goal className="w-5 h-5 text-green-600" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <div className="animate-bounce">
                  <div className="flex items-center justify-center w-8 h-8 rounded bg-green-100 animate-flicker-bg">
                    <Goal className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>
            )}

            <Handle
              type="target"
              position={data.isHorizontal ? Position.Left : Position.Top}
              className="w-3 h-3"
              style={{
                left: data.isHorizontal ? "-6px" : "50%",
                top: data.isHorizontal ? "50%" : "-6px",
                transform: data.isHorizontal ? "translateY(-50%)" : "translateX(-50%)",
              }}
            />
            <Handle
              type="source"
              position={data.isHorizontal ? Position.Right : Position.Bottom}
              className="w-3 h-3"
              style={{
                right: data.isHorizontal ? "-6px" : "auto",
                left: data.isHorizontal ? "auto" : "50%",
                bottom: data.isHorizontal ? "auto" : "-6px",
                top: data.isHorizontal ? "50%" : "auto",
                transform: data.isHorizontal ? "translateY(-50%)" : "translateX(-50%)",
              }}
            />
          </CardContent>
        </Card>

        <div className="mt-2 text-center">
          <p className="text-xs font-medium text-gray-700">{data.name}</p>
          <div className="flex flex-col items-center gap-1 mt-1">
            <Badge variant="outline" className="text-xs font-mono">
              {data.boardCode}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {data.totalTasks} tasks
            </Badge>
            {data.isListsExpanded && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  data.onProjectClick(data.projectId)
                }}
                className="text-xs mt-1"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Open
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Action Overlay */}
      {isHovered && (
        <ActionOverlay
          onAdd={() => setShowCreateList(true)}
          onEdit={() => setShowEditProject(true)}
          onDelete={() => setShowDeleteProject(true)}
          position={data.isHorizontal ? "right" : "bottom"}
          isVisible={isHovered}
        />
      )}

      {/* Modals */}
      <CreateListModal isOpen={showCreateList} onClose={() => setShowCreateList(false)} boardId={data.projectId} />

      <EditProjectModal
        isOpen={showEditProject}
        onClose={() => setShowEditProject(false)}
        boardId={data.projectId}
        initialData={{
          name: data.name,
          description: data.description,
          background: data.background,
        }}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteProject}
        onClose={() => setShowDeleteProject(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone and will delete all lists and tasks within this project:"
        itemName={data.name}
        isLoading={isDeleting}
      />

      <style jsx>{`
        @keyframes flicker-bg {
          0%, 100% {
            background-color: rgb(220 252 231);
          }
          25% {
            background-color: rgb(187 247 208);
          }
          50% {
            background-color: rgb(134 239 172);
          }
          75% {
            background-color: rgb(187 247 208);
          }
        }
        
        .animate-flicker-bg {
          animation: flicker-bg 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
