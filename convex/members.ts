import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Get all members in a workspace
export const get = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .unique()

    if (!member) return []

    const data = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    const members = []

    for (const member of data) {
      const user = await ctx.db.get(member.userId)

      if (user) {
        members.push({
          ...member,
          user,
        })
      }
    }

    return members
  },
})

// Get current member
export const current = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .unique()

    if (!member) return null

    const user = await ctx.db.get(member.userId)

    if (!user) return null

    return {
      ...member,
      user,
    }
  },
})

// Update member role (admin only)
export const updateRole = mutation({
  args: {
    memberId: v.id("members"),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("lead")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Unauthorized")

    const member = await ctx.db.get(args.memberId)
    if (!member) throw new Error("Member not found")

    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", member.workspaceId).eq("userId", userId))
      .unique()

    if (!currentMember || currentMember.role !== "admin") {
      throw new Error("Only admins can update member roles")
    }

    // Prevent self-demotion from admin
    if (currentMember._id === args.memberId && args.role !== "admin") {
      throw new Error("Cannot demote yourself from admin role")
    }

    await ctx.db.patch(args.memberId, {
      role: args.role,
    })

    return args.memberId
  },
})

// Remove member (admin only)
export const remove = mutation({
  args: {
    memberId: v.id("members"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Unauthorized")

    const member = await ctx.db.get(args.memberId)
    if (!member) throw new Error("Member not found")

    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", member.workspaceId).eq("userId", userId))
      .unique()

    if (!currentMember || currentMember.role !== "admin") {
      throw new Error("Only admins can remove members")
    }

    // Prevent self-removal
    if (currentMember._id === args.memberId) {
      throw new Error("Cannot remove yourself")
    }

    await ctx.db.delete(args.memberId)

    return args.memberId
  },
})

// Get member statistics
export const getStats = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .unique()

    if (!currentMember) return null

    const members = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    const stats = {
      total: members.length,
      admins: members.filter((m) => m.role === "admin").length,
      leads: members.filter((m) => m.role === "lead").length,
      members: members.filter((m) => m.role === "member").length,
    }

    return stats
  },
})
