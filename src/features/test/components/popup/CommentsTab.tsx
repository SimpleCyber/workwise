import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface Comment {
  id: string;
  author: string;
  authorInitials: string;
  authorColor: string;
  content: string;
  timestamp: string;
}

interface CommentsTabProps {
  comments: Comment[];
  setComments: (c: Comment[]) => void;
}

export function CommentsTab({ comments, setComments }: CommentsTabProps) {
  const [newComment, setNewComment] = useState("");

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

  return (
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
                <span className="text-xs font-medium">{comment.author}</span>
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
  );
}
