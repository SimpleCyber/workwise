import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Get all tree nodes for a workspace
export const getTreeNodes = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const nodes = await ctx.db
      .query("treeNodes")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .filter((q) => q.neq(q.field("isArchived"), true))
      .collect();

    // Get users for each node
    const nodesWithUsers = await Promise.all(
      nodes.map(async (node) => {
        const users = await ctx.db
          .query("treeNodeUsers")
          .withIndex("by_node_id", (q) => q.eq("nodeId", node.nodeId))
          .collect();

        const usersWithDetails = await Promise.all(
          users.map(async (user) => {
            const member = await ctx.db.get(user.memberId);
            const userDetails = member ? await ctx.db.get(member.userId) : null;
            return {
              ...user,
              member,
              user: userDetails,
            };
          }),
        );

        return {
          ...node,
          users: usersWithDetails,
        };
      }),
    );

    return nodesWithUsers;
  },
});

// Create a new tree node
export const createTreeNode = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    title: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.string()),
    position: v.object({ x: v.number(), y: v.number() }),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    // Get member info
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", identity),
      )
      .first();

    if (!member) throw new Error("Member not found");

    // Generate unique node ID
    const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate level based on parent
    let level = 0;
    if (args.parentId) {
      const parent = await ctx.db
        .query("treeNodes")
        .withIndex("by_node_id", (q) => q.eq("nodeId", args.parentId!))
        .first();
      level = parent ? parent.level + 1 : 0;
    }

    const nodeData = {
      title: args.title,
      description: args.description,
      nodeId,
      parentId: args.parentId || undefined,
      workspaceId: args.workspaceId,
      createdById: member._id,
      status: "todo" as const,
      position: args.position,
      level,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newNodeId = await ctx.db.insert("treeNodes", nodeData);

    // Add creator as admin user
    await ctx.db.insert("treeNodeUsers", {
      nodeId,
      memberId: member._id,
      workspaceId: args.workspaceId,
      role: "creator",
      addedAt: Date.now(),
      addedById: member._id,
    });

    return newNodeId;
  },
});

// Update tree node
export const updateTreeNode = mutation({
  args: {
    nodeId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("todo"),
        v.literal("in-progress"),
        v.literal("review"),
        v.literal("done"),
      ),
    ),
    position: v.optional(v.object({ x: v.number(), y: v.number() })),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const node = await ctx.db
      .query("treeNodes")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.nodeId))
      .first();

    if (!node) throw new Error("Node not found");

    const updateData: any = { updatedAt: Date.now() };
    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined)
      updateData.description = args.description;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.position !== undefined) updateData.position = args.position;

    await ctx.db.patch(node._id, updateData);
    return node._id;
  },
});

// Delete tree node and all its children
export const deleteTreeNode = mutation({
  args: { nodeId: v.string() },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    // Get all descendant nodes
    const getAllDescendants = async (parentId: string): Promise<string[]> => {
      const children = await ctx.db
        .query("treeNodes")
        .withIndex("by_parent_id", (q) => q.eq("parentId", parentId))
        .collect();

      let descendants = children.map((child) => child.nodeId);

      for (const child of children) {
        const childDescendants = await getAllDescendants(child.nodeId);
        descendants = descendants.concat(childDescendants);
      }

      return descendants;
    };

    const nodeIdsToDelete = [
      args.nodeId,
      ...(await getAllDescendants(args.nodeId)),
    ];

    // Delete all related data
    for (const nodeId of nodeIdsToDelete) {
      const node = await ctx.db
        .query("treeNodes")
        .withIndex("by_node_id", (q) => q.eq("nodeId", nodeId))
        .first();

      if (node) {
        await ctx.db.patch(node._id, { isArchived: true });
      }

      // Delete users
      const users = await ctx.db
        .query("treeNodeUsers")
        .withIndex("by_node_id", (q) => q.eq("nodeId", nodeId))
        .collect();

      for (const user of users) {
        await ctx.db.delete(user._id);
      }

      // Delete comments
      const comments = await ctx.db
        .query("treeNodeComments")
        .withIndex("by_node_id", (q) => q.eq("nodeId", nodeId))
        .collect();

      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }

      // Delete tasks
      const tasks = await ctx.db
        .query("treeNodeTasks")
        .withIndex("by_node_id", (q) => q.eq("nodeId", nodeId))
        .collect();

      for (const task of tasks) {
        await ctx.db.delete(task._id);
      }
    }

    return { deletedNodes: nodeIdsToDelete.length };
  },
});

