"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttendanceDetailModal } from "./attendance-detail-modal"
import type { Id } from "@/../convex/_generated/dataModel"
import { useGetUserAttendance } from "../api/use-get-user-attendance"

interface CleanUserCalendarProps {
  workspaceId: Id<"workspaces">
}

export const CleanUserCalendar = ({ workspaceId }: CleanUserCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")

  const { data: attendance, isLoading } = useGetUserAttendance({
    workspaceId,
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
  })

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getAttendanceForDate = (date: Date) => {
    if (!attendance) return null
    return attendance.find((record) => {
      const recordDate = new Date(record.date)
      return (
        recordDate.getDate() === date.getDate() &&
        recordDate.getMonth() === date.getMonth() &&
        recordDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      case "pending":
        return "bg-yellow-500"
      case "absent":
        return "bg-gray-500"
      default:
        return "bg-gray-300"
    }
  }

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Attendance</h1>
          <p className="text-muted-foreground">View your attendance history and add comments</p>
        </div>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "calendar" | "list")}>
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={viewMode} className="space-y-4">
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentDate).map((date, index) => {
                  if (!date) {
                    return <div key={index} className="p-2 h-24"></div>
                  }

                  const dayAttendance = getAttendanceForDate(date)
                  const isToday = date.toDateString() === new Date().toDateString()

                  return (
                    <div
                      key={date.toISOString()}
                      className={`p-2 h-24 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors group ${
                        isToday ? "border-primary bg-primary/5" : "border-border"
                      } ${dayAttendance ? "hover:shadow-md" : ""}`}
                      onClick={() => dayAttendance && setSelectedAttendance(dayAttendance)}
                    >
                      <div className="flex flex-col h-full">
                        <span className={`text-sm ${isToday ? "font-bold text-primary" : ""}`}>{date.getDate()}</span>
                        {dayAttendance && (
                          <div className="flex-1 flex flex-col justify-center items-center gap-1">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(dayAttendance.status)}`}></div>
                            <div className="text-center">
                              <span className="text-xs text-muted-foreground block">
                                {formatTime(dayAttendance.checkInTime)}
                              </span>
                              {dayAttendance.checkOutTime && (
                                <span className="text-xs text-muted-foreground block">
                                  {formatTime(dayAttendance.checkOutTime)}
                                </span>
                              )}
                            </div>
                            <MessageSquare className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendance && attendance.length > 0 ? (
                  attendance
                    .sort((a, b) => b.date - a.date)
                    .map((record) => (
                      <div
                        key={record._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors"
                        onClick={() => setSelectedAttendance(record)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(record.status)}`}></div>
                          <div>
                            <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                            <p className="text-sm text-muted-foreground">
                              {record.status === "absent"
                                ? "Absent"
                                : record.workLocation === "home"
                                  ? "Work from Home"
                                  : "Office"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm">
                              In: {formatTime(record.checkInTime)}
                              {record.checkOutTime && ` | Out: ${formatTime(record.checkOutTime)}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDuration(record.checkInTime, record.checkOutTime)}
                            </p>
                          </div>
                          <MessageSquare className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No attendance records</p>
                    <p className="text-sm">No records found for this month</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Attendance Detail Modal */}
      <AttendanceDetailModal
        attendance={selectedAttendance}
        workspaceId={workspaceId}
        isOpen={!!selectedAttendance}
        onClose={() => setSelectedAttendance(null)}
        isAdmin={false}
      />
    </div>
  )
}
