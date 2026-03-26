import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export type NotificationCategory =
  | "all"
  | "attendance"
  | "projects"
  | "dataroom";

export type NotificationType =
  | "attendance_submitted"
  | "attendance_approved"
  | "attendance_rejected"
  | "attendance_action_by_admin"
  | "attendance_checkout"
  | "document_uploaded"
  | "document_shared"
  | "task_assigned"
  | "task_status_changed"
  | "task_completed"
  | "task_on_hold"
  | "task_comment_added";

export interface NotificationData {
  _id: Id<"notifications">;
  _creationTime: number;
  userId: Id<"users">;
  workspaceId: Id<"workspaces">;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  actionBy?: Id<"users">;
  isRead: boolean;
  createdAt: number;
  emailSent: boolean;
  workspace?: {
    _id: Id<"workspaces">;
    name: string;
    [key: string]: any;
  } | null;
  user?: {
    _id: Id<"users">;
    name?: string;
    email?: string;
    [key: string]: any;
  } | null;
  actionUser?: {
    _id: Id<"users">;
    name?: string;
    email?: string;
    [key: string]: any;
  } | null;
  hasBeenProcessed?: boolean;
}

// Original user-specific hooks
export const useGetNotifications = (
  limit?: number,
  category?: "all" | "attendance" | "projects" | "dataroom",
) => {
  return useQuery(api.notifications.getUserNotifications, { limit, category });
};

export const useGetUnreadCount = (
  category?: "all" | "attendance" | "projects" | "dataroom",
) => {
  return useQuery(api.notifications.getUnreadCount, { category });
};

export const useMarkAsRead = () => {
  return useMutation(api.notifications.markAsRead);
};

export const useMarkAllAsRead = () => {
  return useMutation(api.notifications.markAllAsRead);
};

export const useDeleteNotification = () => {
  return useMutation(api.notifications.deleteNotification);
};

export const useCreateNotification = () => {
  return useMutation(api.notifications.createNotification);
};

// Admin-specific hooks
export const useGetAllNotifications = (
  limit?: number,
  category?: NotificationCategory,
  workspaceId?: Id<"workspaces">,
  userId?: Id<"users">,
  isRead?: boolean,
  emailSent?: boolean,
) => {
  return useQuery(api.notifications.getAllNotifications, {
    limit,
    category,
    workspaceId,
    userId,
    isRead,
    emailSent,
  });
};

export const useGetNotificationStats = (workspaceId?: Id<"workspaces">) => {
  return useQuery(api.notifications.getNotificationStats, { workspaceId });
};

export const useMarkEmailAsSent = () => {
  return useMutation(api.notifications.markEmailAsSent);
};
