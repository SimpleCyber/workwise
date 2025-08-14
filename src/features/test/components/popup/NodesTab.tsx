import { GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusColors = [
  { name: "in-progress", class: "bg-blue-100 text-blue-800" },
  { name: "done", class: "bg-green-100 text-green-800" },
  { name: "blocked", class: "bg-red-100 text-red-800" },
];

interface ChildNode {
  id: string;
  label: string;
  status: string;
}

interface NodesTabProps {
  childNodes: ChildNode[];
}

export function NodesTab({ childNodes }: NodesTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
        <GitBranch className="w-3 h-3" />
        Child Nodes ({childNodes.length})
      </div>
      <div className="space-y-2">
        {childNodes.map((node) => (
          <div
            key={node.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
          >
            <div className="text-xs font-medium">{node.label}</div>
            <Badge
              variant="secondary"
              className={`text-xs ${
                statusColors.find((s) => s.name === node.status)?.class ||
                statusColors[0].class
              }`}
            >
              {node.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
