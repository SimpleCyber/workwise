import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

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
