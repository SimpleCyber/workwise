"use client"

import { FolderKanban, ExternalLink } from "lucide-react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const ProjectNode = ({ data }: NodeProps) => {
  return (
    <Card className="min-w-[220px] shadow-md border-green-200 cursor-pointer hover:shadow-lg transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-green-100">
              <FolderKanban className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium">{data.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs font-mono">
                  {data.boardCode}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {data.totalTasks} tasks
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {data.viewMode === "overview" && data.listCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => data.onToggleLists?.(data.projectId)}
                className="text-xs"
              >
                {data.isListsExpanded ? "−" : "+"}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => data.onProjectClick(data.projectId)} className="text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />
              Open
            </Button>
          </div>
        </div>
        <Handle type="target" position={data.isHorizontal ? Position.Left : Position.Top} className="w-3 h-3" />
        <Handle type="source" position={data.isHorizontal ? Position.Right : Position.Bottom} className="w-3 h-3" />
      </CardContent>
    </Card>
  )
}
