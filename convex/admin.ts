import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Admin emails from environment variable (comma-separated)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "satyamyadav9uv@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

// Helper: verify current user is the super-admin
async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const user = await ctx.db.get(userId);
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase())) {
    throw new Error("Unauthorized: admin access required");
  }
  return user;
}

// ── Queries ──────────────────────────────────────────────

export const getFeatureFlags = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("featureFlags").collect();
  },
});

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    return ADMIN_EMAILS.includes(user?.email?.toLowerCase() ?? "");
  },
});

export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [
      workspaces,
      members,
      dataRoomFiles,
      projectBoards,
      todoBoards,
      attendance,
    ] = await Promise.all([
      ctx.db.query("workspaces").collect(),
      ctx.db.query("members").collect(),
      ctx.db.query("dataRoomFiles").collect(),
      ctx.db.query("projectBoards").collect(),
      ctx.db.query("todoBoards").collect(),
      ctx.db.query("attendance").collect(),
    ]);

    return {
      workspaces: workspaces.length,
      members: members.length,
      files: dataRoomFiles.length,
      projects: projectBoards.length,
      todoBoards: todoBoards.length,
      attendanceRecords: attendance.length,
    };
  },
});

// ── Mutations ────────────────────────────────────────────

export const setFeatureFlag = mutation({
  args: {
    key: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const existing = await ctx.db
      .query("featureFlags")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!existing) throw new Error(`Feature flag "${args.key}" not found`);

    await ctx.db.patch(existing._id, {
      enabled: args.enabled,
      updatedAt: Date.now(),
      updatedBy: admin.email,
    });

    return { success: true };
  },
});

const DEFAULT_FLAGS = [
  {
    key: "data_room_tools",
    label: "Data Room PDF Tools",
    description: "Merge PDFs and create PDFs from images in the Data Room",
    enabled: false,
  },
  {
    key: "attendance",
    label: "Attendance Tracking",
    description: "Employee check-in/check-out and attendance management",
    enabled: true,
  },
  {
    key: "calendar",
    label: "Calendar & Events",
    description: "Calendar events and Google Calendar integration",
    enabled: true,
  },
  {
    key: "projects",
    label: "Project Management",
    description: "Project boards, task lists, and task assignment",
    enabled: true,
  },
  {
    key: "todos",
    label: "Todo Boards",
    description: "Personal and team kanban-style todo boards",
    enabled: true,
  },
  {
    key: "tree_planning",
    label: "Tree Planning",
    description: "Hierarchical tree-based planning and mapping",
    enabled: true,
  },
  {
    key: "data_room",
    label: "Data Room",
    description: "File storage, folders, and document management",
    enabled: true,
  },
  {
    key: "messaging",
    label: "Messaging & Channels",
    description: "Workspace channels, direct messages, and threads",
    enabled: true,
  },
  {
    key: "task_comments",
    label: "Task Comments",
    description: "Enable activity and comment feeds on task cards",
    enabled: true,
  },
  {
    key: "mail",
    label: "Email Client",
    description: "In-platform email inbox and client",
    enabled: true,
  },
];

export const seedFeatureFlags = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const existing = await ctx.db.query("featureFlags").collect();
    const existingKeys = new Set(existing.map((f) => f.key));

    let seeded = 0;
    for (const flag of DEFAULT_FLAGS) {
      if (!existingKeys.has(flag.key)) {
        await ctx.db.insert("featureFlags", {
          ...flag,
          updatedAt: Date.now(),
        });
        seeded++;
      }
    }

    return { seeded, total: existing.length + seeded };
  },
});