// Add user to node
export const addUserToNode = mutation({
  args: {
    nodeId: v.string(),
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", identity),
      )
      .first();

    if (!member) throw new Error("Member not found");

    // Check if user already exists
    const existingUser = await ctx.db
      .query("treeNodeUsers")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.nodeId))
      .filter((q) => q.eq(q.field("memberId"), args.memberId))
      .first();

    if (existingUser) throw new Error("User already added to this node");

    return await ctx.db.insert("treeNodeUsers", {
      nodeId: args.nodeId,
      memberId: args.memberId,
      workspaceId: args.workspaceId,
      role: args.role,
      addedAt: Date.now(),
      addedById: member._id,
    });
  },
});

// Get comments for a node
export const getNodeComments = query({
  args: { nodeId: v.string() },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) return [];

    const comments = await ctx.db
      .query("treeNodeComments")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.nodeId))
      .order("desc")
      .collect();

    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const member = await ctx.db.get(comment.memberId);
        const user = member ? await ctx.db.get(member.userId) : null;
        return {
          ...comment,
          member,
          user,
        };
      }),
    );

    return commentsWithUsers;
  },
});

// Add comment to node
export const addNodeComment = mutation({
  args: {
    nodeId: v.string(),
    workspaceId: v.id("workspaces"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", identity),
      )
      .first();

    if (!member) throw new Error("Member not found");

    return await ctx.db.insert("treeNodeComments", {
      nodeId: args.nodeId,
      memberId: member._id,
      workspaceId: args.workspaceId,
      content: args.content,
      createdAt: Date.now(),
      isEdited: false,
    });
  },
});

// Get tasks for a node
export const getNodeTasks = query({
  args: { nodeId: v.string() },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) return [];

    const tasks = await ctx.db
      .query("treeNodeTasks")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.nodeId))
      .collect();

    const tasksWithUsers = await Promise.all(
      tasks.map(async (task) => {
        const assignedMember = task.assignedToId
          ? await ctx.db.get(task.assignedToId)
          : null;
        const assignedUser = assignedMember
          ? await ctx.db.get(assignedMember.userId)
          : null;
        const assignedByMember = await ctx.db.get(task.assignedById);
        const assignedByUser = assignedByMember
          ? await ctx.db.get(assignedByMember.userId)
          : null;

        return {
          ...task,
          assignedTo: assignedUser,
          assignedBy: assignedByUser,
        };
      }),
    );

    return tasksWithUsers;
  },
});

