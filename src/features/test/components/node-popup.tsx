import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { DetailsTab } from "./popup/DetailsTab";
import { NodesTab } from "./popup/NodesTab";
import { TasksTab } from "./popup/TasksTab";
import { CommentsTab } from "./popup/CommentsTab";

interface ChildNode {
  id: string;
  label: string;
  status: string;
}

interface Comment {
  id: string;
  author: string;
  authorInitials: string;
  authorColor: string;
  content: string;
  timestamp: string;
}

interface NodePopupProps {
  show: boolean;
  nodeId: string;
  label: string;
  description: string;
  status: string;
  uniqueId: string;
  isPersistent: boolean;
  childNodes: ChildNode[];
  onClose: () => void;
}

export function NodePopup({
  show,
  label,
  description,
  status,
  uniqueId,
  isPersistent,
  childNodes = [],
  onClose,
}: NodePopupProps) {
  const [activeTab, setActiveTab] = useState("Details");
  const [comments, setComments] = useState<Comment[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPersistent) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPersistent, onClose]);

  if (!show) return null;

  const tabs = [
    "Details",
    ...(childNodes.length > 0 ? ["Nodes"] : []),
    "Tasks",
    "Comments",
  ];

  return (
    <div
      ref={popupRef}
      className="absolute top-0 right-full mr-4 z-[9999] w-80"
    >
      <Card className="shadow-xl border-2 bg-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold">{label}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {status}
            </Badge>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {activeTab === "Details" && (
            <DetailsTab
              description={description}
              status={status}
              uniqueId={uniqueId}
            />
          )}
          {activeTab === "Nodes" && childNodes.length > 0 && (
            <NodesTab childNodes={childNodes} />
          )}
          {activeTab === "Tasks" && <TasksTab />}
          {activeTab === "Comments" && (
            <CommentsTab comments={comments} setComments={setComments} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
