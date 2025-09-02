import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

interface TreeNodeInput {
  title: string;
  description: string;
  children?: TreeNodeInput[];
}

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
    title: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.string()),
    workspaceId: v.id("workspaces"),
    position: v.object({ x: v.number(), y: v.number() }),
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

    // Generate unique node ID
    const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate level based on parent
    let level = 0;
    if (args.parentId) {
      const parentNode = await ctx.db
        .query("treeNodes")
        .withIndex("by_node_id", (q) => q.eq("nodeId", args.parentId!))
        .first();

      if (parentNode) {
        level = parentNode.level + 1;
      }
    }

    const nodeData = {
      title: args.title,
      description: args.description,
      nodeId,
      parentId: args.parentId,
      workspaceId: args.workspaceId,
      createdById: member._id,
      status: "in-progress" as const, // Use valid status value
      position: args.position,
      level,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newNodeId = await ctx.db.insert("treeNodes", nodeData);

    // Add creator as admin user to the node
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
        v.literal("in-progress"),
        v.literal("blocked"),
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

// Update node with permission check
export const updateNodeWithPermission = mutation({
  args: {
    nodeId: v.string(),
    workspaceId: v.id("workspaces"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("in-progress"),
        v.literal("blocked"),
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

export const expandNodeWithAI = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    parentNodeId: v.string(),
    childNodes: v.array(v.any()), // TreeNodeInput[]
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

    // Get parent node for positioning
    const parentNode = await ctx.db
      .query("treeNodes")
      .withIndex("by_node_id", (q) => q.eq("nodeId", args.parentNodeId))
      .first();

    if (!parentNode) throw new Error("Parent node not found");

    // Recursively create child nodes
    const createChildNodes = async (
      nodes: TreeNodeInput[],
      parentId: string,
      level: number,
      baseX: number,
      baseY: number,
    ) => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Calculate position (spread children horizontally)
        const position = {
          x: baseX + (i - (nodes.length - 1) / 2) * 300,
          y: baseY + 200,
        };

        await ctx.db.insert("treeNodes", {
          title: node.title,
          description: node.description,
          nodeId,
          parentId,
          workspaceId: args.workspaceId,
          createdById: member._id,
          status: "in-progress",
          position,
          level,
          isArchived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Add creator as admin to child node
        await ctx.db.insert("treeNodeUsers", {
          nodeId,
          memberId: member._id,
          workspaceId: args.workspaceId,
          role: "creator",
          addedAt: Date.now(),
          addedById: member._id,
        });

        // Recursively create grandchildren
        if (node.children && node.children.length > 0) {
          await createChildNodes(
            node.children,
            nodeId,
            level + 1,
            position.x,
            position.y,
          );
        }
      }
    };

    // Create all child nodes
    await createChildNodes(
      args.childNodes,
      args.parentNodeId,
      parentNode.level + 1,
      parentNode.position.x,
      parentNode.position.y,
    );

    return { message: "Node expanded with AI successfully" };
  },
});

export const createAIGeneratedTree = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    rootTitle: v.string(),
    rootDescription: v.string(),
    treeData: v.array(v.any()), // TreeNodeInput[]
    rootPosition: v.object({ x: v.number(), y: v.number() }),
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

    // Create root node
    const rootNodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await ctx.db.insert("treeNodes", {
      title: args.rootTitle,
      description: args.rootDescription,
      nodeId: rootNodeId,
      parentId: undefined,
      workspaceId: args.workspaceId,
      createdById: member._id,
      status: "in-progress",
      position: args.rootPosition,
      level: 0,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add creator as admin to root node
    await ctx.db.insert("treeNodeUsers", {
      nodeId: rootNodeId,
      memberId: member._id,
      workspaceId: args.workspaceId,
      role: "creator",
      addedAt: Date.now(),
      addedById: member._id,
    });

    // Recursively create child nodes
    const createChildNodes = async (
      nodes: TreeNodeInput[],
      parentId: string,
      level: number,
      baseX: number,
      baseY: number,
    ) => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Calculate position (spread children horizontally)
        const position = {
          x: baseX + (i - (nodes.length - 1) / 2) * 300,
          y: baseY + 200,
        };

        await ctx.db.insert("treeNodes", {
          title: node.title,
          description: node.description,
          nodeId,
          parentId,
          workspaceId: args.workspaceId,
          createdById: member._id,
          status: "in-progress",
          position,
          level,
          isArchived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Add creator as admin to child node
        await ctx.db.insert("treeNodeUsers", {
          nodeId,
          memberId: member._id,
          workspaceId: args.workspaceId,
          role: "creator",
          addedAt: Date.now(),
          addedById: member._id,
        });

        // Recursively create grandchildren
        if (node.children && node.children.length > 0) {
          await createChildNodes(
            node.children,
            nodeId,
            level + 1,
            position.x,
            position.y,
          );
        }
      }
    };

    // Create all child nodes
    await createChildNodes(
      args.treeData,
      rootNodeId,
      1,
      args.rootPosition.x,
      args.rootPosition.y,
    );

    return { rootNodeId, message: "AI-generated tree created successfully" };
  },
});

// latter :)

// // Get comments for a node
// export const getNodeComments = query({
//   args: { nodeId: v.string() },
//   handler: async (ctx, args) => {
//     const identity = await getAuthUserId(ctx);
//     if (!identity) return [];

//     const comments = await ctx.db
//       .query("treeNodeComments")
//       .withIndex("by_node_id", (q) => q.eq("nodeId", args.nodeId))
//       .order("desc")
//       .collect();

//     const commentsWithUsers = await Promise.all(
//       comments.map(async (comment) => {
//         const member = await ctx.db.get(comment.memberId);
//         const user = member ? await ctx.db.get(member.userId) : null;
//         return {
//           ...comment,
//           member,
//           user,
//         };
//       }),
//     );

//     return commentsWithUsers;
//   },
// });

// // Add comment to node
// export const addNodeComment = mutation({
//   args: {
//     nodeId: v.string(),
//     workspaceId: v.id("workspaces"),
//     content: v.string(),
//   },
//   handler: async (ctx, args) => {
//     const identity = await getAuthUserId(ctx);
//     if (!identity) throw new Error("Unauthorized");

//     const member = await ctx.db
//       .query("members")
//       .withIndex("by_workspace_id_user_id", (q) =>
//         q.eq("workspaceId", args.workspaceId).eq("userId", identity),
//       )
//       .first();

//     if (!member) throw new Error("Member not found");

//     return await ctx.db.insert("treeNodeComments", {
//       nodeId: args.nodeId,
//       memberId: member._id,
//       workspaceId: args.workspaceId,
//       content: args.content,
//       createdAt: Date.now(),
//       isEdited: false,
//     });
//   },
// });

// // Comment editing functionality
// export const updateNodeComment = mutation({
//   args: {
//     commentId: v.id("treeNodeComments"),
//     content: v.string(),
//     workspaceId: v.id("workspaces"),
//   },
//   handler: async (ctx, args) => {
//     const identity = await getAuthUserId(ctx);
//     if (!identity) throw new Error("Unauthorized");

//     const member = await ctx.db
//       .query("members")
//       .withIndex("by_workspace_id_user_id", (q) =>
//         q.eq("workspaceId", args.workspaceId).eq("userId", identity),
//       )
//       .first();

//     if (!member) throw new Error("Member not found");

//     const comment = await ctx.db.get(args.commentId);
//     if (!comment) throw new Error("Comment not found");

//     // Only comment author can edit
//     if (comment.memberId !== member._id) {
//       throw new Error("Only comment author can edit");
//     }

//     await ctx.db.patch(args.commentId, {
//       content: args.content,
//       isEdited: true,
//       updatedAt: Date.now(),
//     });

//     return args.commentId;
//   },
// });

// // Comment deletion
// export const deleteNodeComment = mutation({
//   args: {
//     commentId: v.id("treeNodeComments"),
//     workspaceId: v.id("workspaces"),
//   },
//   handler: async (ctx, args) => {
//     const identity = await getAuthUserId(ctx);
//     if (!identity) throw new Error("Unauthorized");

//     const member = await ctx.db
//       .query("members")
//       .withIndex("by_workspace_id_user_id", (q) =>
//         q.eq("workspaceId", args.workspaceId).eq("userId", identity),
//       )
//       .first();

//     if (!member) throw new Error("Member not found");

//     const comment = await ctx.db.get(args.commentId);
//     if (!comment) throw new Error("Comment not found");

//     // Only comment author or workspace admin can delete
//     if (comment.memberId !== member._id && member.role !== "admin") {
//       throw new Error("No permission to delete comment");
//     }

//     await ctx.db.delete(args.commentId);
//     return { success: true };
//   },
// });