// Add task to node
export const addNodeTask = mutation({
  args: {
    nodeId: v.string(),
    workspaceId: v.id("workspaces"),
    title: v.string(),
    description: v.optional(v.string()),
    assignedToId: v.optional(v.id("members")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", identity),
      )
      .first();

    if (!member) throw new Error("Member not found");

    return await ctx.db.insert("treeNodeTasks", {
      nodeId: args.nodeId,
      title: args.title,
      description: args.description,
      assignedToId: args.assignedToId,
      assignedById: member._id,
      workspaceId: args.workspaceId,
      status: "pending",
      priority: args.priority,
      dueDate: args.dueDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Check if user has permission to edit a node
export const checkNodePermission = query({
  args: {
    nodeId: v.string(),
    workspaceId: v.id("workspaces"),
    action: v.union(
      v.literal("edit"),
      v.literal("view"),
      v.literal("create_child"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) return false;

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", identity),
      )
      .first();

    if (!member) return false;

    // Workspace admin has all permissions
    if (member.role === "admin") return true;

    const node = await ctx.db
      .query("treeNodes")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.nodeId))
      .first();

    if (!node) return false;

    // Check if user is assigned to this node
    const nodeUser = await ctx.db
      .query("treeNodeUsers")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.nodeId))
      .filter((q) => q.eq(q.field("memberId"), member._id))
      .first();

    if (nodeUser) {
      // Node creator or admin can edit
      if (nodeUser.role === "creator" || nodeUser.role === "admin") {
        return true;
      }
      // Members can only view
      if (args.action === "view") return true;
    }

    // Check if user has permission on parent nodes (can manage children)
    const checkParentPermission = async (
      currentNodeId: string,
    ): Promise<boolean> => {
      const currentNode = await ctx.db
        .query("treeNodes")
        .withIndex("by_node_id", (q) => q.eq("nodeId", currentNodeId))
        .first();

      if (!currentNode || !currentNode.parentId) return false;

      const parentNodeUser = await ctx.db
        .query("treeNodeUsers")
        .withIndex("by_node_id", (q) => q.eq("nodeId", currentNode.parentId!))
        .filter((q) => q.eq(q.field("memberId"), member._id))
        .first();

      if (
        parentNodeUser &&
        (parentNodeUser.role === "creator" || parentNodeUser.role === "admin")
      ) {
        return true;
      }

      return await checkParentPermission(currentNode.parentId!);
    };

    return await checkParentPermission(args.nodeId);
  },
});

// Create workspace root node
export const createWorkspaceRootNode = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    workspaceName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", identity),
      )
      .first();

    if (!member || member.role !== "admin") {
      throw new Error("Only workspace admins can create root node");
    }

    // Check if root node already exists
    const existingRoot = await ctx.db
      .query("treeNodes")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .filter((q) => q.eq(q.field("level"), 0))
      .first();

    if (existingRoot) {
      throw new Error("Workspace root node already exists");
    }

    const nodeId = `workspace-root-${args.workspaceId}`;

    const nodeData = {
      title: args.workspaceName,
      description: "Workspace Root Node",
      nodeId,
      parentId: undefined,
      workspaceId: args.workspaceId,
      createdById: member._id,
      status: "in-progress" as const,
      position: { x: 0, y: 0 },
      level: 0,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newNodeId = await ctx.db.insert("treeNodes", nodeData);

    // Add workspace admin as creator
    await ctx.db.insert("treeNodeUsers", {
      nodeId,
      memberId: member._id,
      workspaceId: args.workspaceId,
      role: "creator",
      addedAt: Date.now(),
      addedById: member._id,
    });

    return newNodeId;
  },
});

// Get available members for assignment
export const getAvailableMembers = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) return [];

    const members = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .collect();

    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          user,
        };
      }),
    );

    return membersWithUsers.filter((m) => m.user);
  },
});

// Create child node with permission check
export const createChildNode = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    parentId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    position: v.object({ x: v.number(), y: v.number() }),
    assignedMemberId: v.optional(v.id("members")),
    assignedRole: v.optional(v.union(v.literal("admin"), v.literal("member"))),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", identity),
      )
      .first();

    if (!member) throw new Error("Member not found");

    // Check permission to create child on parent node
    const hasPermission = await ctx.runQuery(
      api.advancetree.checkNodePermission,
      {
        nodeId: args.parentId,
        workspaceId: args.workspaceId,
        action: "create_child",
      },
    );

    if (!hasPermission && member.role !== "admin") {
      throw new Error("No permission to create child node");
    }

    // Get parent node for level calculation
    const parent = await ctx.db
      .query("treeNodes")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.parentId))
      .first();

    if (!parent) throw new Error("Parent node not found");

    const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const nodeData = {
      title: args.title,
      description: args.description,
      nodeId,
      parentId: args.parentId,
      workspaceId: args.workspaceId,
      createdById: member._id,
      status: "todo" as const,
      position: args.position,
      level: parent.level + 1,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newNodeId = await ctx.db.insert("treeNodes", nodeData);

    // Add creator as admin
    await ctx.db.insert("treeNodeUsers", {
      nodeId,
      memberId: member._id,
      workspaceId: args.workspaceId,
      role: "creator",
      addedAt: Date.now(),
      addedById: member._id,
    });

    // Add assigned member if specified
    if (args.assignedMemberId && args.assignedRole) {
      await ctx.db.insert("treeNodeUsers", {
        nodeId,
        memberId: args.assignedMemberId,
        workspaceId: args.workspaceId,
        role: args.assignedRole,
        addedAt: Date.now(),
        addedById: member._id,
      });
    }

    return newNodeId;
  },
});

