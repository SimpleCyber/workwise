"use client"

import { List, CheckSquare, Clock, AlertCircle, Eye } from "lucide-react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getListIcon, getListColor } from "../../api/tree-utils"

export const ListNode = ({ data }: NodeProps) => {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "list":
        return <List className="w-4 h-4 text-blue-600" />
      case "clock":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "alert-circle":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case "eye":
        return <Eye className="w-4 h-4 text-purple-600" />
      case "check-square":
        return <CheckSquare className="w-4 h-4 text-green-600" />
      default:
        return <List className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <Card
      className={`min-w-[180px] shadow-md cursor-pointer hover:shadow-lg transition-shadow ${getListColor(data.name)}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded">
              {getIconComponent(getListIcon(data.name))}
            </div>
            <div>
              <h5 className="font-medium text-sm">{data.name}</h5>
              <Badge variant="outline" className="text-xs mt-1">
                {data.taskCount} tasks
              </Badge>
            </div>
          </div>
          {data.viewMode === "overview" && data.taskCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => data.onToggleTasks?.(data.listId)} className="text-xs">
              {data.isTasksExpanded ? "−" : "+"}
            </Button>
          )}
        </div>
        <Handle type="target" position={data.isHorizontal ? Position.Left : Position.Top} className="w-3 h-3" />
        <Handle type="source" position={data.isHorizontal ? Position.Right : Position.Bottom} className="w-3 h-3" />
      </CardContent>
    </Card>
  )
}
