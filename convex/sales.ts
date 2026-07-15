import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getLeads = query({
  args: { boardId: v.id("projectBoards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const leads = await ctx.db
      .query("salesLeads")
      .withIndex("by_board_id", (q) => q.eq("boardId", args.boardId))
      .collect();

    // attach member details manually for avatars
    const mappedLeads = await Promise.all(
      leads.map(async (lead) => {
        let assignedUser = null;
        if (lead.assignedToId) {
          const member = await ctx.db.get(lead.assignedToId);
          if (member) {
            const user = await ctx.db.get(member.userId);
            if (user) {
              assignedUser = {
                name: user.name,
                avatar: user.image,
              };
            }
          }
        }
        return {
          ...lead,
          name: lead.name || lead.contactName || "Unknown Contact",
          assignedUser,
        };
      }),
    );

    // filter out discarded leads
    return mappedLeads
      .filter((l) => !l.isDiscarded)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const addLead = mutation({
  args: {
    boardId: v.id("projectBoards"),
    workspaceId: v.id("workspaces"),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const leadId = await ctx.db.insert("salesLeads", {
      name: args.name,
      phone: args.phone,
      email: args.email,
      description: args.description,
      boardId: args.boardId,
      workspaceId: args.workspaceId,
      assignmentStatus: "unassigned",
      isDiscarded: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return leadId;
  },
});

export const addBulkLeads = mutation({
  args: {
    boardId: v.id("projectBoards"),
    workspaceId: v.id("workspaces"),
    leads: v.array(
      v.object({
        name: v.string(),
        phone: v.string(),
        email: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const now = Date.now();
    for (const lead of args.leads) {
      await ctx.db.insert("salesLeads", {
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        description: lead.description,
        boardId: args.boardId,
        workspaceId: args.workspaceId,
        assignmentStatus: "unassigned",
        isDiscarded: false,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const assignLead = mutation({
  args: {
    leadId: v.id("salesLeads"),
    memberId: v.id("members"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.leadId, {
      assignedToId: args.memberId,
      assignmentStatus: "assigned",
      updatedAt: Date.now(),
    });
  },
});

export const unassignLead = mutation({
  args: {
    leadId: v.id("salesLeads"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // We patch assignedToId explicitly to undefined
    await ctx.db.patch(args.leadId, {
      assignedToId: undefined,
      assignmentStatus: "unassigned",
      updatedAt: Date.now(),
    });
  },
});

export const updateLead = mutation({
  args: {
    leadId: v.id("salesLeads"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.leadId, {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.phone !== undefined && { phone: args.phone }),
      ...(args.email !== undefined && { email: args.email }),
      ...(args.description !== undefined && { description: args.description }),
      updatedAt: Date.now(),
    });
  },
});

export const discardLead = mutation({
  args: {
    leadId: v.id("salesLeads"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.leadId, {
      isDiscarded: true,
      updatedAt: Date.now(),
    });
  },
});