// Update node with permission check
export const updateNodeWithPermission = mutation({
  args: {
    nodeId: v.string(),
    workspaceId: v.id("workspaces"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("todo"),
        v.literal("in-progress"),
        v.literal("review"),
        v.literal("done"),
      ),
    ),
    position: v.optional(v.object({ x: v.number(), y: v.number() })),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", identity),
      )
      .first();

    if (!member) throw new Error("Member not found");

    // Check edit permission
    const hasPermission = await ctx.runQuery(
      api.advancetree.checkNodePermission,
      {
        nodeId: args.nodeId,
        workspaceId: args.workspaceId,
        action: "edit",
      },
    );

    if (!hasPermission && member.role !== "admin") {
      throw new Error("No permission to edit this node");
    }

    const node = await ctx.db
      .query("treeNodes")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.nodeId))
      .first();

    if (!node) throw new Error("Node not found");

    const updateData: any = { updatedAt: Date.now() };
    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined)
      updateData.description = args.description;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.position !== undefined) updateData.position = args.position;

    await ctx.db.patch(node._id, updateData);
    return node._id;
  },
});

// Bulk update node positions
export const bulkUpdateNodePositions = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    updates: v.array(
      v.object({
        nodeId: v.string(),
        position: v.object({ x: v.number(), y: v.number() }),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", identity),
      )
      .first();

    if (!member) throw new Error("Member not found");

    const results = [];
    for (const update of args.updates) {
      const node = await ctx.db
        .query("treeNodes")
        .withIndex("by_node_id", (q) => q.eq("nodeId", update.nodeId))
        .first();

      if (node && node.workspaceId === args.workspaceId) {
        await ctx.db.patch(node._id, {
          position: update.position,
          updatedAt: Date.now(),
        });
        results.push(update.nodeId);
      }
    }

    return { updatedNodes: results.length };
  },
});

// Node search functionality
export const searchTreeNodes = query({
  args: {
    workspaceId: v.id("workspaces"),
    searchTerm: v.string(),
    status: v.optional(
      v.union(
        v.literal("todo"),
        v.literal("in-progress"),
        v.literal("review"),
        v.literal("done"),
      ),
    ),
    level: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) return [];

    let query = ctx.db
      .query("treeNodes")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .filter((q) => q.neq(q.field("isArchived"), true));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    if (args.level !== undefined) {
      query = query.filter((q) => q.eq(q.field("level"), args.level));
    }

    const nodes = await query.collect();

    // Filter by search term
    const filteredNodes = nodes.filter(
      (node) =>
        node.title.toLowerCase().includes(args.searchTerm.toLowerCase()) ||
        (node.description &&
          node.description
            .toLowerCase()
            .includes(args.searchTerm.toLowerCase())),
    );

    return filteredNodes;
  },
});

// Node statistics
export const getNodeStatistics = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) return null;

    const nodes = await ctx.db
      .query("treeNodes")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .filter((q) => q.neq(q.field("isArchived"), true))
      .collect();

    const stats = {
      totalNodes: nodes.length,
      nodesByStatus: {
        todo: nodes.filter((n) => n.status === "todo").length,
        "in-progress": nodes.filter((n) => n.status === "in-progress").length,
        review: nodes.filter((n) => n.status === "review").length,
        done: nodes.filter((n) => n.status === "done").length,
      },
      nodesByLevel: {} as Record<number, number>,
      averageLevel: 0,
      maxLevel: 0,
    };

    // Calculate level statistics
    nodes.forEach((node) => {
      stats.nodesByLevel[node.level] =
        (stats.nodesByLevel[node.level] || 0) + 1;
      stats.maxLevel = Math.max(stats.maxLevel, node.level);
    });

    stats.averageLevel =
      nodes.length > 0
        ? nodes.reduce((sum, node) => sum + node.level, 0) / nodes.length
        : 0;

    return stats;
  },
});

// Comment editing functionality
export const updateNodeComment = mutation({
  args: {
    commentId: v.id("treeNodeComments"),
    content: v.string(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", identity),
      )
      .first();

    if (!member) throw new Error("Member not found");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    // Only comment author can edit
    if (comment.memberId !== member._id) {
      throw new Error("Only comment author can edit");
    }

    await ctx.db.patch(args.commentId, {
      content: args.content,
      isEdited: true,
      updatedAt: Date.now(),
    });

    return args.commentId;
  },
});

