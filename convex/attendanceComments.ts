import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Add comment to attendance
export const addComment = mutation({
  args: {
    attendanceId: v.id("attendance"),
    content: v.string(),
    image: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Unauthorized.")

    const attendance = await ctx.db.get(args.attendanceId)
    if (!attendance) throw new Error("Attendance record not found.")

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", attendance.workspaceId).eq("userId", userId))
      .unique()

    if (!member) throw new Error("Not a member of this workspace.")

    const commentId = await ctx.db.insert("attendanceComments", {
      attendanceId: args.attendanceId,
      memberId: member._id,
      workspaceId: attendance.workspaceId,
      content: args.content,
      image: args.image,
      createdAt: Date.now(),
    })

    return commentId
  },
})

// Get comments for attendance
export const getComments = query({
  args: {
    attendanceId: v.id("attendance"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    // Validate attendanceId exists
    if (!args.attendanceId) return []

    const attendance = await ctx.db.get(args.attendanceId)
    if (!attendance) return []

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", attendance.workspaceId).eq("userId", userId))
      .unique()

    if (!member) return []

    const comments = await ctx.db
      .query("attendanceComments")
      .withIndex("by_attendance_id", (q) => q.eq("attendanceId", args.attendanceId))
      .collect()

    // Populate member and user data
    const commentsWithMembers = await Promise.all(
      comments.map(async (comment) => {
        const commentMember = await ctx.db.get(comment.memberId)
        const user = commentMember ? await ctx.db.get(commentMember.userId) : null
        return {
          ...comment,
          member: commentMember,
          user,
        }
      }),
    )

    return commentsWithMembers.sort((a, b) => a.createdAt - b.createdAt)
  },
})
