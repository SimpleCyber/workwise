"use client"

import { Goal , ExternalLink } from "lucide-react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const ProjectNode = ({ data }: NodeProps) => {
  const handleNodeClick = () => {
    // Toggle this node and close others
    data.onToggleLists?.(data.projectId)
  }

  return (
    <div className="flex flex-col items-center">
      <Card
        className={`shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 border-green-200 ${
          data.isListsExpanded ? 'w-20 h-20 animate-pulse' : 'w-16 h-16'
        } relative`}
        onClick={handleNodeClick}
      >
        <CardContent className="flex items-center justify-center h-full p-2">
          {!data.isListsExpanded ? (
            // Collapsed state - only show icon
            <div className="flex items-center justify-center">
              <div className="flex items-center justify-center w-8 h-8 rounded bg-green-100">
                <Goal  className="w-5 h-5 text-green-600" />
              </div>
            </div>
          ) : (
            // Expanded state - show animated icon only
            <div className="flex items-center justify-center">
              <div className="animate-bounce">
                <div className="flex items-center justify-center w-8 h-8 rounded bg-green-100 animate-flicker-bg">
                  <Goal  className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
          )}
          
          {/* Centered handles for both states */}
          <Handle 
            type="target" 
            position={data.isHorizontal ? Position.Left : Position.Top} 
            className="w-3 h-3"
            style={{
              left: data.isHorizontal ? '-6px' : '50%',
              top: data.isHorizontal ? '50%' : '-6px',
              transform: data.isHorizontal ? 'translateY(-50%)' : 'translateX(-50%)'
            }}
          />
          <Handle 
            type="source" 
            position={data.isHorizontal ? Position.Right : Position.Bottom} 
            className="w-3 h-3"
            style={{
              right: data.isHorizontal ? '-6px' : 'auto',
              left: data.isHorizontal ? 'auto' : '50%',
              bottom: data.isHorizontal ? 'auto' : '-6px',
              top: data.isHorizontal ? '50%' : 'auto',
              transform: data.isHorizontal ? 'translateY(-50%)' : 'translateX(-50%)'
            }}
          />
        </CardContent>
      </Card>
      
      {/* Project info below the box for both selected and unselected nodes */}
      <div className="mt-2 text-center">
        <p className="text-xs font-medium text-gray-700">{data.name}</p>
        <div className="flex flex-col items-center gap-1 mt-1">
          <Badge variant="outline" className="text-xs font-mono">
            {data.boardCode}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {data.totalTasks} tasks
          </Badge>
          {/* Open button for expanded nodes */}
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
      
      <style jsx>{`
        @keyframes flicker-bg {
          0%, 100% {
            background-color: rgb(220 252 231); /* bg-green-100 */
          }
          25% {
            background-color: rgb(187 247 208); /* bg-green-200 */
          }
          50% {
            background-color: rgb(134 239 172); /* bg-green-300 */
          }
          75% {
            background-color: rgb(187 247 208); /* bg-green-200 */
          }
        }
        
        .animate-flicker-bg {
          animation: flicker-bg 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}