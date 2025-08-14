"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Calendar,
  User,
  Shield,
  Table,
  GitBranch,
  CheckSquare,
  MessageCircle,
  Send,
} from "lucide-react";

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

const statusColors = [
  { name: "Open", class: "bg-blue-100 text-blue-800" },
  { name: "In Progress", class: "bg-yellow-100 text-yellow-800" },
  { name: "Completed", class: "bg-green-100 text-green-800" },
  { name: "Blocked", class: "bg-red-100 text-red-800" },
  { name: "Review", class: "bg-purple-100 text-purple-800" },
];

export function NodePopup({
  show,
  nodeId,
  label,
  description,
  status,
  uniqueId,
  isPersistent,
  childNodes = [],
  onClose,
}: NodePopupProps) {
  const [activeTab, setActiveTab] = useState("Details");
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: "Sarah Wilson",
      authorInitials: "SW",
      authorColor: "bg-green-500",
      content: "Great progress on this task! The implementation looks solid.",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      author: "Mike Johnson",
      authorInitials: "MJ",
      authorColor: "bg-indigo-500",
      content: "I've reviewed the code and left some feedback in the PR.",
      timestamp: "1 day ago",
    },
  ]);
  const [newComment, setNewComment] = useState("");
  const popupRef = useRef<HTMLDivElement>(null);

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        author: "John Smith",
        authorInitials: "JS",
        authorColor: "bg-blue-500",
        content: newComment.trim(),
        timestamp: "Just now",
      };
      setComments([comment, ...comments]);
      setNewComment("");
    }
  };

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

  const currentStatusColor =
    statusColors.find((s) => s.name === status)?.class || statusColors[0].class;

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
      onClick={(e) => e.stopPropagation()}
    >
      <Card className="shadow-xl border-2 bg-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold">{label}</span>
            </div>
            <Badge
              variant="secondary"
              className={`text-xs ${currentStatusColor}`}
            >
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
                      <div className="text-xs text-gray-500">
                        Lead Developer
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">
                  Description
                </div>
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
                <div className="text-xs font-mono text-gray-600 ml-2">
                  {uniqueId}
                </div>
              </div>

              {/* Created At */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                  <Calendar className="w-3 h-3" />
                  Created At
                </div>
                <div className="text-xs text-gray-600 ml-5">
                  1/15/2024, 10:30 AM
                </div>
              </div>
            </>
          )}

          {activeTab === "Nodes" && childNodes.length > 0 && (
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
                      className={`text-xs ${statusColors.find((s) => s.name === node.status)?.class || statusColors[0].class}`}
                    >
                      {node.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Tasks" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                <CheckSquare className="w-3 h-3" />
                Tasks (1/4)
              </div>
              <div className="space-y-2">
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
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  <div className="w-3 h-3 rounded border-2 flex items-center justify-center border-gray-300" />
                  <div className="flex-1">
                    <div className="text-xs font-medium">
                      Implement API Endpoints
                    </div>
                    <div className="text-xs text-gray-500">Assigned to: MJ</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  <div className="w-3 h-3 rounded border-2 flex items-center justify-center border-gray-300" />
                  <div className="flex-1">
                    <div className="text-xs font-medium">Create Unit Tests</div>
                    <div className="text-xs text-gray-500">Assigned to: JS</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  <div className="w-3 h-3 rounded border-2 flex items-center justify-center border-gray-300" />
                  <div className="flex-1">
                    <div className="text-xs font-medium">Deploy to Staging</div>
                    <div className="text-xs text-gray-500">Assigned to: SW</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Comments" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                <MessageCircle className="w-3 h-3" />
                Comments ({comments.length})
              </div>

              {/* Add new comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="text-xs resize-none h-16"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="text-xs h-7 px-3"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Comment
                  </Button>
                </div>
              </div>

              {/* Comments list */}
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <div
                      className={`w-6 h-6 rounded-full ${comment.authorColor} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}
                    >
                      {comment.authorInitials}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {comment.author}
                        </span>
                        <span className="text-xs text-gray-500">
                          {comment.timestamp}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2 rounded-md">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
