"use client"

import type React from "react"

import { useState, useRef } from "react"
import { CheckCircle, XCircle, Send, ImageIcon, X, MessageSquare, User } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { Id } from "@/../convex/_generated/dataModel"
import { useGetComments } from "../api/use-get-comments"
import { useAddComment } from "../api/use-add-comment"
import { useUpdateAttendanceStatus } from "../api/use-update-attendance-status"
import { useCurrentMember } from "@/features/members/api/use-current-member"
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url"

interface AttendanceDetailModalProps {
  attendance: any
  workspaceId: Id<"workspaces">
  isOpen: boolean
  onClose: () => void
  isAdmin?: boolean
}

export const AttendanceDetailModal = ({
  attendance,
  workspaceId,
  isOpen,
  onClose,
  isAdmin = false,
}: AttendanceDetailModalProps) => {
  const [comment, setComment] = useState("")
  const [commentImage, setCommentImage] = useState<File | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: comments, isLoading: commentsLoading } = useGetComments({
    attendanceId: attendance?._id || "",
  })
  const { data: currentMember } = useCurrentMember({ workspaceId })
  const { mutate: addComment, isPending: isAddingComment } = useAddComment()
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateAttendanceStatus()
  const { mutate: generateUploadUrl } = useGenerateUploadUrl()

  if (!attendance) return null

  const formatTime = (timestamp: number) => {
    if (timestamp === 0) return "Absent"
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDuration = (checkIn: number, checkOut?: number) => {
    if (checkIn === 0) return "Absent"
    if (!checkOut) return "In progress"
    const duration = checkOut - checkIn
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const isAbsent = attendance.status === "absent" || attendance.checkInTime === 0

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCommentImage(file)
    }
  }

  const handleAddComment = async () => {
    if (!comment.trim() && !commentImage) return

    try {
      let imageId: Id<"_storage"> | undefined

      if (commentImage) {
        const url = await generateUploadUrl({}, { throwError: true })
        if (!url) throw new Error("Failed to get upload URL")

        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": commentImage.type },
          body: commentImage,
        })

        if (!result.ok) throw new Error("Failed to upload image")
        const { storageId } = await result.json()
        imageId = storageId
      }

      await addComment(
        {
          attendanceId: attendance._id,
          content: comment,
          image: imageId,
        },
        {
          onSuccess: () => {
            setComment("")
            setCommentImage(null)
            toast.success("Comment added successfully!")
          },
          onError: (error) => {
            toast.error(error.message || "Failed to add comment")
          },
        },
      )
    } catch (error) {
      toast.error("Failed to add comment")
    }
  }

  const handleStatusUpdate = async (status: "approved" | "rejected") => {
    await updateStatus(
      {
        attendanceId: attendance._id,
        status,
        adminNotes: adminNotes || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Attendance ${status} successfully!`)
          onClose()
        },
        onError: (error) => {
          toast.error(error.message || `Failed to ${status} attendance`)
        },
      },
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "absent":
        return <Badge className="bg-gray-100 text-gray-800">Absent</Badge>
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 flex">
        {/* Main Content - 2/3 width */}
        <div className="flex-1 flex flex-col overflow-hidden border-r">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3">
                <User className="w-5 h-5" />
                {attendance.user?.name}'s Attendance
                {getStatusBadge(attendance.status)}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{new Date(attendance.date).toLocaleDateString()}</p>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 pb-6">
            <div className="space-y-4">
              {/* Employee Info - Compact */}
              <Card className="p-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={attendance.user?.image || "/placeholder.svg"} />
                      <AvatarFallback>{attendance.user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{attendance.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{attendance.user?.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Time Details - Compact */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Time Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {isAbsent ? (
                    <div className="text-center py-4">
                      <X className="w-6 h-6 mx-auto mb-1 text-red-500" />
                      <p className="font-medium text-red-600">Absent</p>
                      <p className="text-xs text-muted-foreground">No attendance marked</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-muted/20 rounded">
                        <p className="text-xs text-muted-foreground mb-1">Check In</p>
                        <p className="font-bold">{formatTime(attendance.checkInTime)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {attendance.workLocation === "home" ? "Work from Home" : "Office"}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted/20 rounded">
                        <p className="text-xs text-muted-foreground mb-1">Check Out</p>
                        <p className="font-bold">
                          {attendance.checkOutTime ? formatTime(attendance.checkOutTime) : "Not checked out"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Duration: {formatDuration(attendance.checkInTime, attendance.checkOutTime)}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Details */}
              {!isAbsent && (
                <>
                  {attendance.location && (
                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm">Location</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm">{attendance.location}</p>
                      </CardContent>
                    </Card>
                  )}

                  {attendance.tasks && (
                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm">Tasks & Accomplishments</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="bg-muted/20 rounded p-3">
                          <p className="text-sm whitespace-pre-wrap">{attendance.tasks}</p>
                        </div>
                        {attendance.taskImage && (
                          <div className="mt-3">
                            <img
                              src={`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${attendance.taskImage}`}
                              alt="Task attachment"
                              className="max-w-full h-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                              crossOrigin="anonymous"
                              onClick={() => {
                                window.open(
                                  `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${attendance.taskImage}`,
                                  "_blank",
                                )
                              }}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Admin Actions */}
              {isAdmin && currentMember?.role === "admin" && attendance.status === "pending" && (
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Admin Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div>
                      <Label htmlFor="adminNotes" className="text-xs">Admin Notes (Optional)</Label>
                      <Textarea
                        id="adminNotes"
                        placeholder="Add any notes about this attendance..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={2}
                        className="text-xs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleStatusUpdate("approved")} 
                        disabled={isUpdating} 
                        size="sm"
                        className="flex-1"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusUpdate("rejected")}
                        disabled={isUpdating}
                        size="sm"
                        className="flex-1"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Admin Notes */}
              {attendance.adminNotes && (
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Admin Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm">{attendance.adminNotes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Comments Sidebar - 1/3 width */}
        <div className="w-96 flex flex-col border-l">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments & Activity
            </h3>
          </div>

          {/* Comments List with fixed height and scroll */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {commentsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.user?.image || "/placeholder.svg"} />
                      <AvatarFallback>{comment.user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{comment.user?.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                      {comment.image && (
                        <img
                          src={`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${comment.image}`}
                          alt="Comment attachment"
                          className="mt-2 max-w-full h-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                          crossOrigin="anonymous"
                          onClick={() => {
                            window.open(
                              `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${comment.image}`,
                              "_blank",
                            )
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No comments yet</p>
              )}
            </div>
          </ScrollArea>

          {/* Fixed comment input at bottom */}
          <div className="p-4 border-t bg-background">
            <div className="space-y-2">
              <Textarea
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
              {commentImage && (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(commentImage) || "/placeholder.svg"}
                    alt="Preview"
                    className="max-w-full h-20 object-cover rounded border"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1"
                    onClick={() => setCommentImage(null)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAddingComment}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  onClick={handleAddComment} 
                  disabled={isAddingComment || (!comment.trim() && !commentImage)}
                  size="sm"
                >
                  <Send className="w-3 h-3 mr-1" />
                  {isAddingComment ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}