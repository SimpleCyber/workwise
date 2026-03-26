// Convex todos mutation logic
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Board functions
export const createBoard = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    background: v.optional(v.string()),
    workspaceId: v.id("workspaces"),
    visibility: v.optional(v.union(v.literal("private"), v.literal("public"))),
    allowedMembers: v.optional(v.array(v.id("members"))),
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

    const boardId = await ctx.db.insert("todoBoards", {
      name: args.name,
      description: args.description,
      background: args.background,
      memberId: member._id,
      workspaceId: args.workspaceId,
      isStarred: false,
      isArchived: false,
      visibility: args.visibility || "private",
      allowedMembers: args.allowedMembers,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create default lists
    await ctx.db.insert("todoLists", {
      name: "To Do",
      boardId,
      memberId: member._id,
      workspaceId: args.workspaceId,
      position: 0,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return boardId;
  },
});

export const getBoard = query({
  args: { boardId: v.id("todoBoards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const board = await ctx.db.get(args.boardId);
    if (!board) {
      return null;
    }

    const boardMember = await ctx.db.get(board.memberId);

    // Get the current user's membership in the board's workspace
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", board.workspaceId).eq("userId", userId),
      )
      .first();

    if (!member) {
      return null;
    }

    // Access control check
    const isCreator = boardMember?.userId === userId;
    const isPublic = board.visibility === "public";
    const isAllowed =
      board.allowedMembers && board.allowedMembers.includes(member._id);

    if (!isCreator && !isPublic && !isAllowed) {
      return null;
    }

    return board;
  },
});

export const updateBoard = mutation({
  args: {
    boardId: v.id("todoBoards"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    background: v.optional(v.string()),
    isStarred: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
    visibility: v.optional(v.union(v.literal("private"), v.literal("public"))),
    allowedMembers: v.optional(v.array(v.id("members"))),
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

export const deleteBoard = mutation({
  args: { boardId: v.id("todoBoards") },
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

    // Delete all related data
    const lists = await ctx.db
      .query("todoLists")
      .withIndex("by_board_id", (q) => q.eq("boardId", args.boardId))
      .collect();
    for (const list of lists) {
      const cards = await ctx.db
        .query("todoCards")
        .withIndex("by_list_id", (q) => q.eq("listId", list._id))
        .collect();
      for (const card of cards) {
        // Delete checklists and items
        const checklists = await ctx.db
          .query("todoChecklists")
          .withIndex("by_card_id", (q) => q.eq("cardId", card._id))
          .collect();
        for (const checklist of checklists) {
          const items = await ctx.db
            .query("todoChecklistItems")
            .withIndex("by_checklist_id", (q) =>
              q.eq("checklistId", checklist._id),
            )
            .collect();
          for (const item of items) {
            await ctx.db.delete(item._id);
          }
          await ctx.db.delete(checklist._id);
        }
        // Delete comments
        const comments = await ctx.db
          .query("todoComments")
          .withIndex("by_card_id", (q) => q.eq("cardId", card._id))
          .collect();
        for (const comment of comments) {
          await ctx.db.delete(comment._id);
        }
        await ctx.db.delete(card._id);
      }
      await ctx.db.delete(list._id);
    }
    await ctx.db.delete(args.boardId);
  },
});

// List functions
export const createList = mutation({
  args: {
    name: v.string(),
    boardId: v.id("todoBoards"),
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

    // Get the highest position
    const lists = await ctx.db
      .query("todoLists")
      .withIndex("by_board_id", (q) => q.eq("boardId", args.boardId))
      .collect();
    const maxPosition = Math.max(...lists.map((l) => l.position), -1);

    return await ctx.db.insert("todoLists", {
      name: args.name,
      boardId: args.boardId,
      memberId: member._id,
      workspaceId: board.workspaceId,
      position: maxPosition + 1,
      isArchived: false,
      sortBy: "manual",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getLists = query({
  args: {
    boardId: v.id("todoBoards"),
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

    const member = await ctx.db.get(board.memberId);
    if (!member || member.userId !== userId) {
      return [];
    }

    const lists = await ctx.db
      .query("todoLists")
      .withIndex("by_board_id", (q) => q.eq("boardId", args.boardId))
      .collect();

    return lists
      .filter((list) => (args.includeArchived ? true : !list.isArchived))
      .sort((a, b) => a.position - b.position);
  },
});

export const updateList = mutation({
  args: {
    listId: v.id("todoLists"),
    name: v.optional(v.string()),
    position: v.optional(v.number()),
    isArchived: v.optional(v.boolean()),
    isCollapsed: v.optional(v.boolean()),
    sortBy: v.optional(
      v.union(
        v.literal("newest"),
        v.literal("oldest"),
        v.literal("alphabetical"),
        v.literal("manual"),
      ),
    ),
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

    const member = await ctx.db.get(list.memberId);
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const { listId, ...updates } = args;
    await ctx.db.patch(args.listId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const reorderList = mutation({
  args: {
    boardId: v.id("todoBoards"),
    listId: v.id("todoLists"),
    newIndex: v.number(),
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

    const lists = await ctx.db
      .query("todoLists")
      .withIndex("by_board_id", (q) => q.eq("boardId", args.boardId))
      .collect();

    const sortedLists = lists
      .filter((l) => !l.isArchived)
      .sort((a, b) => a.position - b.position);

    const listToMove = sortedLists.find((l) => l._id === args.listId);
    if (!listToMove) {
      throw new Error("List not found");
    }

    const otherLists = sortedLists.filter((l) => l._id !== args.listId);
    otherLists.splice(args.newIndex, 0, listToMove);

    for (let i = 0; i < otherLists.length; i++) {
      await ctx.db.patch(otherLists[i]._id, {
        position: i,
        updatedAt: Date.now(),
      });
    }
  },
});

export const deleteList = mutation({
  args: { listId: v.id("todoLists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }

    const member = await ctx.db.get(list.memberId);
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete all cards in this list
    const cards = await ctx.db
      .query("todoCards")
      .withIndex("by_list_id", (q) => q.eq("listId", args.listId))
      .collect();
    for (const card of cards) {
      // Delete checklists and items
      const checklists = await ctx.db
        .query("todoChecklists")
        .withIndex("by_card_id", (q) => q.eq("cardId", card._id))
        .collect();
      for (const checklist of checklists) {
        const items = await ctx.db
          .query("todoChecklistItems")
          .withIndex("by_checklist_id", (q) =>
            q.eq("checklistId", checklist._id),
          )
          .collect();
        for (const item of items) {
          await ctx.db.delete(item._id);
        }
        await ctx.db.delete(checklist._id);
      }
      // Delete comments
      const comments = await ctx.db
        .query("todoComments")
        .withIndex("by_card_id", (q) => q.eq("cardId", card._id))
        .collect();
      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }
      await ctx.db.delete(card._id);
    }
    await ctx.db.delete(args.listId);
  },
});

// Card functions
export const createCard = mutation({
  args: {
    title: v.string(),
    listId: v.id("todoLists"),
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

    const member = await ctx.db.get(list.memberId);
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Get the highest position in this list
    const cards = await ctx.db
      .query("todoCards")
      .withIndex("by_list_id", (q) => q.eq("listId", args.listId))
      .collect();
    const maxPosition = Math.max(...cards.map((c) => c.position), -1);

    return await ctx.db.insert("todoCards", {
      title: args.title,
      listId: args.listId,
      boardId: list.boardId,
      memberId: member._id,
      workspaceId: list.workspaceId,
      position: maxPosition + 1,
      isCompleted: false,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getCards = query({
  args: {
    listId: v.id("todoLists"),
    includeArchived: v.optional(v.boolean()),
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

    const member = await ctx.db.get(list.memberId);
    if (!member || member.userId !== userId) {
      return [];
    }

    const cards = await ctx.db
      .query("todoCards")
      .withIndex("by_list_id", (q) => q.eq("listId", args.listId))
      .collect();

    return cards
      .filter((card) => (args.includeArchived ? true : !card.isArchived))
      .sort((a, b) => a.position - b.position);
  },
});

export const getCard = query({
  args: { cardId: v.id("todoCards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const card = await ctx.db.get(args.cardId);
    if (!card) {
      return null;
    }

    const member = await ctx.db.get(card.memberId);
    if (!member || member.userId !== userId) {
      return null;
    }

    return card;
  },
});

export const updateCard = mutation({
  args: {
    cardId: v.id("todoCards"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    isCompleted: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
    labels: v.optional(v.array(v.string())),
    listId: v.optional(v.id("todoLists")),
    position: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    const member = await ctx.db.get(card.memberId);
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const { cardId, ...updates } = args;
    await ctx.db.patch(args.cardId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const reorderCard = mutation({
  args: {
    cardId: v.id("todoCards"),
    newListId: v.id("todoLists"),
    newIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    const list = await ctx.db.get(args.newListId);
    if (!list) {
      throw new Error("Destination list not found");
    }

    const member = await ctx.db.get(list.memberId);
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Get all cards in the destination list
    const cards = await ctx.db
      .query("todoCards")
      .withIndex("by_list_id", (q) => q.eq("listId", args.newListId))
      .collect();

    let sortedCards = cards
      .filter((c) => !c.isArchived)
      .sort((a, b) => a.position - b.position);

    const isSameList = card.listId === args.newListId;

    if (isSameList) {
      // Remove card from its current position
      sortedCards = sortedCards.filter((c) => c._id !== args.cardId);
    }

    // Insert card at new position
    sortedCards.splice(args.newIndex, 0, {
      ...card,
      listId: args.newListId,
    } as any);

    // Update positions for all cards in destination list
    for (let i = 0; i < sortedCards.length; i++) {
      await ctx.db.patch(sortedCards[i]._id, {
        listId: args.newListId,
        position: i,
        updatedAt: Date.now(),
      });
    }

    // Update list to manual sorting
    if (list.sortBy !== "manual") {
      await ctx.db.patch(args.newListId, {
        sortBy: "manual",
        updatedAt: Date.now(),
      });
    }
  },
});

export const deleteCard = mutation({
  args: { cardId: v.id("todoCards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    const member = await ctx.db.get(card.memberId);
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete checklists and items
    const checklists = await ctx.db
      .query("todoChecklists")
      .withIndex("by_card_id", (q) => q.eq("cardId", args.cardId))
      .collect();
    for (const checklist of checklists) {
      const items = await ctx.db
        .query("todoChecklistItems")
        .withIndex("by_checklist_id", (q) => q.eq("checklistId", checklist._id))
        .collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
      await ctx.db.delete(checklist._id);
    }
    // Delete comments
    const comments = await ctx.db
      .query("todoComments")
      .withIndex("by_card_id", (q) => q.eq("cardId", args.cardId))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }
    await ctx.db.delete(args.cardId);
  },
});

// Get recent cards for workspace
export const getRecentCards = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
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

    const cards = await ctx.db
      .query("todoCards")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .take(args.limit || 10);

    // Get board and list info for each card
    const cardsWithDetails = await Promise.all(
      cards.map(async (card) => {
        const list = await ctx.db.get(card.listId);
        const board = await ctx.db.get(card.boardId);
        return {
          ...card,
          list,
          board,
        };
      }),
    );

    return cardsWithDetails;
  },
});

// Checklist functions (keeping existing ones)
export const createChecklist = mutation({
  args: {
    title: v.string(),
    cardId: v.id("todoCards"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    const member = await ctx.db.get(card.memberId);
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const checklists = await ctx.db
      .query("todoChecklists")
      .withIndex("by_card_id", (q) => q.eq("cardId", args.cardId))
      .collect();
    const maxPosition = Math.max(...checklists.map((c) => c.position), -1);

    return await ctx.db.insert("todoChecklists", {
      title: args.title,
      cardId: args.cardId,
      memberId: member._id,
      workspaceId: card.workspaceId,
      position: maxPosition + 1,
      createdAt: Date.now(),
    });
  },
});

export const getChecklists = query({
  args: { cardId: v.id("todoCards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const card = await ctx.db.get(args.cardId);
    if (!card) {
      return [];
    }

    const member = await ctx.db.get(card.memberId);
    if (!member || member.userId !== userId) {
      return [];
    }

    return await ctx.db
      .query("todoChecklists")
      .withIndex("by_card_id", (q) => q.eq("cardId", args.cardId))
      .order("asc")
      .collect();
  },
});

export const createChecklistItem = mutation({
  args: {
    text: v.string(),
    checklistId: v.id("todoChecklists"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const checklist = await ctx.db.get(args.checklistId);
    if (!checklist) {
      throw new Error("Checklist not found");
    }

    const member = await ctx.db.get(checklist.memberId);
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const items = await ctx.db
      .query("todoChecklistItems")
      .withIndex("by_checklist_id", (q) =>
        q.eq("checklistId", args.checklistId),
      )
      .collect();
    const maxPosition = Math.max(...items.map((i) => i.position), -1);

    return await ctx.db.insert("todoChecklistItems", {
      text: args.text,
      checklistId: args.checklistId,
      cardId: checklist.cardId,
      memberId: member._id,
      workspaceId: checklist.workspaceId,
      isCompleted: false,
      position: maxPosition + 1,
      createdAt: Date.now(),
    });
  },
});

export const getChecklistItems = query({
  args: { checklistId: v.id("todoChecklists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const checklist = await ctx.db.get(args.checklistId);
    if (!checklist) {
      return [];
    }

    const member = await ctx.db.get(checklist.memberId);
    if (!member || member.userId !== userId) {
      return [];
    }

    return await ctx.db
      .query("todoChecklistItems")
      .withIndex("by_checklist_id", (q) =>
        q.eq("checklistId", args.checklistId),
      )
      .order("asc")
      .collect();
  },
});

export const updateChecklistItem = mutation({
  args: {
    itemId: v.id("todoChecklistItems"),
    text: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    const member = await ctx.db.get(item.memberId);
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const { itemId, ...updates } = args;
    await ctx.db.patch(args.itemId, updates);
  },
});

// Comment functions
export const createComment = mutation({
  args: {
    content: v.string(),
    cardId: v.id("todoCards"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    const member = await ctx.db.get(card.memberId);
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("todoComments", {
      content: args.content,
      cardId: args.cardId,
      memberId: member._id,
      workspaceId: card.workspaceId,
      createdAt: Date.now(),
    });
  },
});

export const getComments = query({
  args: { cardId: v.id("todoCards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const card = await ctx.db.get(args.cardId);
    if (!card) {
      return [];
    }

    const member = await ctx.db.get(card.memberId);
    if (!member || member.userId !== userId) {
      return [];
    }

    const comments = await ctx.db
      .query("todoComments")
      .withIndex("by_card_id", (q) => q.eq("cardId", args.cardId))
      .order("desc")
      .collect();

    // Get user info for each comment
    const commentsWithUser = await Promise.all(
      comments.map(async (comment) => {
        const commentMember = await ctx.db.get(comment.memberId);
        const user = commentMember
          ? await ctx.db.get(commentMember.userId)
          : null;
        return {
          ...comment,
          user: user ? { name: user.name, image: user.image } : null,
        };
      }),
    );

    return commentsWithUser;
  },
});

// Star/Unstar board functions
export const starBoard = mutation({
  args: { boardId: v.id("todoBoards") },
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

    await ctx.db.patch(args.boardId, {
      isStarred: true,
      updatedAt: Date.now(),
    });
  },
});

export const unstarBoard = mutation({
  args: { boardId: v.id("todoBoards") },
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

    await ctx.db.patch(args.boardId, {
      isStarred: false,
      updatedAt: Date.now(),
    });
  },
});

// Add this to your todos.ts Convex file
export const toggleStarBoard = mutation({
  args: { boardId: v.id("todoBoards") },
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

    // If we're trying to star this board, first unstar all other boards in the workspace
    if (!board.isStarred) {
      const allBoards = await ctx.db
        .query("todoBoards")
        .withIndex("by_workspace_id", (q) =>
          q.eq("workspaceId", board.workspaceId),
        )
        .collect();

      // Unstar all other boards
      for (const otherBoard of allBoards) {
        if (otherBoard._id !== args.boardId && otherBoard.isStarred) {
          await ctx.db.patch(otherBoard._id, {
            isStarred: false,
            updatedAt: Date.now(),
          });
        }
      }
    }

    // Toggle the current board's star status
    await ctx.db.patch(args.boardId, {
      isStarred: !board.isStarred,
      updatedAt: Date.now(),
    });

    return !board.isStarred;
  },
});

// Get starred boards

// In your todos.ts Convex file, update the getStarredBoards query
export const getStarredBoards = query({
  args: { workspaceId: v.id("workspaces") },
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
      .query("todoBoards")
      .withIndex("by_member_workspace", (q) =>
        q.eq("memberId", member._id).eq("workspaceId", args.workspaceId),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("isStarred"), true),
          q.eq(q.field("isArchived"), false),
        ),
      )
      .collect();

    return boards;
  },
});

// Update your existing getBoards query to sort starred boards first
export const getBoards = query({
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
      .query("todoBoards")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .collect();

    return boards
      .filter((board) => {
        // Filter by archived status if requested
        if (!args.includeArchived && board.isArchived) return false;

        // Visibility Check

        // 1. If user is the creator (memberId matches), they can see it
        if (board.memberId === member._id) {
          return true;
        }

        // 2. If visibility is public:
        if (board.visibility === "public") {
          // If allowedMembers is specified, check if user is in it
          if (board.allowedMembers && board.allowedMembers.length > 0) {
            return board.allowedMembers.includes(member._id);
          }
          // If no allowedMembers (or empty), it acts as "Shared with everyone"
          return true;
        }

        // 3. Default to private (hidden) if not owner and not public
        // Also if visibility is undefined, default to private (backward compatibility)
        return false;
      })
      .sort((a, b) => {
        // Sort by starred first, then by creation date
        if (a.isStarred && !b.isStarred) return -1;
        if (!a.isStarred && b.isStarred) return 1;
        return b.createdAt - a.createdAt;
      });
  },
});
