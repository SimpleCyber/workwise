import { MessageSquare, Calendar } from "lucide-react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getPriorityColor, formatDate } from "../../api/tree-utils"
import type { Task } from "../../api/tree-types"

interface TaskTooltipProps {
  task: Task
}

const TaskTooltip = ({ task }: TaskTooltipProps) => (
  <div className="space-y-3 text-xs max-w-sm">
    <div>
      <h4 className="font-semibold text-sm mb-1">{task.title}</h4>
      <p className="text-muted-foreground font-mono">{task.taskCode}</p>
    </div>
    {task.description && (
      <div>
        <p className="font-medium mb-1">Description:</p>
        <p className="text-muted-foreground">{task.description}</p>
      </div>
    )}
    <div className="grid grid-cols-2 gap-2">
      <div>
        <p className="font-medium">Priority:</p>
        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
      </div>
      <div>
        <p className="font-medium">Status:</p>
        <Badge variant={task.isCompleted ? "default" : "secondary"} className="text-xs">
          {task.isCompleted ? "Completed" : "In Progress"}
        </Badge>
      </div>
    </div>
    {task.assignedTo && (
      <div>
        <p className="font-medium mb-1">Assigned to:</p>
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={task.assignedTo.user.image || "/placeholder.svg"} />
            <AvatarFallback className="text-xs">
              {task.assignedTo.user.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span>{task.assignedTo.user.name || "Unknown"}</span>
        </div>
      </div>
    )}
    {task.assignedBy && (
      <div>
        <p className="font-medium mb-1">Assigned by:</p>
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={task.assignedBy.user.image || "/placeholder.svg"} />
            <AvatarFallback className="text-xs">
              {task.assignedBy.user.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span>{task.assignedBy.user.name || "Unknown"}</span>
        </div>
      </div>
    )}
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <p className="font-medium">Created:</p>
        <p className="text-muted-foreground">{formatDate(task.createdAt)}</p>
      </div>
      <div>
        <p className="font-medium">Assigned:</p>
        <p className="text-muted-foreground">{formatDate(task.assignedAt)}</p>
      </div>
    </div>
    {task.dueDate && (
      <div>
        <p className="font-medium">Due Date:</p>
        <p className="text-muted-foreground">{formatDate(task.dueDate)}</p>
      </div>
    )}
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1">
        <MessageSquare className="w-3 h-3" />
        <span>{task.commentsCount} comments</span>
      </div>
      <div className="flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        <span>Updated {formatDate(task.updatedAt)}</span>
      </div>
    </div>
  </div>
)

export const TaskNode = ({ data }: NodeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="min-w-[200px] max-w-[250px] shadow-sm border cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-2">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h6 className="font-medium text-sm truncate flex-1 mr-2">{data.task.title}</h6>
                  <Badge className={`text-xs ${getPriorityColor(data.task.priority)}`}>{data.task.priority}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-mono">
                    {data.task.taskCode}
                  </Badge>
                  {data.task.assignedTo && (
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={data.task.assignedTo.user.image || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {data.task.assignedTo.user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {data.task.commentsCount > 0 && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{data.task.commentsCount}</span>
                    </div>
                  )}
                  {data.task.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(data.task.dueDate)}</span>
                    </div>
                  )}
                </div>
              </div>
              <Handle type="target" position={data.isHorizontal ? Position.Left : Position.Top} className="w-3 h-3" />
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="right" className="w-96">
          <TaskTooltip task={data.task} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
