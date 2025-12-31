"use client";

import type React from "react";

import { useAtom } from "jotai";
import { notificationOpenAtom } from "@/lib/panel-atoms";
import {
  useGetNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useGetUnreadCount,
} from "@/hooks/use-notifications";
import { useUpdateAttendanceStatus } from "@/hooks/use-update-attendance-status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  UserCheck,
  UserX,
  Building,
  FileText,
  Briefcase,
  MessageSquare,
  CheckCircle,
  Users,
  FolderOpen,
  GripVertical,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface Position {
  x: number;
  y: number;
}

export const DraggableNotificationPanel = () => {
  const [open, setOpen] = useAtom(notificationOpenAtom);
  const [activeCategory, setActiveCategory] = useState<
    "all" | "attendance" | "projects" | "dataroom"
  >("all");
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const notifications = useGetNotifications(50, activeCategory);
  const unreadCount = useGetUnreadCount(activeCategory);
  const isLoading = notifications === undefined;
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();
  const updateAttendanceStatus = useUpdateAttendanceStatus();

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem("notification-panel-position");
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    } else {
      // Default position - center top
      setPosition({ x: window.innerWidth / 2 - 200, y: 80 });
    }
  }, []);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem(
      "notification-panel-position",
      JSON.stringify(position),
    );
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".no-drag")) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Keep within viewport bounds
    const maxX = window.innerWidth - 400;
    const maxY = window.innerHeight - 100;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  if (!open) return null;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({ notificationId: notificationId as any });
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({ category: activeCategory });
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification({ notificationId: notificationId as any });
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const handleAttendanceAction = async (
    attendanceId: string,
    action: "approved" | "rejected",
  ) => {
    try {
      await updateAttendanceStatus({
        attendanceId: attendanceId as any,
        status: action,
      });
      toast.success(`Attendance ${action} successfully!`);
    } catch (error) {
      toast.error(`Failed to ${action.slice(0, -1)} attendance`);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconClass = "w-4 h-4 text-muted-foreground";
    switch (type) {
      case "attendance_submitted":
      case "attendance_checkout":
        return <Clock className={iconClass} />;
      case "attendance_approved":
        return <UserCheck className={`w-4 h-4 text-green-600`} />;
      case "attendance_rejected":
        return <UserX className={`w-4 h-4 text-red-600`} />;
      case "document_uploaded":
      case "document_shared":
        return <FileText className={iconClass} />;
      case "task_assigned":
      case "task_status_changed":
        return <Briefcase className={iconClass} />;
      case "task_completed":
        return <CheckCircle className={`w-4 h-4 text-green-600`} />;
      case "task_comment_added":
        return <MessageSquare className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getActionUrl = (notification: any) => {
    if (notification.type.includes("attendance")) {
      return `/attendance/${notification.workspaceId}`;
    }
    if (notification.type.includes("document")) {
      return `/tree/${notification.workspaceId}`;
    }
    if (notification.type.includes("task")) {
      return `/dashboard/${notification.workspaceId}/projects`;
    }
    return `/tree/${notification.workspaceId}`;
  };

  const canShowAttendanceActions = (notification: any) => {
    return (
      notification.type === "attendance_submitted" &&
      notification.relatedId &&
      !notification.hasBeenProcessed
    );
  };

  const getAttendanceStatusBadge = (notification: any) => {
    if (notification.type !== "attendance_submitted") {
      return null;
    }
    if (notification.hasBeenProcessed) {
      return (
        <Badge className="text-xs bg-green-500/10 text-green-500 border-0">
          Marked
        </Badge>
      );
    }
    return (
      <Badge className="text-xs bg-yellow-500/10 text-yellow-500 border-0">
        Pending
      </Badge>
    );
  };

  return (
    <Card
      ref={cardRef}
      className="fixed z-50 w-96 bg-card shadow-2xl border border-border max-h-[80vh] flex flex-col"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      {/* Draggable Header */}
      <CardHeader
        className="flex flex-row items-center justify-between p-4 border-b border-border cursor-grab active:cursor-grabbing bg-gradient-to-r from-muted/50 to-card"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <Bell className="w-5 h-5 text-foreground/80" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Notifications
            </h2>
            {unreadCount! > 0 && (
              <Badge className="text-xs bg-blue-500 hover:bg-blue-600">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 no-drag">
          {unreadCount! > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="w-8 h-8 p-0 rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden">
        <Tabs
          value={activeCategory}
          onValueChange={(value) => setActiveCategory(value as any)}
          className="w-full h-full flex flex-col"
        >
          <div className="p-4 border-b border-border no-drag">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger
                value="all"
                className="flex items-center gap-1 text-xs"
              >
                <Bell className="w-3 h-3" />
                All
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="flex items-center gap-1 text-xs"
              >
                <Users className="w-3 h-3" />
                Attend
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="flex items-center gap-1 text-xs"
              >
                <Briefcase className="w-3 h-3" />
                Projects
              </TabsTrigger>
              <TabsTrigger
                value="dataroom"
                className="flex items-center gap-1 text-xs"
              >
                <FolderOpen className="w-3 h-3" />
                Docs
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value={activeCategory}
            className="mt-0 flex-1 overflow-hidden"
          >
            <ScrollArea className="h-[400px] no-drag">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No notifications
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You are all caught up!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-muted/50 transition-colors ${
                        !notification.isRead ? "bg-blue-500/10" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium text-foreground">
                                  {notification.title}
                                </h4>
                                {getAttendanceStatusBadge(notification)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                <div className="flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  <span>
                                    {notification.workspace?.name ||
                                      "Unknown Workspace"}
                                  </span>
                                </div>
                                {notification.actionUser && (
                                  <div className="flex items-center gap-1">
                                    <Avatar className="w-3 h-3">
                                      <AvatarImage
                                        src={
                                          notification.actionUser.image ||
                                          "/placeholder.svg" ||
                                          "/placeholder.svg"
                                        }
                                      />
                                      <AvatarFallback className="text-xs">
                                        {notification.actionUser.name
                                          ?.charAt(0)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{notification.actionUser.name}</span>
                                  </div>
                                )}
                                <span>
                                  {formatDistanceToNow(
                                    new Date(notification.createdAt),
                                    {
                                      addSuffix: true,
                                    },
                                  )}
                                </span>
                              </div>

                              {canShowAttendanceActions(notification) && (
                                <div className="flex gap-2 mb-3">
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                    onClick={() =>
                                      handleAttendanceAction(
                                        notification.relatedId!,
                                        "approved",
                                      )
                                    }
                                  >
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 text-xs"
                                    onClick={() =>
                                      handleAttendanceAction(
                                        notification.relatedId!,
                                        "rejected",
                                      )
                                    }
                                  >
                                    <UserX className="w-3 h-3 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}

                              {notification.type === "attendance_submitted" &&
                                notification.relatedId &&
                                notification.hasBeenProcessed && (
                                  <div className="text-xs text-muted-foreground mb-3 italic">
                                    This attendance has already been marked by
                                    an admin.
                                  </div>
                                )}

                              <div className="flex items-center gap-2">
                                <Link href={getActionUrl(notification)}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs bg-transparent"
                                    onClick={() => {
                                      if (!notification.isRead) {
                                        handleMarkAsRead(notification._id);
                                      }
                                      setOpen(false);
                                    }}
                                  >
                                    View
                                  </Button>
                                </Link>
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-muted-foreground"
                                    onClick={() =>
                                      handleMarkAsRead(notification._id)
                                    }
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Mark read
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                                onClick={() =>
                                  handleDeleteNotification(notification._id)
                                }
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
