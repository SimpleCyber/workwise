import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export const useGetNotifications = (limit?: number) => {
  const data = useQuery(api.notifications.getUserNotifications, { limit });
  const isLoading = data === undefined;
  return { data: data || [], isLoading };
};

export const useGetUnreadCount = () => {
  const data = useQuery(api.notifications.getUnreadCount);
  const isLoading = data === undefined;
  return { data: data || 0, isLoading };
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
