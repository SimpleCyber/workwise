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
  ChevronRight,
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
    const iconClass = "w-4 h-4";
    switch (type) {
      case "attendance_submitted":
        return <Clock className={`${iconClass} text-amber-500`} />;
      case "attendance_approved":
        return <UserCheck className={`${iconClass} text-emerald-500`} />;
      case "attendance_rejected":
        return <UserX className={`${iconClass} text-rose-500`} />;
      case "attendance_action_by_admin":
        return <Settings className={`${iconClass} text-blue-500`} />;
      case "attendance_checkout":
        return <LogOut className={`${iconClass} text-purple-500`} />;
      case "document_uploaded":
        return <FileText className={`${iconClass} text-blue-500`} />;
      case "document_shared":
        return <Share className={`${iconClass} text-emerald-500`} />;
      case "task_assigned":
        return <Briefcase className={`${iconClass} text-blue-500`} />;
      case "task_status_changed":
        return <AlertTriangle className={`${iconClass} text-orange-500`} />;
      case "task_completed":
        return <CheckCircle className={`${iconClass} text-emerald-500`} />;
      case "task_on_hold":
        return <Pause className={`${iconClass} text-rose-500`} />;
      case "task_comment_added":
        return <MessageSquare className={`${iconClass} text-blue-500`} />;
      default:
        return <Bell className={`${iconClass} text-slate-500`} />;
    }
  };

  const getNotificationAccent = (type: string) => {
    switch (type) {
      case "attendance_submitted":
        return "before:bg-amber-400";
      case "attendance_approved":
        return "before:bg-emerald-400";
      case "attendance_rejected":
        return "before:bg-rose-400";
      case "attendance_action_by_admin":
        return "before:bg-blue-400";
      case "attendance_checkout":
        return "before:bg-purple-400";
      case "document_uploaded":
        return "before:bg-blue-400";
      case "document_shared":
        return "before:bg-emerald-400";
      case "task_assigned":
        return "before:bg-blue-400";
      case "task_status_changed":
        return "before:bg-orange-400";
      case "task_completed":
        return "before:bg-emerald-400";
      case "task_on_hold":
        return "before:bg-rose-400";
      case "task_comment_added":
        return "before:bg-blue-400";
      default:
        return "before:bg-slate-400";
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
    <div className="fixed  right-0 z-50 w-96 h-full bg-white shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Notifications
            </h2>
            {unreadCount! > 0 && (
              <Badge
                variant="destructive"
                className="text-xs mt-1 bg-rose-500 hover:bg-rose-600"
              >
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount! > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="rounded-full w-8 h-8 p-0 hover:bg-slate-100 transition-colors"
          >
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
        <div className="px-4 pt-4 pb-2">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 rounded-xl p-1">
            <TabsTrigger
              value="all"
              className="flex items-center gap-1 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <Bell className="w-3 h-3" />
              All
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="flex items-center gap-1 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <Users className="w-3 h-3" />
              Attend
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="flex items-center gap-1 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <Briefcase className="w-3 h-3" />
              Projects
            </TabsTrigger>
            <TabsTrigger
              value="dataroom"
              className="flex items-center gap-1 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <FolderOpen className="w-3 h-3" />
              Docs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeCategory} className="mt-0">
          {/* Content */}
          <ScrollArea className="h-[calc(100vh-180px)]">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="p-4 rounded-full bg-slate-100 mb-4">
                  {getCategoryIcon(activeCategory)}
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No notifications
                </h3>
                <p className="text-sm text-slate-500">
                  You are all caught up! 🎉
                </p>
              </div>
            ) : (
              <div className="px-3 pb-6">
                {notifications.map((notification, index) => (
                  <div
                    key={notification._id}
                    className={`group relative mb-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-md hover:border-slate-300 ${
                      !notification.isRead
                        ? "bg-blue-50/50 border-blue-100 shadow-sm"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    } before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:rounded-full ${getNotificationAccent(notification.type)}`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5 p-2 rounded-lg bg-white shadow-sm border border-slate-200">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                              {notification.message}
                            </p>

                            {/* Workspace and User Info */}
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-1.5">
                                <Building className="w-3 h-3 text-slate-400" />
                                <span className="text-xs text-slate-500 font-medium">
                                  {notification.workspace?.name ||
                                    "Unknown Workspace"}
                                </span>
                              </div>

                              {notification.actionUser && (
                                <div className="flex items-center gap-1.5">
                                  <Avatar className="w-4 h-4">
                                    <AvatarImage
                                      src={
                                        notification.actionUser.image ||
                                        "/placeholder.svg"
                                      }
                                    />
                                    <AvatarFallback className="text-xs bg-slate-200">
                                      {notification.actionUser.name
                                        ?.charAt(0)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-slate-500">
                                    {notification.actionUser.name}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Admin Actions for Attendance */}
                            {canShowAttendanceActions(notification) && (
                              <div className="flex items-center gap-2 mb-3">
                                <Button
                                  size="sm"
                                  className="text-xs h-7 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
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
                                  className="text-xs h-7 bg-rose-500 hover:bg-rose-600 shadow-sm"
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Link href={getActionUrl(notification)}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7 bg-white hover:bg-slate-50 border-slate-200 shadow-sm group"
                                    onClick={() => {
                                      if (!notification.isRead) {
                                        handleMarkAsRead(notification._id);
                                      }
                                      setOpen(false);
                                    }}
                                  >
                                    View Details
                                    <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                                  </Button>
                                </Link>

                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-7 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                    onClick={() =>
                                      handleMarkAsRead(notification._id)
                                    }
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Mark read
                                  </Button>
                                )}
                              </div>

                              <span className="text-xs text-slate-400 font-medium">
                                {formatDistanceToNow(
                                  new Date(notification.createdAt),
                                  {
                                    addSuffix: true,
                                  },
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50"
                              onClick={() =>
                                handleDeleteNotification(notification._id)
                              }
                            >
                              <Trash2 className="w-3 h-3 text-slate-400 hover:text-rose-500 transition-colors" />
                            </Button>

                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
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
    </div>
  );
};
