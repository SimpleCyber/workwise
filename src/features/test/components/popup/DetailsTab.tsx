import { Calendar, Shield, Table, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusColors = [
  { name: "Open", class: "bg-blue-100 text-blue-800" },
  { name: "In Progress", class: "bg-yellow-100 text-yellow-800" },
  { name: "Completed", class: "bg-green-100 text-green-800" },
  { name: "Blocked", class: "bg-red-100 text-red-800" },
  { name: "Review", class: "bg-purple-100 text-purple-800" },
];

interface DetailsTabProps {
  description: string;
  status: string;
  uniqueId: string;
}

export function DetailsTab({ description, status, uniqueId }: DetailsTabProps) {
  const currentStatusColor =
    statusColors.find((s) => s.name === status)?.class || statusColors[0].class;

  return (
    <>
      {/* Creator */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
          <User className="w-3 h-3" />
          Creator
        </div>
        <div className="flex items-center gap-2 ml-5">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
            JS
          </div>
          <div>
            <div className="text-xs font-medium">John Smith</div>
            <div className="text-xs text-gray-500">Project Manager</div>
          </div>
        </div>
      </div>

      {/* Admins */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
          <Shield className="w-3 h-3" />
          Admins (2)
        </div>
        <div className="ml-5 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium">
              SW
            </div>
            <div>
              <div className="text-xs font-medium">Sarah Wilson</div>
              <div className="text-xs text-gray-500">Admin</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-medium">
              MJ
            </div>
            <div>
              <div className="text-xs font-medium">Mike Johnson</div>
              <div className="text-xs text-gray-500">Lead Developer</div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">Description</div>
        <div className="text-xs text-gray-600 leading-relaxed ml-2">
          {description}
        </div>
      </div>

      {/* Table Data */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
          <Table className="w-3 h-3" />
          Details
        </div>
        <div className="ml-5 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Priority:</span>
            <span className="font-medium">High</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Department:</span>
            <span className="font-medium">Engineering</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Budget:</span>
            <span className="font-medium">$25,000</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Timeline:</span>
            <span className="font-medium">3 months</span>
          </div>
        </div>
      </div>

      {/* ID */}
      <div className="space-y-1">
        <div className="text-xs font-medium text-gray-700">Node ID</div>
        <div className="text-xs font-mono text-gray-600 ml-2">{uniqueId}</div>
      </div>

      {/* Created At */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
          <Calendar className="w-3 h-3" />
          Created At
        </div>
        <div className="text-xs text-gray-600 ml-5">1/15/2024, 10:30 AM</div>
      </div>
    </>
  );
}
