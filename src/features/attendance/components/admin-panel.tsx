"use client"

import { useState } from "react"
import { Calendar, Users, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Id } from "@/../convex/_generated/dataModel"
import { useGetAttendanceByDate } from "../api/use-get-attendance-by-date"
import { useGetPendingAttendance } from "../api/use-get-pending-attendance"
import { useUpdateAttendanceStatus } from "../api/use-update-attendance-status"

interface AdminPanelProps {
  workspaceId: Id<"workspaces">
}

export const AdminPanel = ({ workspaceId }: AdminPanelProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)

  const { data: dailyAttendance, isLoading: dailyLoading } = useGetAttendanceByDate({
    workspaceId,
    date: selectedDate.getTime(),
  })

  const { data: pendingAttendance, isLoading: pendingLoading } = useGetPendingAttendance({
    workspaceId,
  })

  const { mutate: updateStatus, isPending: isUpdating } = useUpdateAttendanceStatus()

  const navigateDate = (direction: "prev" | "next") => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setDate(prev.getDate() - 1)
      } else {
        newDate.setDate(prev.getDate() + 1)
      }
      return newDate
    })
  }

  const handleStatusUpdate = async (status: "approved" | "rejected") => {
    if (!selectedAttendance) return

    await updateStatus(
      {
        attendanceId: selectedAttendance._id,
        status,
        adminNotes: adminNotes || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Attendance ${status} successfully!`)
          setSelectedAttendance(null)
          setAdminNotes("")
          setActionType(null)
        },
        onError: (error) => {
          toast.error(error.message || `Failed to ${status} attendance`)
        },
      },
    )
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDuration = (checkIn: number, checkOut?: number) => {
    if (!checkOut) return "In progress"
    const duration = checkOut - checkIn
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Overview</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approvals
            {pendingAttendance && pendingAttendance.length > 0 && (
              <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                {pendingAttendance.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Daily Attendance - {selectedDate.toLocaleDateString()}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dailyLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : dailyAttendance && dailyAttendance.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <div>
                            <p className="text-2xl font-bold">{dailyAttendance.length}</p>
                            <p className="text-xs text-muted-foreground">Total Check-ins</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <div>
                            <p className="text-2xl font-bold">
                              {dailyAttendance.filter(a => a.status === "approved").length}
                            </p>
                            <p className="text-xs text-muted-foreground">Approved</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-500" />
                          <div>
                            <p className="text-2xl font-bold">
                              {dailyAttendance.filter(a => a.status === "pending").length}
                            </p>
                            <p className="text-xs text-muted-foreground">Pending</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <div>
                            <p className="text-2xl font-bold">
                              {dailyAttendance.filter(a => a.status === "rejected").length}
                            </p>
                            <p className="text-xs text-muted-foreground">Rejected</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Attendance List */}
                  <div className="space-y-3">
                    {dailyAttendance.map((record) => (
                      <div
                        key={record._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedAttendance(record)}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={record.user?.image || "/placeholder.svg"} />
                            <AvatarFallback>
                              {record.user?.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{record.user?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {record.workLocation === "home" ? "Work from Home" : "Office"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm">
                              {formatTime(record.checkInTime)} - {record.checkOutTime ? formatTime(record.checkOutTime) : "In progress"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDuration(record.checkInTime, record.checkOutTime)}
                            </p>
                          </div>
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No attendance records for this date</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pendingAttendance && pendingAttendance.length > 0 ? (
                <div className="space-y-4">
                  {pendingAttendance.map((record) => (
                    <div
                      key={record._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedAttendance(record)}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={record.user?.image || "/placeholder.svg"} />
                          <AvatarFallback>
                            {record.user?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{record.user?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.date).toLocaleDateString()} - {record.workLocation === "home" ? "Work from Home" : "Office"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm">
                            {formatTime(record.checkInTime)} - {record.checkOutTime ? formatTime(record.checkOutTime) : "In progress"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDuration(record.checkInTime, record.checkOutTime)}
                          </p>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending attendance approvals</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Attendance Detail Dialog */}
      <Dialog open={!!selectedAttendance} onOpenChange={() => setSelectedAttendance(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Attendance Review - {selectedAttendance?.user?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedAttendance && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Employee</h4>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedAttendance.user?.image || "/placeholder.svg"} />
                      <AvatarFallback>
                        {selectedAttendance.user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedAttendance.user?.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedAttendance.user?.email}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Date</h4>
                  <p className="text-lg">{new Date(selectedAttendance.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Check In</h4>
                  <p className="text-2xl font-bold">{formatTime(selectedAttendance.checkInTime)}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAttendance.workLocation === "home" ? "Work from Home" : "Office"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Check Out</h4>
                  <p className="text-2xl font-bold">
                    {selectedAttendance.checkOutTime ? formatTime(selectedAttendance.checkOutTime) : "Not checked out"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {formatDuration(selectedAttendance.checkInTime, selectedAttendance.checkOutTime)}
                  </p>
                </div>
              </div>

              {selectedAttendance.location && (
                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  <p className="text-sm text-muted-foreground">{selectedAttendance.location}</p>
                </div>
              )}

              {selectedAttendance.checkInNotes && (
                <div>
                  <h4 className="font-medium mb-2">Check-in Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedAttendance.checkInNotes}</p>
                </div>
              )}

              {selectedAttendance.tasks && (
                <div>
                  <h4 className="font-medium mb-2">Tasks & Accomplishments</h4>
                  <div 
                    className="prose prose-sm max-w-none border rounded-lg p-4 bg-muted/20"
                    dangerouslySetInnerHTML={{ __html: selectedAttendance.tasks }}
                  />
                </div>
              )}

              {selectedAttendance.status === "pending" && (
                <div className="space-y-4">
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
                    <Button
                      onClick={() => handleStatusUpdate("approved")}
                      disabled={isUpdating}
                      className="flex-1"
                    >
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
                </div>
              )}

              {selectedAttendance.status !== "pending" && (
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  {getStatusBadge(selectedAttendance.status)}
                  {selectedAttendance.adminNotes && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">{selectedAttendance.adminNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
