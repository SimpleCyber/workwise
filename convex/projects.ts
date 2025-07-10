import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"

// Project Board functions
export const createProjectBoard = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    background: v.optional(v.string()),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Get member
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .unique()

    if (!member) {
      throw new Error("Unauthorized")
    }

    // Generate board code (B01, B02, etc.)
    const existingBoards = await ctx.db
      .query("projectBoards")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    const boardNumber = existingBoards.length + 1
    const boardCode = `B${boardNumber.toString().padStart(2, "0")}`

    const boardId = await ctx.db.insert("projectBoards", {
      name: args.name,
      description: args.description,
      background: args.background,
      boardCode,
      memberId: member._id,
      workspaceId: args.workspaceId,
      isStarred: false,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Create default lists
    await ctx.db.insert("projectLists", {
      name: "To Do",
      boardId,
      memberId: member._id,
      workspaceId: args.workspaceId,
      position: 0,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    await ctx.db.insert("projectLists", {
      name: "In Progress",
      boardId,
      memberId: member._id,
      workspaceId: args.workspaceId,
      position: 1,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    await ctx.db.insert("projectLists", {
      name: "Done",
      boardId,
      memberId: member._id,
      workspaceId: args.workspaceId,
      position: 2,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return boardId
  },
})

export const getProjectBoards = query({
  args: {
    workspaceId: v.id("workspaces"),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .unique()

    if (!member) {
      return []
    }

    const boards = await ctx.db
      .query("projectBoards")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    return boards
      .filter((board) => (args.includeArchived ? true : !board.isArchived))
      .sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const getProjectBoard = query({
  args: { boardId: v.id("projectBoards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return null
    }

    const board = await ctx.db.get(args.boardId)
    if (!board) {
      return null
    }

    // Check if user has access to this workspace
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", board.workspaceId).eq("userId", userId))
      .unique()

    if (!member) {
      return null
    }

    return board
  },
})

// Project Task functions
export const createProjectTask = mutation({
  args: {
    title: v.string(),
    listId: v.id("projectLists"),
    assignedToId: v.optional(v.id("members")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const list = await ctx.db.get(args.listId)
    if (!list) {
      throw new Error("List not found")
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", list.workspaceId).eq("userId", userId))
      .unique()

    if (!member) {
      throw new Error("Unauthorized")
    }

    // Get board to generate task code
    const board = await ctx.db.get(list.boardId)
    if (!board) {
      throw new Error("Board not found")
    }

    // Generate task code (B01-1, B01-2, etc.)
    const existingTasks = await ctx.db
      .query("projectTasks")
      .withIndex("by_board_id", (q) => q.eq("boardId", list.boardId))
      .collect()

    const taskNumber = existingTasks.length + 1
    const taskCode = `${board.boardCode}-${taskNumber}`

    // Get the highest position in this list
    const tasks = await ctx.db
      .query("projectTasks")
      .withIndex("by_list_id", (q) => q.eq("listId", args.listId))
      .collect()
    const maxPosition = Math.max(...tasks.map((t) => t.position), -1)

    return await ctx.db.insert("projectTasks", {
      title: args.title,
      taskCode,
      listId: args.listId,
      boardId: list.boardId,
      createdById: member._id,
      assignedToId: args.assignedToId || member._id, // Self-assign if no assignee specified
      assignedById: member._id,
      workspaceId: list.workspaceId,
      position: maxPosition + 1,
      isCompleted: false,
      isArchived: false,
      priority: "medium",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      assignedAt: Date.now(),
    })
  },
})

export const getProjectTasks = query({
  args: {
    listId: v.id("projectLists"),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    const list = await ctx.db.get(args.listId)
    if (!list) {
      return []
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", list.workspaceId).eq("userId", userId))
      .unique()

    if (!member) {
      return []
    }

    const tasks = await ctx.db
      .query("projectTasks")
      .withIndex("by_list_id", (q) => q.eq("listId", args.listId))
      .collect()

    // Get member details for each task
    const tasksWithMembers = await Promise.all(
      tasks.map(async (task) => {
        const assignedTo = task.assignedToId ? await ctx.db.get(task.assignedToId) : null
        const assignedBy = task.assignedById ? await ctx.db.get(task.assignedById) : null
        const createdBy = await ctx.db.get(task.createdById)

        // Get user details
        const assignedToUser = assignedTo ? await ctx.db.get(assignedTo.userId) : null
        const assignedByUser = assignedBy ? await ctx.db.get(assignedBy.userId) : null
        const createdByUser = createdBy ? await ctx.db.get(createdBy.userId) : null

        return {
          ...task,
          assignedTo: assignedTo ? { ...assignedTo, user: assignedToUser } : null,
          assignedBy: assignedBy ? { ...assignedBy, user: assignedByUser } : null,
          createdBy: createdBy ? { ...createdBy, user: createdByUser } : null,
        }
      }),
    )

    return tasksWithMembers
      .filter((task) => (args.includeArchived ? true : !task.isArchived))
      .sort((a, b) => a.position - b.position)
  },
})

export const updateProjectTask = mutation({
  args: {
    taskId: v.id("projectTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    assignedToId: v.optional(v.id("members")),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    dueDate: v.optional(v.number()),
    isCompleted: v.optional(v.boolean()),
    listId: v.optional(v.id("projectLists")),
    position: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const task = await ctx.db.get(args.taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", task.workspaceId).eq("userId", userId))
      .unique()

    if (!member) {
      throw new Error("Unauthorized")
    }

    // Check permissions for assignment
    if (args.assignedToId && args.assignedToId !== task.assignedToId) {
      // Only admins, leads, or the current assignee can reassign tasks
      if (member.role !== "admin" && member.role !== "lead" && member._id !== task.assignedToId) {
        throw new Error("Only admins, leads, or the current assignee can reassign tasks")
      }
    }

    const { taskId, ...updates } = args

    // If reassigning, update assignment metadata
    if (args.assignedToId && args.assignedToId !== task.assignedToId) {
      await ctx.db.patch(args.taskId, {
        ...updates,
        assignedById: member._id,
        assignedAt: Date.now(),
        updatedAt: Date.now(),
      })
    } else {
      await ctx.db.patch(args.taskId, {
        ...updates,
        updatedAt: Date.now(),
      })
    }
  },
})

// Get project lists
export const getProjectLists = query({
  args: {
    boardId: v.id("projectBoards"),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    const board = await ctx.db.get(args.boardId)
    if (!board) {
      return []
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", board.workspaceId).eq("userId", userId))
      .unique()

    if (!member) {
      return []
    }

    const lists = await ctx.db
      .query("projectLists")
      .withIndex("by_board_id", (q) => q.eq("boardId", args.boardId))
      .collect()

    return lists
      .filter((list) => (args.includeArchived ? true : !list.isArchived))
      .sort((a, b) => a.position - b.position)
  },
})

// Create project list
export const createProjectList = mutation({
  args: {
    name: v.string(),
    boardId: v.id("projectBoards"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const board = await ctx.db.get(args.boardId)
    if (!board) {
      throw new Error("Board not found")
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", board.workspaceId).eq("userId", userId))
      .unique()

    if (!member) {
      throw new Error("Unauthorized")
    }

    // Get the highest position
    const lists = await ctx.db
      .query("projectLists")
      .withIndex("by_board_id", (q) => q.eq("boardId", args.boardId))
      .collect()
    const maxPosition = Math.max(...lists.map((l) => l.position), -1)

    return await ctx.db.insert("projectLists", {
      name: args.name,
      boardId: args.boardId,
      memberId: member._id,
      workspaceId: board.workspaceId,
      position: maxPosition + 1,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

// Get workspace members for assignment
export const getWorkspaceMembers = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .unique()

    if (!currentMember) {
      return []
    }

    const members = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId)
        return user ? { ...member, user } : null
      }),
    )

    return membersWithUsers.filter(Boolean)
  },
})

// Update project list
export const updateProjectList = mutation({
  args: {
    listId: v.id("projectLists"),
    name: v.optional(v.string()),
    position: v.optional(v.number()),
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const list = await ctx.db.get(args.listId)
    if (!list) {
      throw new Error("List not found")
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", list.workspaceId).eq("userId", userId))
      .unique()

    if (!member) {
      throw new Error("Unauthorized")
    }

    const { listId, ...updates } = args
    await ctx.db.patch(args.listId, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

// Delete project list
export const deleteProjectList = mutation({
  args: { listId: v.id("projectLists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const list = await ctx.db.get(args.listId)
    if (!list) {
      throw new Error("List not found")
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", list.workspaceId).eq("userId", userId))
      .unique()

    if (!member) {
      throw new Error("Unauthorized")
    }

    // Delete all tasks in this list
    const tasks = await ctx.db
      .query("projectTasks")
      .withIndex("by_list_id", (q) => q.eq("listId", args.listId))
      .collect()

    for (const task of tasks) {
      await ctx.db.delete(task._id)
    }

    await ctx.db.delete(args.listId)
  },
})

// Delete project task
export const deleteProjectTask = mutation({
  args: { taskId: v.id("projectTasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const task = await ctx.db.get(args.taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", task.workspaceId).eq("userId", userId))
      .unique()

    if (!member) {
      throw new Error("Unauthorized")
    }

    // Check permissions - only admins, leads, creator, or assignee can delete
    if (
      member.role !== "admin" &&
      member.role !== "lead" &&
      member._id !== task.createdById &&
      member._id !== task.assignedToId
    ) {
      throw new Error("Only admins, leads, task creator, or assignee can delete tasks")
    }

    await ctx.db.delete(args.taskId)
  },
})
