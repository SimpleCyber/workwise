"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Clock, CheckCircle, XCircle, Send, ImageIcon, X, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import type Quill from "quill"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import type { Id } from "@/../convex/_generated/dataModel"
import { useGetComments } from "../api/use-get-comments"
import { useAddComment } from "../api/use-add-comment"
import { useUpdateAttendanceStatus } from "../api/use-update-attendance-status"
import { useCurrentMember } from "@/features/members/api/use-current-member"
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url"

const Editor = dynamic(() => import("@/components/editor"), {
  ssr: false,
})

interface AttendanceDetailWithChatProps {
  attendance: any
  workspaceId: Id<"workspaces">
  onClose: () => void
}

export const AttendanceDetailWithChat = ({ attendance, workspaceId, onClose }: AttendanceDetailWithChatProps) => {
  const [comment, setComment] = useState("")
  const [commentImage, setCommentImage] = useState<File | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [showComments, setShowComments] = useState(true)

  const editorRef = useRef<Quill | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: comments, isLoading: commentsLoading } = useGetComments({ attendanceId: attendance._id })
  const { data: currentMember } = useCurrentMember({ workspaceId })
  const { mutate: addComment, isPending: isAddingComment } = useAddComment()
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateAttendanceStatus()
  const { mutate: generateUploadUrl } = useGenerateUploadUrl()

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

  const parseTaskContent = (tasks: string) => {
    try {
      const parsed = JSON.parse(tasks)
      if (parsed.ops && Array.isArray(parsed.ops)) {
        return parsed.ops
          .map((op: any) => op.insert)
          .join("")
          .trim()
      }
      return tasks
    } catch {
      return tasks
    }
  }

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
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "absent":
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <X className="w-3 h-3 mr-1" />
            Absent
          </Badge>
        )
      default:
        return null
    }
  }

  const isAbsent = attendance.status === "absent" || attendance.checkInTime === 0

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Main Content */}
      <ResizablePanel defaultSize={70} minSize={50}>
        <div className="p-6 overflow-y-auto h-full">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <h1 className="text-2xl font-bold">
                    Today Task: {attendance.user?.name}'s Attendance - {new Date(attendance.date).toLocaleDateString()}
                  </h1>
                </div>
                {getStatusBadge(attendance.status)}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Employee Info */}
            <Card>
              <CardHeader>
                <CardTitle>Employee Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={attendance.user?.image || "/placeholder.svg"} />
                    <AvatarFallback>{attendance.user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-lg">{attendance.user?.name}</p>
                    <p className="text-sm text-muted-foreground">{attendance.user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Details */}
            <Card>
              <CardHeader>
                <CardTitle>Time Details</CardTitle>
              </CardHeader>
              <CardContent>
                {isAbsent ? (
                  <div className="text-center py-8">
                    <X className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <p className="text-xl font-bold text-red-600">Absent</p>
                    <p className="text-sm text-muted-foreground">No attendance marked for this day</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Check In</h4>
                      <p className="text-3xl font-bold">{formatTime(attendance.checkInTime)}</p>
                      <p className="text-sm text-muted-foreground">
                        {attendance.workLocation === "home" ? "Work from Home" : "Office"}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Check Out</h4>
                      <p className="text-3xl font-bold">
                        {attendance.checkOutTime ? formatTime(attendance.checkOutTime) : "Not checked out"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Duration: {formatDuration(attendance.checkInTime, attendance.checkOutTime)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            {attendance.location && !isAbsent && (
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{attendance.location}</p>
                </CardContent>
              </Card>
            )}

            {/* Check-in Notes */}
            {attendance.checkInNotes && !isAbsent && (
              <Card>
                <CardHeader>
                  <CardTitle>Check-in Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{attendance.checkInNotes}</p>
                </CardContent>
              </Card>
            )}

            {/* Tasks & Accomplishments */}
            {attendance.tasks && !isAbsent && (
              <Card>
                <CardHeader>
                  <CardTitle>Tasks & Accomplishments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/20 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{parseTaskContent(attendance.tasks)}</p>
                  </div>
                  {attendance.taskImage && (
                    <div className="mt-4">
                      <img
                        src={`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${attendance.taskImage}`}
                        alt="Task attachment"
                        className="max-w-full h-auto rounded-lg border"
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Admin Actions */}
            {currentMember?.role === "admin" && attendance.status === "pending" && (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                    <Textarea
                      id="adminNotes"
                      placeholder="Add any notes about this attendance..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => handleStatusUpdate("approved")} disabled={isUpdating} className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate("rejected")}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Notes (if exists) */}
            {attendance.adminNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{attendance.adminNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Comments Sidebar - Resizable */}
      <ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
        <div className="h-full border-l bg-muted/20 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments and Activity
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
                Show details
              </Button>
            </div>
          </div>

          {showComments && (
            <>
              {/* Comments List */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
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
                                // Open image in new tab for full view
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

              {/* Comment Input */}
              <div className="p-4 border-t">
                <div className="space-y-3">
                  <Textarea
                    placeholder="Write a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="resize-none"
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
                    <Button onClick={handleAddComment} disabled={isAddingComment || (!comment.trim() && !commentImage)}>
                      <Send className="w-4 h-4 mr-2" />
                      {isAddingComment ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
