import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a notification
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    type: v.union(
      v.literal("attendance_submitted"),
      v.literal("attendance_approved"),
      v.literal("attendance_rejected"),
      v.literal("attendance_action_by_admin"),
      v.literal("attendance_checkout"),
      v.literal("document_uploaded"),
      v.literal("document_shared"),
      v.literal("task_assigned"),
      v.literal("task_status_changed"),
      v.literal("task_completed"),
      v.literal("task_on_hold"),
      v.literal("task_comment_added"),
    ),
    title: v.string(),
    message: v.string(),
    relatedId: v.optional(v.string()),
    actionBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      workspaceId: args.workspaceId,
      type: args.type,
      title: args.title,
      message: args.message,
      relatedId: args.relatedId,
      actionBy: args.actionBy,
      isRead: false,
      createdAt: Date.now(),
    });
    return notificationId;
  },
});

// Get user notifications across all workspaces
export const getUserNotifications = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(
      v.union(
        v.literal("all"),
        v.literal("attendance"),
        v.literal("projects"),
        v.literal("dataroom"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 50);

    // Filter by category if specified
    if (args.category && args.category !== "all") {
      notifications = notifications.filter((notification) => {
        switch (args.category) {
          case "attendance":
            return notification.type.includes("attendance");
          case "projects":
            return notification.type.includes("task");
          case "dataroom":
            return notification.type.includes("document");
          default:
            return true;
        }
      });
    }

    // Populate workspace, action user data, and attendance status
    const notificationsWithData = await Promise.all(
      notifications.map(async (notification) => {
        const workspace = await ctx.db.get(notification.workspaceId);
        const actionUser = notification.actionBy
          ? await ctx.db.get(notification.actionBy)
          : null;

        // Check if there are any approval/rejection notifications for this attendance
        let hasBeenProcessed = false;
        if (
          notification.type === "attendance_submitted" &&
          notification.relatedId
        ) {
          const processedNotifications = await ctx.db
            .query("notifications")
            .filter((q) =>
              q.and(
                q.eq(q.field("relatedId"), notification.relatedId),
                q.or(
                  q.eq(q.field("type"), "attendance_approved"),
                  q.eq(q.field("type"), "attendance_rejected"),
                ),
              ),
            )
            .first();

          hasBeenProcessed = !!processedNotifications;
        }

        return {
          ...notification,
          workspace,
          actionUser,
          hasBeenProcessed,
        };
      }),
    );

    return notificationsWithData;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error("Notification not found or unauthorized");
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });

    return args.notificationId;
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: {
    category: v.optional(
      v.union(
        v.literal("all"),
        v.literal("attendance"),
        v.literal("projects"),
        v.literal("dataroom"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    let unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    // Filter by category if specified
    if (args.category && args.category !== "all") {
      unreadNotifications = unreadNotifications.filter((notification) => {
        switch (args.category) {
          case "attendance":
            return notification.type.includes("attendance");
          case "projects":
            return notification.type.includes("task");
          case "dataroom":
            return notification.type.includes("document");
          default:
            return true;
        }
      });
    }

    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, { isRead: true }),
      ),
    );

    return unreadNotifications.length;
  },
});

// Get unread notification count
export const getUnreadCount = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("all"),
        v.literal("attendance"),
        v.literal("projects"),
        v.literal("dataroom"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    let unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    // Filter by category if specified
    if (args.category && args.category !== "all") {
      unreadNotifications = unreadNotifications.filter((notification) => {
        switch (args.category) {
          case "attendance":
            return notification.type.includes("attendance");
          case "projects":
            return notification.type.includes("task");
          case "dataroom":
            return notification.type.includes("document");
          default:
            return true;
        }
      });
    }

    return unreadNotifications.length;
  },
});

// Delete notification
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error("Notification not found or unauthorized");
    }

    await ctx.db.delete(args.notificationId);
    return args.notificationId;
  },
});
