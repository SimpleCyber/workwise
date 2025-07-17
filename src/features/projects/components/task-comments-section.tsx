"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, ArrowUpDown, Edit2, Trash2, Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RichTextEditor } from "@/components/rich-text-editor"
import { RichTextDisplay } from "@/components/rich-text-display"
import {
  useGetTaskComments,
  useCreateTaskComment,
  useUpdateTaskComment,
  useDeleteTaskComment,
} from "../api/use-task-comments"
import type { Id } from "../../../../convex/_generated/dataModel"
import { toast } from "sonner"

interface TaskCommentsSectionProps {
  taskId: Id<"projectTasks">
  currentUserId: Id<"users">
}

export const TaskCommentsSection = ({ taskId, currentUserId }: TaskCommentsSectionProps) => {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [newComment, setNewComment] = useState("")
  const [editingComment, setEditingComment] = useState<Id<"taskComments"> | null>(null)
  const [editContent, setEditContent] = useState("")

  const { data: comments, isLoading } = useGetTaskComments(taskId, sortOrder)
  const createComment = useCreateTaskComment()
  const updateComment = useUpdateTaskComment()
  const deleteComment = useDeleteTaskComment()

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    try {
      await createComment({
        taskId,
        content: newComment,
      })
      setNewComment("")
      toast.success("Comment added successfully!")
    } catch (error) {
      toast.error("Failed to add comment")
    }
  }

  const handleEditComment = (commentId: Id<"taskComments">, currentContent: string) => {
    setEditingComment(commentId)
    setEditContent(currentContent)
  }

  const handleUpdateComment = async (commentId: Id<"taskComments">) => {
    if (!editContent.trim()) return

    try {
      await updateComment({
        commentId,
        content: editContent,
      })
      setEditingComment(null)
      setEditContent("")
      toast.success("Comment updated successfully!")
    } catch (error) {
      toast.error("Failed to update comment")
    }
  }

  const handleDeleteComment = async (commentId: Id<"taskComments">) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      await deleteComment({ commentId })
      toast.success("Comment deleted successfully!")
    } catch (error) {
      toast.error("Failed to delete comment")
    }
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    // This would integrate with your file upload service
    // For now, return a placeholder
    return "/placeholder.svg"
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">Loading comments...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments ({comments?.length || 0})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === "asc" ? "Oldest First" : "Newest First"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Comment Form */}
        <div className="space-y-3">
          <RichTextEditor
            value={newComment}
            onChange={setNewComment}
            onImageUpload={handleImageUpload}
            placeholder="Write a comment..."
            className="min-h-[120px]"
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmitComment} disabled={!newComment.trim()} className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Add Comment
            </Button>
          </div>
        </div>

        <Separator />

        {/* Comments List */}
        <div className="space-y-4">
          {comments?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments?.map((comment) => (
              <div key={comment._id} className="flex gap-3 group">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarImage src={comment.member?.user?.image || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">
                    {comment.member?.user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.member?.user?.name || "Unknown User"}</span>
                    <Badge variant="outline" className="text-xs">
                      {comment.member?.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                    {comment.isEdited && (
                      <Badge variant="secondary" className="text-xs">
                        edited
                      </Badge>
                    )}
                  </div>

                  {editingComment === comment._id ? (
                    <div className="space-y-2">
                      <RichTextEditor
                        value={editContent}
                        onChange={setEditContent}
                        onImageUpload={handleImageUpload}
                        className="min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateComment(comment._id)}
                          disabled={!editContent.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingComment(null)
                            setEditContent("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <RichTextDisplay content={comment.content} />
                      </div>

                      {/* Comment Actions */}
                      {comment.member?.userId === currentUserId && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditComment(comment._id, comment.content)}
                            className="h-7 px-2 text-xs"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment._id)}
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
