import { CheckSquare } from "lucide-react";

export function TasksTab() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
        <CheckSquare className="w-3 h-3" />
        Tasks (1/4)
      </div>
      <div className="space-y-2">
        {/* Task Item Example */}
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
          <div className="w-3 h-3 rounded border-2 flex items-center justify-center bg-green-500 border-green-500">
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-medium line-through text-gray-500">
              Setup Database Schema
            </div>
            <div className="text-xs text-gray-500">Assigned to: SW</div>
          </div>
        </div>
        {/* Other tasks here... */}
      </div>
    </div>
  );
}