// Comment deletion
export const deleteNodeComment = mutation({
  args: {
    commentId: v.id("treeNodeComments"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", identity),
      )
      .first();

    if (!member) throw new Error("Member not found");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    // Only comment author or workspace admin can delete
    if (comment.memberId !== member._id && member.role !== "admin") {
      throw new Error("No permission to delete comment");
    }

    await ctx.db.delete(args.commentId);
    return { success: true };
  },
});

// Task status update
export const updateNodeTaskStatus = mutation({
  args: {
    taskId: v.id("treeNodeTasks"),
    status: v.union(
      v.literal("pending"),
      v.literal("in-progress"),
      v.literal("completed"),
    ),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", identity),
      )
      .first();

    if (!member) throw new Error("Member not found");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Only assigned user or task creator can update status
    if (
      task.assignedToId !== member._id &&
      task.assignedById !== member._id &&
      member.role !== "admin"
    ) {
      throw new Error("No permission to update task status");
    }

    await ctx.db.patch(args.taskId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.taskId;
  },
});

// Node duplication functionality
export const duplicateNode = mutation({
  args: {
    nodeId: v.string(),
    workspaceId: v.id("workspaces"),
    includeChildren: v.optional(v.boolean()),
    newParentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", identity),
      )
      .first();

    if (!member) throw new Error("Member not found");

    const originalNode = await ctx.db
      .query("treeNodes")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.nodeId))
      .first();

    if (!originalNode) throw new Error("Node not found");

    // Check permission
    const hasPermission = await ctx.runQuery(
      api.advancetree.checkNodePermission,
      {
        nodeId: args.nodeId,
        workspaceId: args.workspaceId,
        action: "view",
      },
    );

    if (!hasPermission && member.role !== "admin") {
      throw new Error("No permission to duplicate this node");
    }

    const duplicateNodeRecursive = async (
      sourceNodeId: string,
      newParentId?: string,
    ): Promise<string> => {
      const sourceNode = await ctx.db
        .query("treeNodes")
        .withIndex("by_node_id", (q) => q.eq("nodeId", sourceNodeId))
        .first();

      if (!sourceNode) throw new Error("Source node not found");

      const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Calculate new level
      let newLevel = 0;
      if (newParentId) {
        const parentNode = await ctx.db
          .query("treeNodes")
          .withIndex("by_node_id", (q) => q.eq("nodeId", newParentId))
          .first();
        newLevel = parentNode ? parentNode.level + 1 : 0;
      }

      // Create duplicate node
      const duplicatedNodeData = {
        title: `${sourceNode.title} (Copy)`,
        description: sourceNode.description,
        nodeId: newNodeId,
        parentId: newParentId,
        workspaceId: args.workspaceId,
        createdById: member._id,
        status: "todo" as const,
        position: {
          x: sourceNode.position.x + 50,
          y: sourceNode.position.y + 50,
        },
        level: newLevel,
        isArchived: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await ctx.db.insert("treeNodes", duplicatedNodeData);

      // Add creator as admin
      await ctx.db.insert("treeNodeUsers", {
        nodeId: newNodeId,
        memberId: member._id,
        workspaceId: args.workspaceId,
        role: "creator",
        addedAt: Date.now(),
        addedById: member._id,
      });

      // Duplicate children if requested
      if (args.includeChildren) {
        const children = await ctx.db
          .query("treeNodes")
          .withIndex("by_parent_id", (q) => q.eq("parentId", sourceNodeId))
          .collect();

        for (const child of children) {
          await duplicateNodeRecursive(child.nodeId, newNodeId);
        }
      }

      return newNodeId;
    };

    const newNodeId = await duplicateNodeRecursive(
      args.nodeId,
      args.newParentId || originalNode.parentId,
    );
    return {
      newNodeId,
      duplicatedNodes: args.includeChildren ? "multiple" : 1,
    };
  },
});

