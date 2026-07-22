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
  // 1. Header & Global Buttons
  {
    key: "header_notifications",
    label: "Header Notifications Button",
    description: "Toggle the Notifications drawer button in the header/sidebar",
    enabled: true,
  },
  {
    key: "header_calendar",
    label: "Header Calendar Button",
    description: "Toggle the Calendar drawer button in the header/sidebar",
    enabled: true,
  },
  {
    key: "header_notes",
    label: "Header Personal Notes Button",
    description:
      "Toggle the Personal Notes drawer button in the header/sidebar",
    enabled: true,
  },

  // 2. Planning / Test Page Controls
  {
    key: "tree_planning",
    label: "Planning Page Access",
    description:
      "Enable or disable access to the interactive Planning / Test page",
    enabled: true,
  },
  {
    key: "planning_left_column",
    label: "Planning Minimap / Left Column",
    description:
      "Enable or disable the minimap / left overview column box on the planning page",
    enabled: true,
  },
  {
    key: "planning_side_panel",
    label: "Planning Node Click Side Panel",
    description: "Allow opening the side detail panel when clicking tree nodes",
    enabled: true,
  },
  {
    key: "planning_side_panel_ai_chat",
    label: "Planning Side Panel AI Chat",
    description:
      "Enable the AI chat assistant inside the node detail side panel",
    enabled: true,
  },
  {
    key: "planning_double_click_actions",
    label: "Planning Node Double-Click Actions",
    description: "Enable double-click shortcuts to edit or expand nodes",
    enabled: true,
  },

  // 3. Project Section Controls
  {
    key: "projects",
    label: "Projects Section",
    description: "Enable or disable the main Projects section",
    enabled: true,
  },
  {
    key: "project_tree_view",
    label: "Project Tree View Format",
    description:
      "Allow tree visualization format in projects (disabling leaves list/grid format only)",
    enabled: true,
  },
  {
    key: "todos",
    label: "Todo Boards",
    description: "Personal and team kanban-style todo boards",
    enabled: true,
  },
  {
    key: "task_comments",
    label: "Task Comments & Activity",
    description: "Enable activity logs and comment feeds on task cards",
    enabled: true,
  },

  // 4. Chats Section Controls
  {
    key: "messaging",
    label: "Chats & Messaging Section",
    description: "Enable or disable the Workspace Messaging & Channels section",
    enabled: true,
  },
  {
    key: "chat_dms",
    label: "Direct Messages",
    description: "Enable direct 1-on-1 messaging between team members",
    enabled: true,
  },
  {
    key: "chat_threads_reactions",
    label: "Message Threads & Reactions",
    description: "Enable message reply threads and emoji reactions",
    enabled: true,
  },
  {
    key: "chat_file_attachments",
    label: "Chat File Attachments",
    description:
      "Allow uploading and sharing file attachments in chat messages",
    enabled: true,
  },

  // 5. Additional Tools
  {
    key: "data_room",
    label: "Data Room",
    description: "File storage, folders, and document management",
    enabled: true,
  },
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
