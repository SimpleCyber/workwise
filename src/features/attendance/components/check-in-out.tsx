"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Home, Building, Clock, CheckCircle, XCircle, MessageSquare, Send, ImageIcon, X } from "lucide-react"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import type Quill from "quill"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { Id } from "@/../convex/_generated/dataModel"
import { useCheckIn } from "../api/use-check-in"
import { useCheckOut } from "../api/use-check-out"
import { useGetTodayAttendance } from "../api/use-get-today-attendance"
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useGetComments } from "../api/use-get-comments"
import { useAddComment } from "../api/use-add-comment"
import { useCurrentMember } from "@/features/members/api/use-current-member"

const Editor = dynamic(() => import("@/components/editor"), {
  ssr: false,
})

interface CheckInOutProps {
  workspaceId: Id<"workspaces">
}

export const CheckInOut = ({ workspaceId }: CheckInOutProps) => {
  const [workLocation, setWorkLocation] = useState<"office" | "home">("office")
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [tasks, setTasks] = useState("")
  const [taskImage, setTaskImage] = useState<File | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [comment, setComment] = useState("")
  const [commentImage, setCommentImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editorRef = useRef<Quill | null>(null)

  const { data: todayAttendance, isLoading } = useGetTodayAttendance({ workspaceId })
  const { mutate: checkIn, isPending: isCheckingIn } = useCheckIn()
  const { mutate: checkOut, isPending: isCheckingOutPending } = useCheckOut()
  const { mutate: generateUploadUrl } = useGenerateUploadUrl()
  const { data: comments, isLoading: commentsLoading } = useGetComments({
    attendanceId: todayAttendance?._id || "",
  })
  const { data: currentMember } = useCurrentMember({ workspaceId })
  const { mutate: addComment, isPending: isAddingComment } = useAddComment()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCommentImage(file)
    }
  }

  const handleAddComment = async () => {
    if (!comment.trim() && !commentImage) return
    if (!todayAttendance) return

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
          attendanceId: todayAttendance._id,
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

  const handleCheckIn = async () => {
    try {
      // Get current location if available
      let currentLocation = location
      if (!currentLocation && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject)
          })
          currentLocation = `${position.coords.latitude}, ${position.coords.longitude}`
        } catch (error) {
          console.log("Location access denied")
        }
      }

      await checkIn(
        {
          workspaceId,
          workLocation,
          location: currentLocation,
          notes: notes || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Checked in successfully!")
            setNotes("")
            setLocation("")
          },
          onError: (error) => {
            toast.error(error.message || "Failed to check in")
          },
        },
      )
    } catch (error) {
      toast.error("Failed to check in")
    }
  }

  const handleCheckOut = async ({ body, image }: { body: string; image: File | null }) => {
    if (!todayAttendance) return

    try {
      let imageId: Id<"_storage"> | undefined

      if (image) {
        const url = await generateUploadUrl({}, { throwError: true })
        if (!url) throw new Error("Failed to get upload URL")

        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": image.type },
          body: image,
        })

        if (!result.ok) throw new Error("Failed to upload image")
        const { storageId } = await result.json()
        imageId = storageId
      }

      await checkOut(
        {
          attendanceId: todayAttendance._id,
          tasks: body,
          image: imageId,
        },
        {
          onSuccess: () => {
            toast.success("Checked out successfully!")
            setIsCheckingOut(false)
          },
          onError: (error) => {
            toast.error(error.message || "Failed to check out")
          },
        },
      )
    } catch (error) {
      toast.error("Failed to check out")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
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
      default:
        return null
    }
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Main Content */}
      <ResizablePanel defaultSize={70} minSize={50}>
        <div className="max-w-4xl mx-auto space-y-6 p-6">
          {/* Current Status */}
          {todayAttendance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Today's Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Check In</p>
                    <p className="font-medium">{new Date(todayAttendance.checkInTime).toLocaleTimeString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {todayAttendance.workLocation === "home" ? "Work from Home" : "Office"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check Out</p>
                    <p className="font-medium">
                      {todayAttendance.checkOutTime
                        ? new Date(todayAttendance.checkOutTime).toLocaleTimeString()
                        : "Not checked out"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(todayAttendance.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Check In Form */}
          {!todayAttendance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Check In
                </CardTitle>
                <CardDescription>Start your workday by checking in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Work Location</Label>
                  <RadioGroup
                    value={workLocation}
                    onValueChange={(value) => setWorkLocation(value as "office" | "home")}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="office" id="office" />
                      <Label htmlFor="office" className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Office
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="home" id="home" />
                      <Label htmlFor="home" className="flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Work from Home
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="Enter your location or it will be detected automatically"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes for today..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={handleCheckIn} disabled={isCheckingIn} className="w-full">
                  {isCheckingIn ? "Checking In..." : "Check In"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Check Out Form */}
          {todayAttendance && !todayAttendance.checkOutTime && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Check Out
                </CardTitle>
                <CardDescription>End your workday by checking out and submitting your tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {!isCheckingOut ? (
                  <Button onClick={() => setIsCheckingOut(true)} className="w-full">
                    Check Out
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Today's Tasks & Accomplishments</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Describe what you accomplished today. You can format text and attach images.
                      </p>
                      <Editor
                        placeholder="Describe your tasks and accomplishments for today..."
                        onSubmit={handleCheckOut}
                        disabled={isCheckingOutPending}
                        innerRef={editorRef}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Already Checked Out */}
          {todayAttendance && todayAttendance.checkOutTime && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  Work Day Complete
                </CardTitle>
                <CardDescription>You have successfully completed your work day</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Checked out at {new Date(todayAttendance.checkOutTime).toLocaleTimeString()}
                </p>
                {todayAttendance.status === "pending" && (
                  <p className="text-sm text-yellow-600 mt-2">Your attendance is pending admin approval.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Comments Sidebar */}
      <ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
        <div className="h-full border-l bg-muted/20 flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments & Activity
            </h3>
          </div>

          {/* Comments List */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {!todayAttendance ? (
                <p className="text-sm text-muted-foreground text-center py-8">Check in first to start commenting</p>
              ) : commentsLoading ? (
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
                            window.open(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${comment.image}`, "_blank")
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
          {todayAttendance && (
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
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
