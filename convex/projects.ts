import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Project Board functions
export const createProjectBoard = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    background: v.optional(v.string()),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    // Get member
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!member) {
      throw new Error("Unauthorized");
    }
    // Generate board code (B01, B02, etc.)
    const existingBoards = await ctx.db
      .query("projectBoards")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .collect();
    const boardNumber = existingBoards.length + 1;
    const boardCode = `B${boardNumber.toString().padStart(2, "0")}`;
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
    });
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
    });
    await ctx.db.insert("projectLists", {
      name: "In Progress",
      boardId,
      memberId: member._id,
      workspaceId: args.workspaceId,
      position: 1,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.insert("projectLists", {
      name: "Hold Task",
      boardId,
      memberId: member._id,
      workspaceId: args.workspaceId,
      position: 2,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.insert("projectLists", {
      name: "In Review",
      boardId,
      memberId: member._id,
      workspaceId: args.workspaceId,
      position: 3,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.insert("projectLists", {
      name: "Done",
      boardId,
      memberId: member._id,
      workspaceId: args.workspaceId,
      position: 4,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return boardId;
  },
});

export const getProjectBoards = query({
  args: {
    workspaceId: v.id("workspaces"),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!member) {
      return [];
    }
    const boards = await ctx.db
      .query("projectBoards")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .collect();
    return boards
      .filter((board) => (args.includeArchived ? true : !board.isArchived))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getProjectBoard = query({
  args: { boardId: v.id("projectBoards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      return null;
    }
    // Check if user has access to this workspace
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", board.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!member) {
      return null;
    }
    return board;
  },
});

export const removeProjectBoard = mutation({
  args: { boardId: v.id("projectBoards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", board.workspaceId).eq("userId", userId),
      )
      .unique();

    if (!member) {
      throw new Error("Unauthorized");
    }

    // Only admins, leads, or the creator of the board can delete it
    if (
      member.role !== "admin" &&
      member.role !== "lead" &&
      member._id !== board.memberId
    ) {
      throw new Error(
        "Only admins, leads, or the board creator can delete project boards",
      );
    }

    // Delete all tasks associated with this board
    const tasks = await ctx.db
      .query("projectTasks")
      .withIndex("by_board_id", (q) => q.eq("boardId", args.boardId))
      .collect();
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    // Delete all lists associated with this board
    const lists = await ctx.db
      .query("projectLists")
      .withIndex("by_board_id", (q) => q.eq("boardId", args.boardId))
      .collect();
    for (const list of lists) {
      await ctx.db.delete(list._id);
    }

    // Finally, delete the board itself
    await ctx.db.delete(args.boardId);
  },
});

// Project Task functions
export const createProjectTask = mutation({
  args: {
    title: v.string(),
    listId: v.id("projectLists"),
    assignedToId: v.optional(v.id("members")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", list.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!member) {
      throw new Error("Unauthorized");
    }
    // Get board to generate task code
    const board = await ctx.db.get(list.boardId);
    if (!board) {
      throw new Error("Board not found");
    }
    // Generate task code (B01-1, B01-2, etc.)
    const existingTasks = await ctx.db
      .query("projectTasks")
      .withIndex("by_board_id", (q) => q.eq("boardId", list.boardId))
      .collect();
    const taskNumber = existingTasks.length + 1;
    const taskCode = `${board.boardCode}-${taskNumber}`;
    // Get the highest position in this list
    const tasks = await ctx.db
      .query("projectTasks")
      .withIndex("by_list_id", (q) => q.eq("listId", args.listId))
      .collect();
    const maxPosition = Math.max(...tasks.map((t) => t.position), -1);

    const taskId = await ctx.db.insert("projectTasks", {
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
    });

    // Create notification for task assignment if assigned to someone else
    if (args.assignedToId && args.assignedToId !== member._id) {
      const assignedMember = await ctx.db.get(args.assignedToId);
      if (assignedMember) {
        const workspace = await ctx.db.get(list.workspaceId);
        await ctx.db.insert("notifications", {
          userId: assignedMember.userId,
          workspaceId: list.workspaceId,
          type: "task_assigned",
          title: "New Task Assigned",
          message: `You have been assigned task "${args.title}" (${taskCode}) in project "${board.name}"`,
          relatedId: taskId,
          actionBy: userId,
          isRead: false,
          createdAt: Date.now(),
          sendedmail: false, // Uncomment if you want to track email sending
        });
      }
    }

    return taskId;
  },
});

export const getProjectTasks = query({
  args: {
    listId: v.id("projectLists"),
    includeArchived: v.optional(v.boolean()),
    assignedToIds: v.optional(v.array(v.id("members"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const list = await ctx.db.get(args.listId);
    if (!list) {
      return [];
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", list.workspaceId).eq("userId", userId),
      )
      .unique();

    if (!member) {
      return [];
    }

    let tasks = await ctx.db
      .query("projectTasks")
      .withIndex("by_list_id", (q) => q.eq("listId", args.listId))
      .collect();

    // Filter by assignedToIds if provided
    if (args.assignedToIds && args.assignedToIds.length > 0) {
      tasks = tasks.filter(
        (task) =>
          task.assignedToId && args.assignedToIds!.includes(task.assignedToId),
      );
    }

    // Get member details and description images for each task
    const tasksWithMembers = await Promise.all(
      tasks.map(async (task) => {
        const assignedTo = task.assignedToId
          ? await ctx.db.get(task.assignedToId)
          : null;
        const assignedBy = task.assignedById
          ? await ctx.db.get(task.assignedById)
          : null;
        const createdBy = await ctx.db.get(task.createdById);

        // Get user details
        const assignedToUser = assignedTo
          ? await ctx.db.get(assignedTo.userId)
          : null;
        const assignedByUser = assignedBy
          ? await ctx.db.get(assignedBy.userId)
          : null;
        const createdByUser = createdBy
          ? await ctx.db.get(createdBy.userId)
          : null;

        // Get description image URLs
        let descriptionImages: string[] = [];
        if (task.images && task.images.length > 0) {
          descriptionImages = await Promise.all(
            task.images.map(async (imageId) => {
              const url = await ctx.storage.getUrl(imageId);
              return url || "";
            }),
          );
        }

        return {
          ...task,
          assignedTo: assignedTo
            ? { ...assignedTo, user: assignedToUser }
            : null,
          assignedBy: assignedBy
            ? { ...assignedBy, user: assignedByUser }
            : null,
          createdBy: createdBy ? { ...createdBy, user: createdByUser } : null,
          descriptionImages: descriptionImages.filter(Boolean),
        };
      }),
    );

    return tasksWithMembers
      .filter(Boolean)
      .filter((task) => (args.includeArchived ? true : !task.isArchived))
      .sort((a, b) => a.position - b.position);
  },
});

export const updateProjectTask = mutation({
  args: {
    taskId: v.id("projectTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    assignedToId: v.optional(v.id("members")),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent"),
      ),
    ),
    dueDate: v.optional(v.number()),
    isCompleted: v.optional(v.boolean()),
    listId: v.optional(v.id("projectLists")), // Ensure listId is an optional argument
    position: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", task.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!member) {
      throw new Error("Unauthorized");
    }

    // Get board and list info for notifications
    const board = await ctx.db.get(task.boardId);
    const oldList = await ctx.db.get(task.listId);
    const newList = args.listId ? await ctx.db.get(args.listId) : oldList;

    // Check permissions for assignment
    if (args.assignedToId && args.assignedToId !== task.assignedToId) {
      // Only admins, leads, or the current assignee can reassign tasks
      if (
        member.role !== "admin" &&
        member.role !== "lead" &&
        member._id !== task.assignedToId
      ) {
        throw new Error(
          "Only admins, leads, or the current assignee can reassign tasks",
        );
      }
    }

    const { taskId, ...updates } = args;

    // If reassigning, update assignment metadata and create notification
    if (args.assignedToId && args.assignedToId !== task.assignedToId) {
      await ctx.db.patch(args.taskId, {
        ...updates,
        assignedById: member._id,
        assignedAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Notify new assignee
      const newAssignee = await ctx.db.get(args.assignedToId);
      if (newAssignee && board) {
        await ctx.db.insert("notifications", {
          userId: newAssignee.userId,
          workspaceId: task.workspaceId,
          type: "task_assigned",
          title: "Task Reassigned",
          message: `You have been assigned task "${task.title}" (${task.taskCode}) in project "${board.name}"`,
          relatedId: args.taskId,
          actionBy: userId,
          isRead: false,
          createdAt: Date.now(),
          sendedmail: false,
        });
      }
    } else {
      await ctx.db.patch(args.taskId, {
        ...updates,
        updatedAt: Date.now(),
      });
    }

    // Handle status change notifications
    if (
      args.listId &&
      args.listId !== task.listId &&
      board &&
      oldList &&
      newList
    ) {
      const taskCreator = await ctx.db.get(task.createdById);

      // Notify task creator when task moves to "In Review"
      if (
        newList.name === "In Review" &&
        taskCreator &&
        taskCreator.userId !== userId
      ) {
        await ctx.db.insert("notifications", {
          userId: taskCreator.userId,
          workspaceId: task.workspaceId,
          type: "task_status_changed",
          title: "Task Ready for Review",
          message: `Task "${task.title}" (${task.taskCode}) in project "${board.name}" is ready for review`,
          relatedId: args.taskId,
          actionBy: userId,
          isRead: false,
          createdAt: Date.now(),
          sendedmail: false,
        });
      }

      // Notify task creator when task is completed
      if (
        newList.name === "Done" &&
        taskCreator &&
        taskCreator.userId !== userId
      ) {
        await ctx.db.insert("notifications", {
          userId: taskCreator.userId,
          workspaceId: task.workspaceId,
          type: "task_completed",
          title: "Task Completed",
          message: `Task "${task.title}" (${task.taskCode}) in project "${board.name}" has been completed`,
          relatedId: args.taskId,
          actionBy: userId,
          isRead: false,
          createdAt: Date.now(),
          sendedmail: false,
        });
      }

      // Notify assignee when task is moved to "Hold Task"
      if (newList.name === "Hold Task") {
        const now = Date.now();

        // Notify assignee
        if (task.assignedToId) {
          const assignee = await ctx.db.get(task.assignedToId);
          if (assignee && assignee.userId !== userId) {
            await ctx.db.insert("notifications", {
              userId: assignee.userId,
              workspaceId: task.workspaceId,
              type: "task_on_hold",
              title: "Task Put on Hold",
              message: `Task "${task.title}" (${task.taskCode}) in project "${board.name}" has been put on hold`,
              relatedId: args.taskId,
              actionBy: userId,
              isRead: false,
              createdAt: now,
              sendedmail: false,
            });
          }
        }

        // Notify task creator
        if (taskCreator && taskCreator.userId !== userId) {
          await ctx.db.insert("notifications", {
            userId: taskCreator.userId,
            workspaceId: task.workspaceId,
            type: "task_on_hold",
            title: "Task Put on Hold",
            message: `Task "${task.title}" (${task.taskCode}) in project "${board.name}" has been put on hold`,
            relatedId: args.taskId,
            actionBy: userId,
            isRead: false,
            createdAt: now,
            sendedmail: false,
          });
        }
      }
    }
  },
});

// Get project lists
export const getProjectLists = query({
  args: {
    boardId: v.id("projectBoards"),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      return [];
    }
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", board.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!member) {
      return [];
    }
    const lists = await ctx.db
      .query("projectLists")
      .withIndex("by_board_id", (q) => q.eq("boardId", args.boardId))
      .collect();
    return lists
      .filter((list) => (args.includeArchived ? true : !list.isArchived))
      .sort((a, b) => a.position - b.position);
  },
});

// Create project list
export const createProjectList = mutation({
  args: {
    name: v.string(),
    boardId: v.id("projectBoards"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error("Board not found");
    }
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", board.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!member) {
      throw new Error("Unauthorized");
    }
    // Get the highest position
    const lists = await ctx.db
      .query("projectLists")
      .withIndex("by_board_id", (q) => q.eq("boardId", args.boardId))
      .collect();
    const maxPosition = Math.max(...lists.map((l) => l.position), -1);
    return await ctx.db.insert("projectLists", {
      name: args.name,
      boardId: args.boardId,
      memberId: member._id,
      workspaceId: board.workspaceId,
      position: maxPosition + 1,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get workspace members for assignment
export const getWorkspaceMembers = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!currentMember) {
      return [];
    }
    const members = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .collect();
    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return user ? { ...member, user } : null;
      }),
    );
    return membersWithUsers.filter(Boolean);
  },
});

// Update project list
export const updateProjectList = mutation({
  args: {
    listId: v.id("projectLists"),
    name: v.optional(v.string()),
    position: v.optional(v.number()),
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", list.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!member) {
      throw new Error("Unauthorized");
    }
    const { listId, ...updates } = args;
    await ctx.db.patch(args.listId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete project list
export const deleteProjectList = mutation({
  args: { listId: v.id("projectLists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", list.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!member) {
      throw new Error("Unauthorized");
    }
    // Delete all tasks in this list
    const tasks = await ctx.db
      .query("projectTasks")
      .withIndex("by_list_id", (q) => q.eq("listId", args.listId))
      .collect();
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }
    await ctx.db.delete(args.listId);
  },
});

// Delete project task
export const deleteProjectTask = mutation({
  args: { taskId: v.id("projectTasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", task.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!member) {
      throw new Error("Unauthorized");
    }
    // Check permissions - only admins, leads, creator, or assignee can delete
    if (
      member.role !== "admin" &&
      member.role !== "lead" &&
      member._id !== task.createdById &&
      member._id !== task.assignedToId
    ) {
      throw new Error(
        "Only admins, leads, task creator, or assignee can delete tasks",
      );
    }
    await ctx.db.delete(args.taskId);
  },
});

// Create a comment on a task
export const createTaskComment = mutation({
  args: {
    taskId: v.id("projectTasks"),
    content: v.string(),
    image: v.optional(v.id("_storage")), // Single image storage ID
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    // Check if user is a member of the workspace
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", task.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!member) {
      throw new Error("Not a member of this workspace");
    }

    const commentId = await ctx.db.insert("taskComments", {
      taskId: args.taskId,
      memberId: member._id,
      content: args.content,
      images: args.image ? [args.image] : [], // Store as array for consistency with schema
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isEdited: false,
    });

    // Create notifications for task participants
    const board = await ctx.db.get(task.boardId);
    const taskCreator = await ctx.db.get(task.createdById);
    const taskAssignee = task.assignedToId
      ? await ctx.db.get(task.assignedToId)
      : null;

    // Notify task creator if they're not the commenter
    if (taskCreator && taskCreator.userId !== userId && board) {
      await ctx.db.insert("notifications", {
        userId: taskCreator.userId,
        workspaceId: task.workspaceId,
        type: "task_comment_added",
        title: "New Comment on Your Task",
        message: `New comment added to task "${task.title}" (${task.taskCode}) in project "${board.name}"`,
        relatedId: args.taskId,
        actionBy: userId,
        isRead: false,
        createdAt: Date.now(),
        sendedmail: false,
      });
    }

    // Notify task assignee if they're not the commenter and different from creator
    if (
      taskAssignee &&
      taskAssignee.userId !== userId &&
      taskAssignee.userId !== taskCreator?.userId &&
      board
    ) {
      await ctx.db.insert("notifications", {
        userId: taskAssignee.userId,
        workspaceId: task.workspaceId,
        type: "task_comment_added",
        title: "New Comment on Assigned Task",
        message: `New comment added to task "${task.title}" (${task.taskCode}) in project "${board.name}"`,
        relatedId: args.taskId,
        actionBy: userId,
        isRead: false,
        createdAt: Date.now(),
        sendedmail: false,
      });
    }

    return commentId;
  },
});

// Update the existing updateTaskComment mutation
export const updateTaskComment = mutation({
  args: {
    commentId: v.id("taskComments"),
    content: v.string(),
    image: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }
    const member = await ctx.db.get(comment.memberId);
    if (!member || member.userId !== userId) {
      throw new Error("You can only edit your own comments");
    }
    await ctx.db.patch(args.commentId, {
      content: args.content,
      images: args.image ? [args.image] : [],
      updatedAt: Date.now(),
      isEdited: true,
    });
    return args.commentId;
  },
});

// Get comments for a task
export const getTaskComments = query({
  args: {
    taskId: v.id("projectTasks"),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      return [];
    }
    // Check if user is a member of the workspace
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", task.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!member) {
      return [];
    }

    const comments = await ctx.db
      .query("taskComments")
      .withIndex("by_task_id", (q) => q.eq("taskId", args.taskId))
      .collect();

    const commentsWithMembers = await Promise.all(
      comments.map(async (comment) => {
        const commentMember = await ctx.db.get(comment.memberId);
        const user = commentMember
          ? await ctx.db.get(commentMember.userId)
          : null;
        // Get image URL if image exists
        let imageUrl = null;
        if (comment.images && comment.images.length > 0) {
          imageUrl = await ctx.storage.getUrl(comment.images[0]);
        }
        return {
          ...comment,
          member: commentMember ? { ...commentMember, user } : null,
          image:
            comment.images && comment.images.length > 0
              ? comment.images[0]
              : null,
          imageUrl,
        };
      }),
    );

    // Sort by creation date
    const sortOrder = args.sortOrder || "asc";
    return commentsWithMembers.filter(Boolean).sort((a, b) => {
      if (sortOrder === "desc") {
        return b.createdAt - a.createdAt;
      }
      return a.createdAt - b.createdAt;
    });
  },
});

