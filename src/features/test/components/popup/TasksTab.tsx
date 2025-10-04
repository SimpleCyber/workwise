import { CheckSquare, Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

interface TasksTabProps {
  boardId?: Id<"projectBoards">;
  workspaceId: string;
}

export function TasksTab({ boardId, workspaceId }: TasksTabProps) {
  // Get the "To Do" list for this board
  const lists = useQuery(
    api.projects.getProjectLists,
    boardId ? { boardId } : "skip"
  );

  const todoList = lists?.find((list) => list.name === "To Do");

  // Get tasks for the To Do list
  const tasks = useQuery(
    api.projects.getProjectTasks,
    todoList ? { listId: todoList._id } : "skip"
  );

  const completedCount = tasks?.filter((t) => t.isCompleted).length || 0;
  const totalCount = tasks?.length || 0;

  if (!boardId) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
          <CheckSquare className="w-3 h-3" />
          Tasks
        </div>
        <div className="text-xs text-gray-500 text-center py-4">
          No board connected to this node
        </div>
      </div>
    );
  }

  if (!lists || !tasks) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
          <CheckSquare className="w-3 h-3" />
          Tasks
        </div>
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
        <CheckSquare className="w-3 h-3" />
        To Do Tasks ({completedCount}/{totalCount})
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-4">
            No tasks in To Do list
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div
                className={`w-3 h-3 rounded border-2 flex items-center justify-center ${
                  task.isCompleted
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300"
                }`}
              >
                {task.isCompleted && (
                  <div className="w-1 h-1 bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-xs font-medium truncate ${
                    task.isCompleted ? "line-through text-gray-500" : ""
                  }`}
                >
                  {task.title}
                </div>
                {task.assignedTo?.user?.name && (
                  <div className="text-xs text-gray-500 truncate">
                    Assigned to: {task.assignedTo.user.name}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
