"use client"

import { Building2 } from "lucide-react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const WorkspaceNode = ({ data }: NodeProps) => {
  return (
    <Card className="min-w-[200px] shadow-md border-purple-200 cursor-pointer hover:shadow-lg transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3" onClick={() => data.onToggle?.(data.workspaceId)}>
            <div className="flex items-center justify-center w-8 h-8 rounded bg-purple-100">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium">{data.name}</h4>
              <Badge variant="outline" className="text-xs mt-1">
                {data.projectCount} projects
              </Badge>
            </div>
          </div>
          {data.viewMode === "overview" && (
            <Button variant="ghost" size="sm" onClick={() => data.onToggle?.(data.workspaceId)} className="text-xs">
              {data.isExpanded ? "−" : "+"}
            </Button>
          )}
        </div>
        <Handle type="target" position={data.isHorizontal ? Position.Left : Position.Top} className="w-3 h-3" />
        <Handle type="source" position={data.isHorizontal ? Position.Right : Position.Bottom} className="w-3 h-3" />
      </CardContent>
    </Card>
  )
}