export const deleteTaskComment = mutation({
  args: { commentId: v.id("taskComments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }
    const member = await ctx.db.get(comment.memberId);
    if (!member || member.userId !== userId) {
      throw new Error("You can only delete your own comments");
    }
    await ctx.db.delete(args.commentId);
    return args.commentId;
  },
});

export const updateTaskContent = mutation({
  args: {
    taskId: v.id("projectTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", task.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!member) {
      throw new Error("Unauthorized");
    }
    // Only task creator can edit content
    if (member._id !== task.createdById) {
      throw new Error("Only the task creator can edit task content");
    }
    const updateData: any = {
      updatedAt: Date.now(),
    };
    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined)
      updateData.description = args.description;
    if (args.image !== undefined) {
      // Add image to existing images array or create new one
      const existingImages = task.images || [];
      updateData.images = [...existingImages, args.image];
    }
    await ctx.db.patch(args.taskId, updateData);
    return args.taskId;
  },
});

export const updateProjectBoard = mutation({
  args: {
    boardId: v.id("projectBoards"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    background: v.optional(v.string()),
    isStarred: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error("Board not found");
    }
    const member = await ctx.db.get(board.memberId);
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized");
    }
    const { boardId, ...updates } = args;
    await ctx.db.patch(args.boardId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});
