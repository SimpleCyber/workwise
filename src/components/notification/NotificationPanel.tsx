"use client";

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
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  UserCheck,
  UserX,
  Settings,
  Building,
  FileText,
  Share,
  LogOut,
  Briefcase,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Pause,
  Users,
  FolderOpen,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { useState } from "react";

export const NotificationPanel = () => {
  const [open, setOpen] = useAtom(notificationOpenAtom);
  const [activeCategory, setActiveCategory] = useState<
    "all" | "attendance" | "projects" | "dataroom"
  >("all");
  const notifications = useGetNotifications(50, activeCategory);
  const unreadCount = useGetUnreadCount(activeCategory);
  const isLoading = notifications === undefined;

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();
  const updateAttendanceStatus = useUpdateAttendanceStatus();

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
    switch (type) {
      case "attendance_submitted":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "attendance_approved":
        return <UserCheck className="w-4 h-4 text-green-500" />;
      case "attendance_rejected":
        return <UserX className="w-4 h-4 text-red-500" />;
      case "attendance_action_by_admin":
        return <Settings className="w-4 h-4 text-blue-500" />;
      case "attendance_checkout":
        return <LogOut className="w-4 h-4 text-purple-500" />;
      case "document_uploaded":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "document_shared":
        return <Share className="w-4 h-4 text-green-500" />;
      case "task_assigned":
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      case "task_status_changed":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "task_completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "task_on_hold":
        return <Pause className="w-4 h-4 text-red-500" />;
      case "task_comment_added":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "attendance_submitted":
        return "border-l-yellow-500";
      case "attendance_approved":
        return "border-l-green-500";
      case "attendance_rejected":
        return "border-l-red-500";
      case "attendance_action_by_admin":
        return "border-l-blue-500";
      case "attendance_checkout":
        return "border-l-purple-500";
      case "document_uploaded":
        return "border-l-blue-500";
      case "document_shared":
        return "border-l-green-500";
      case "task_assigned":
        return "border-l-blue-500";
      case "task_status_changed":
        return "border-l-orange-500";
      case "task_completed":
        return "border-l-green-500";
      case "task_on_hold":
        return "border-l-red-500";
      case "task_comment_added":
        return "border-l-blue-500";
      default:
        return "border-l-gray-500";
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
      notification.type === "attendance_submitted" && notification.relatedId
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "attendance":
        return <Users className="w-4 h-4" />;
      case "projects":
        return <Briefcase className="w-4 h-4" />;
      case "dataroom":
        return <FolderOpen className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed top-10 right-0 z-50 w-96 h-full bg-gray-300 p-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-400">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount! > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount! > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs
        value={activeCategory}
        onValueChange={(value) => setActiveCategory(value as any)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 bg-gray-200">
          <TabsTrigger value="all" className="flex items-center gap-1 text-xs">
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

        <TabsContent value={activeCategory} className="mt-0">
          {/* Content */}
          <ScrollArea className="h-[calc(100vh-140px)]">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                {getCategoryIcon(activeCategory)}
                <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">
                  No notifications
                </h3>
                <p className="text-sm text-gray-500">You are all caught up!</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-white bg-gray-50 border-l-4 ${getNotificationColor(notification.type)} ${
                      !notification.isRead ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>

                            {/* Workspace context */}
                            <div className="flex items-center gap-2 mb-2">
                              <Building className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {notification.workspace?.name ||
                                  "Unknown Workspace"}
                              </span>
                            </div>

                            {/* Action user */}
                            {notification.actionUser && (
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar className="w-4 h-4">
                                  <AvatarImage
                                    src={
                                      notification.actionUser.image ||
                                      "/placeholder.svg"
                                    }
                                  />
                                  <AvatarFallback className="text-xs">
                                    {notification.actionUser.name
                                      ?.charAt(0)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-gray-500">
                                  by {notification.actionUser.name}
                                </span>
                              </div>
                            )}

                            {/* Admin Actions for Attendance */}
                            {canShowAttendanceActions(notification) && (
                              <div className="flex items-center gap-2 mb-2">
                                <Button
                                  size="sm"
                                  className="text-xs h-6 bg-green-500 hover:bg-green-600 text-white"
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
                                  className="text-xs h-6"
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

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-2">
                              <Link href={getActionUrl(notification)}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 bg-transparent"
                                  onClick={() => {
                                    if (!notification.isRead) {
                                      handleMarkAsRead(notification._id);
                                    }
                                    setOpen(false);
                                  }}
                                >
                                  View Details
                                </Button>
                              </Link>

                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7"
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
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                handleDeleteNotification(notification._id)
                              }
                            >
                              <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                            </Button>

                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timestamp at bottom right */}
                    <div className="flex justify-end mt-2">
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
