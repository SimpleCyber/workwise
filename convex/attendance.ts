import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Helper function to get start and end of day in local timezone
const getDayBounds = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
  return { start: start.getTime(), end: end.getTime() }
}

// Check in
export const checkIn = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    workLocation: v.union(v.literal("office"), v.literal("home")),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Unauthorized.")

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .unique()

    if (!member) throw new Error("Not a member of this workspace.")

    // Check if already checked in today (using current date bounds)
    const today = new Date()
    const { start, end } = getDayBounds(today)

    const existingAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_member_id_date", (q) => q.eq("memberId", member._id))
      .filter((q) => q.and(q.gte(q.field("date"), start), q.lte(q.field("date"), end)))
      .first()

    if (existingAttendance) {
      throw new Error("Already checked in today.")
    }

    const attendanceId = await ctx.db.insert("attendance", {
      memberId: member._id,
      workspaceId: args.workspaceId,
      date: start, // Use start of day for consistency
      checkInTime: Date.now(),
      workLocation: args.workLocation,
      location: args.location,
      checkInNotes: args.notes,
      status: "pending",
    })

    return attendanceId
  },
})

// Check out
export const checkOut = mutation({
  args: {
    attendanceId: v.id("attendance"),
    tasks: v.string(),
    image: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Unauthorized.")

    const attendance = await ctx.db.get(args.attendanceId)
    if (!attendance) throw new Error("Attendance record not found.")

    const member = await ctx.db.get(attendance.memberId)
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized to update this attendance.")
    }

    if (attendance.checkOutTime) {
      throw new Error("Already checked out.")
    }

    await ctx.db.patch(args.attendanceId, {
      checkOutTime: Date.now(),
      tasks: args.tasks,
      taskImage: args.image,
    })

    return args.attendanceId
  },
})

// Mark absent users automatically
export const markAbsentUsers = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const targetDate = args.date ? new Date(args.date) : new Date()
    const { start, end } = getDayBounds(targetDate)

    // Get all members in the workspace
    const members = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    // Get existing attendance records for the date
    const existingAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.and(q.gte(q.field("date"), start), q.lte(q.field("date"), end)))
      .collect()

    const attendedMemberIds = new Set(existingAttendance.map((record) => record.memberId))

    // Mark absent members
    const absentMembers = members.filter((member) => !attendedMemberIds.has(member._id))

    for (const member of absentMembers) {
      await ctx.db.insert("attendance", {
        memberId: member._id,
        workspaceId: args.workspaceId,
        date: start,
        checkInTime: 0, // No check-in time for absent
        workLocation: "office", // Default
        status: "absent",
      })
    }

    return absentMembers.length
  },
})

// Get user's attendance for a month
export const getUserAttendance = query({
  args: {
    workspaceId: v.id("workspaces"),
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .unique()

    if (!member) return []

    const startDate = new Date(args.year, args.month - 1, 1)
    const endDate = new Date(args.year, args.month, 0, 23, 59, 59)

    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_member_id_date", (q) => q.eq("memberId", member._id))
      .filter((q) => q.and(q.gte(q.field("date"), startDate.getTime()), q.lte(q.field("date"), endDate.getTime())))
      .collect()

    return attendance
  },
})

// Get today's attendance for user
export const getTodayAttendance = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .unique()

    if (!member) return null

    const today = new Date()
    const { start, end } = getDayBounds(today)

    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_member_id_date", (q) => q.eq("memberId", member._id))
      .filter((q) => q.and(q.gte(q.field("date"), start), q.lte(q.field("date"), end)))
      .first()

    return attendance
  },
})

// Admin: Get all attendance for a specific date with filter - includes absent members
export const getAttendanceByDate = query({
  args: {
    workspaceId: v.id("workspaces"),
    date: v.number(),
    filter: v.optional(v.union(v.literal("present"), v.literal("absent"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .unique()

    if (!currentMember || currentMember.role !== "admin") {
      throw new Error("Admin access required.")
    }

    // Use the provided date directly and get day bounds
    const targetDate = new Date(args.date)
    const { start, end } = getDayBounds(targetDate)

    // Get all members in the workspace
    const allMembers = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    // Get existing attendance records for the date range
    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.and(q.gte(q.field("date"), start), q.lte(q.field("date"), end)))
      .collect()

    // Find members who haven't checked in (absent members)
    const attendedMemberIds = new Set(attendance.map((record) => record.memberId))
    const absentMembers = allMembers.filter((member) => !attendedMemberIds.has(member._id))

    // Create absent records for members who haven't checked in
    const absentRecords = absentMembers.map((member) => ({
      _id: `absent_${member._id}_${start}` as any, // Temporary ID for absent records
      _creationTime: start,
      memberId: member._id,
      workspaceId: args.workspaceId,
      date: start,
      checkInTime: 0,
      checkOutTime: undefined,
      workLocation: "office" as const,
      location: undefined,
      checkInNotes: undefined,
      tasks: undefined,
      taskImage: undefined,
      status: "absent" as const,
      adminNotes: undefined,
      approvedBy: undefined,
      approvedAt: undefined,
    }))

    // Combine actual attendance records with absent records
    const allAttendanceRecords = [...attendance, ...absentRecords]

    // Apply filter
    let filteredRecords = allAttendanceRecords
    if (args.filter === "present") {
      filteredRecords = allAttendanceRecords.filter((record) => record.status !== "absent" && record.checkInTime > 0)
    } else if (args.filter === "absent") {
      filteredRecords = allAttendanceRecords.filter((record) => record.status === "absent" || record.checkInTime === 0)
    }

    // Populate member and user data
    const attendanceWithMembers = await Promise.all(
      filteredRecords.map(async (record) => {
        const member = await ctx.db.get(record.memberId)
        const user = member ? await ctx.db.get(member.userId) : null
        return {
          ...record,
          member,
          user,
        }
      }),
    )

    return attendanceWithMembers
  },
})

// Admin: Approve/Reject attendance
export const updateAttendanceStatus = mutation({
  args: {
    attendanceId: v.id("attendance"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Unauthorized.")

    const attendance = await ctx.db.get(args.attendanceId)
    if (!attendance) throw new Error("Attendance record not found.")

    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", attendance.workspaceId).eq("userId", userId))
      .unique()

    if (!currentMember || currentMember.role !== "admin") {
      throw new Error("Admin access required.")
    }

    await ctx.db.patch(args.attendanceId, {
      status: args.status,
      adminNotes: args.adminNotes,
      approvedBy: currentMember._id,
      approvedAt: Date.now(),
    })

    return args.attendanceId
  },
})

// Get pending attendance requests
export const getPendingAttendance = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .unique()

    if (!currentMember || currentMember.role !== "admin") {
      return []
    }

    const pendingAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect()

    // Populate member and user data
    const attendanceWithMembers = await Promise.all(
      pendingAttendance.map(async (record) => {
        const member = await ctx.db.get(record.memberId)
        const user = member ? await ctx.db.get(member.userId) : null
        return {
          ...record,
          member,
          user,
        }
      }),
    )

    return attendanceWithMembers
  },
})