// Node archiving/unarchiving
export const toggleNodeArchive = mutation({
  args: {
    nodeId: v.string(),
    workspaceId: v.id("workspaces"),
    archive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", identity),
      )
      .first();

    if (!member) throw new Error("Member not found");

    // Check permission
    const hasPermission = await ctx.runQuery(
      api.advancetree.checkNodePermission,
      {
        nodeId: args.nodeId,
        workspaceId: args.workspaceId,
        action: "edit",
      },
    );

    if (!hasPermission && member.role !== "admin") {
      throw new Error("No permission to archive/unarchive this node");
    }

    const node = await ctx.db
      .query("treeNodes")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.nodeId))
      .first();

    if (!node) throw new Error("Node not found");

    await ctx.db.patch(node._id, {
      isArchived: args.archive,
      updatedAt: Date.now(),
    });

    return { nodeId: args.nodeId, archived: args.archive };
  },
});

// Advanced permission check with inheritance
export const getNodePermissions = query({
  args: {
    nodeId: v.string(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) return null;

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", identity),
      )
      .first();

    if (!member) return null;

    const permissions = {
      canView: false,
      canEdit: false,
      canCreateChild: false,
      canDelete: false,
      canAssignUsers: false,
      role: "none" as
        | "none"
        | "member"
        | "admin"
        | "creator"
        | "workspace_admin",
    };

    // Workspace admin has all permissions
    if (member.role === "admin") {
      return {
        canView: true,
        canEdit: true,
        canCreateChild: true,
        canDelete: true,
        canAssignUsers: true,
        role: "workspace_admin" as const,
      };
    }

    const node = await ctx.db
      .query("treeNodes")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.nodeId))
      .first();

    if (!node) return permissions;

    // Check direct node assignment
    const nodeUser = await ctx.db
      .query("treeNodeUsers")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.nodeId))
      .filter((q) => q.eq(q.field("memberId"), member._id))
      .first();

    if (nodeUser) {
      permissions.canView = true;
      permissions.role = nodeUser.role as any;

      if (nodeUser.role === "creator" || nodeUser.role === "admin") {
        permissions.canEdit = true;
        permissions.canCreateChild = true;
        permissions.canDelete = nodeUser.role === "creator";
        permissions.canAssignUsers = true;
      }
    }

    // Check parent permissions (inheritance)
    if (!permissions.canEdit && node.parentId) {
      const parentPermissions = await ctx.runQuery(
        api.advancetree.getNodePermissions,
        {
          nodeId: node.parentId,
          workspaceId: args.workspaceId,
        },
      );

      if (
        parentPermissions &&
        (parentPermissions.role === "creator" ||
          parentPermissions.role === "admin")
      ) {
        permissions.canView = true;
        permissions.canEdit = true;
        permissions.canCreateChild = true;
        permissions.canAssignUsers = true;
      }
    }

    return permissions;
  },
});

// Get node details for popup component
export const getNodeDetails = query({
  args: {
    nodeId: v.string(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) return null;

    const node = await ctx.db
      .query("treeNodes")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.nodeId))
      .first();

    if (!node) return null;

    // Get creator details
    const creator = await ctx.db.get(node.createdById);
    const creatorUser = creator ? await ctx.db.get(creator.userId) : null;

    // Get assigned users
    const assignedUsers = await ctx.db
      .query("treeNodeUsers")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.nodeId))
      .collect();

    const assignedUsersWithDetails = await Promise.all(
      assignedUsers.map(async (assignment) => {
        const member = await ctx.db.get(assignment.memberId);
        const user = member ? await ctx.db.get(member.userId) : null;
        return {
          ...assignment,
          name: user?.name || "Unknown User",
          role: assignment.role,
        };
      }),
    );

    return {
      ...node,
      creator: {
        name: creatorUser?.name || "Unknown User",
        role: creator?.role || "member",
      },
      assignedUsers: assignedUsersWithDetails,
    };
  },
});

// Create node comment alias for consistency
export const createNodeComment = mutation({
  args: {
    nodeId: v.string(),
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("treeNodeComments", {
      nodeId: args.nodeId,
      memberId: args.memberId,
      workspaceId: args.workspaceId,
      content: args.content,
      createdAt: Date.now(),
      isEdited: false,
    });
  },
});
