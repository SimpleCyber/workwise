import { MessageCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/api/use-current-user";

interface CommentsTabProps {
  nodeId: string;
  workspaceId: string;
}

export function CommentsTab({ nodeId, workspaceId }: CommentsTabProps) {
  const [newComment, setNewComment] = useState("");
  const { data: currentUser } = useCurrentUser();

  // Fetch comments from backend
  const comments = useQuery(api.advancetree.getNodeComments, { nodeId });
  const addComment = useMutation(api.advancetree.addNodeComment);

  const isLoading = comments === undefined;

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addComment({
        nodeId,
        workspaceId: workspaceId as Id<"workspaces">,
        content: newComment.trim(),
      });
      setNewComment("");
      toast.success("Comment added");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getColorFromString = (str?: string) => {
    if (!str) return "bg-gray-500";
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-teal-500",
    ];
    const index = str.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
        <MessageCircle className="w-3 h-3" />
        Comments ({comments?.length || 0})
      </div>

      {/* Add new comment */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              handleAddComment();
            }
          }}
          className="text-xs resize-none h-16"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleAddComment}
            disabled={!newComment.trim() || isLoading}
            className="text-xs h-7 px-3"
          >
            <Send className="w-3 h-3 mr-1" />
            Comment
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => {
            const userName = comment.user?.name || "Unknown User";
            const initials = getInitials(userName);
            const color = getColorFromString(userName);

            return (
              <div key={comment._id} className="flex gap-2">
                <div
                  className={`w-6 h-6 rounded-full ${color} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}
                >
                  {initials}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{userName}</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2 rounded-md">
                    {comment.content}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-xs text-gray-500 text-center py-4">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
}
