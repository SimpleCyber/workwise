"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Building2,
  Goal,
  ClipboardList,
  CheckSquare,
} from "lucide-react";

interface MinimapLegendProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const MinimapLegend = ({ isVisible, onToggle }: MinimapLegendProps) => {
  if (!isVisible) {
    return (
      <div className="absolute bottom-4 left-4 z-10">
        <button
          onClick={onToggle}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"
        >
          Show Legend
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 z-10">
      <Card className="w-64 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Minimap Legend
            </CardTitle>
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              Hide
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* Node Types */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">
              Node Types
            </h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <User className="w-3 h-3 text-gray-600" />
                <span className="text-xs">User</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500"></div>
                <Building2 className="w-3 h-3 text-gray-600" />
                <span className="text-xs">Workspace</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <Goal className="w-3 h-3 text-gray-600" />
                <span className="text-xs">Project (Normal)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <Goal className="w-3 h-3 text-gray-600" />
                <span className="text-xs">Project (Hold Tasks)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500"></div>
                <ClipboardList className="w-3 h-3 text-gray-600" />
                <span className="text-xs">List</span>
              </div>
            </div>
          </div>

          {/* Task Priorities */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">
              Task Priority
            </h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-600"></div>
                <CheckSquare className="w-3 h-3 text-gray-600" />
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  Urgent
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-600"></div>
                <CheckSquare className="w-3 h-3 text-gray-600" />
                <Badge
                  variant="secondary"
                  className="text-xs px-1 py-0 bg-orange-100"
                >
                  High
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-600"></div>
                <CheckSquare className="w-3 h-3 text-gray-600" />
                <Badge
                  variant="secondary"
                  className="text-xs px-1 py-0 bg-yellow-100"
                >
                  Medium
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-600"></div>
                <CheckSquare className="w-3 h-3 text-gray-600" />
                <Badge
                  variant="secondary"
                  className="text-xs px-1 py-0 bg-green-100"
                >
                  Low
                </Badge>
              </div>
            </div>
          </div>

          {/* Active State */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">States</h4>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2 border-gray-800"></div>
              <span className="text-xs">Active/Selected Node</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
