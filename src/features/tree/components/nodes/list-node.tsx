"use client"

import { ClipboardList , ClipboardCheck , Clock, ClipboardX , Eye } from "lucide-react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Card, CardContent } from "@/components/ui/card"
import { getListIcon, getListColor } from "../../api/tree-utils"

export const ListNode = ({ data }: NodeProps) => {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "list":
        return <ClipboardList  className="w-8 h-8 text-blue-600" />
      case "clock":
        return <Clock className="w-8 h-8 text-yellow-600" />
      case "alert-circle":
        return <ClipboardX  className="w-8 h-8 text-red-600" />
      case "eye":
        return <Eye className="w-8 h-8 text-purple-600" />
      case "check-square":
        return <ClipboardCheck  className="w-8 h-8 text-green-600" />
      default:
        return <ClipboardList  className="w-8 h-8 text-gray-600" />
    }
  }

  const handleNodeClick = () => {
    // Toggle this node and close others
    data.onToggleTasks?.(data.listId)
  }

  return (
    <div className="flex flex-col items-center">
      <Card
        className={`shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 ${getListColor(data.name)} ${
          data.isTasksExpanded ? 'w-20 h-20' : 'w-16 h-16'
        } relative`}
        onClick={handleNodeClick}
      >
        <CardContent className="flex items-center justify-center h-full p-2">
          {!data.isTasksExpanded ? (
            // Collapsed state - only show icon
            <div className="flex items-center justify-center">
              {getIconComponent(getListIcon(data.name))}
            </div>
          ) : (
            // Expanded state - show animated icon only
            <div className="flex items-center justify-center">
              <div className="animate-pulse">
                {getIconComponent(getListIcon(data.name))}
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
      
      {/* Name below the box for both selected and unselected nodes */}
      <div className="mt-2 text-center">
        <p className="text-xs font-semibold text-gray-700">{data.name}</p>
        <div className="text-xs mt-1 text-gray-500">
          {data.taskCount} tasks
        </div>
      </div>
    </div>
  )
}