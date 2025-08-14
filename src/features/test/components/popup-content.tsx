import { Calendar, MapPin } from "lucide-react";

interface PopupContentProps {
  activeTab: string;
  nodeData: any;
  childNodes: Array<{ id: string; label: string; status: string }>;
}

export function PopupContent({
  activeTab,
  nodeData,
  childNodes,
}: PopupContentProps) {
  if (activeTab === "Details") {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Creator</h4>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              JD
            </div>
            <span className="text-sm text-gray-600">John Doe</span>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Admins</h4>
          <div className="flex gap-2">
            {["AS", "MJ", "SK"].map((admin, index) => (
              <div
                key={admin}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  ["bg-green-500", "bg-purple-500", "bg-orange-500"][index]
                }`}
              >
                {admin}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-1">Title</h4>
          <p className="text-sm text-gray-600">{nodeData.label}</p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-1">Description</h4>
          <p className="text-sm text-gray-600">
            {nodeData.description || "No description available"}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{nodeData.id}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Created 2 days ago</span>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "Nodes" && childNodes.length > 0) {
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">
          Child Nodes ({childNodes.length})
        </h4>
        {childNodes.map((child) => (
          <div
            key={child.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded"
          >
            <span className="text-sm font-medium">{child.label}</span>
            <span
              className={`px-2 py-1 text-xs rounded ${
                child.status === "Open"
                  ? "bg-green-100 text-green-800"
                  : child.status === "In Progress"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {child.status}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === "Tasks") {
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Tasks</h4>
        {[
          { name: "Review requirements", completed: true, assignee: "JD" },
          { name: "Update documentation", completed: false, assignee: "AS" },
          { name: "Test implementation", completed: false, assignee: "MJ" },
        ].map((task, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-gray-50 rounded"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={task.completed}
                readOnly
                className="rounded"
              />
              <span
                className={`text-sm ${task.completed ? "line-through text-gray-500" : ""}`}
              >
                {task.name}
              </span>
            </div>
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
              {task.assignee}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <div className="text-sm text-gray-500">No content available</div>;
}
