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

export const getLead = query({
  args: { leadId: v.id("salesLeads") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    return await ctx.db.get(args.leadId);
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
      }),
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

export const getCallLogs = query({
  args: {
    leadId: v.id("salesLeads"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const logs = await ctx.db
      .query("callLogs")
      .withIndex("by_lead", (q) => q.eq("leadId", args.leadId))
      .order("desc")
      .collect();

    return Promise.all(
      logs.map(async (log) => {
        const agent = await ctx.db.get(log.agentId);
        const user = agent ? await ctx.db.get(agent.userId) : null;
        return {
          ...log,
          agentName: user?.name || "Unknown",
          agentAvatar: user?.image || null,
        };
      }),
    );
  },
});

export const logCall = mutation({
  args: {
    leadId: v.id("salesLeads"),
    disposition: v.union(
      v.literal("rejected"),
      v.literal("no_answer"),
      v.literal("retry_scheduled"),
      v.literal("meeting_scheduled"),
      v.literal("won"),
      v.literal("lost"),
    ),
    notes: v.optional(v.string()),
    nextActionAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", lead.workspaceId).eq("userId", userId),
      )
      .unique();

    if (!member) throw new Error("Member not found");

    const now = Date.now();
    await ctx.db.insert("callLogs", {
      leadId: args.leadId,
      agentId: member._id,
      disposition: args.disposition,
      notes: args.notes,
      nextActionAt: args.nextActionAt,
      timestamp: now,
    });

    let nextStage: any = lead.stage;
    if (args.disposition === "rejected" || args.disposition === "lost")
      nextStage = "rejected";
    else if (args.disposition === "retry_scheduled") nextStage = "retry";
    else if (args.disposition === "meeting_scheduled") nextStage = "scheduled";
    else if (args.disposition === "won") nextStage = "won";
    else nextStage = "contacted";

    await ctx.db.patch(args.leadId, {
      stage: nextStage,
      updatedAt: now,
    });
  },
});
