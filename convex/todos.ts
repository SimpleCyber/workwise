import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"

// Board functions
export const createBoard = mutation({
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

    const boardId = await ctx.db.insert("todoBoards", {
      name: args.name,
      description: args.description,
      background: args.background,
      memberId: member._id,
      workspaceId: args.workspaceId,
      isStarred: false,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

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
    })
    await ctx.db.insert("todoLists", {
      name: "Doing",
      boardId,
      memberId: member._id,
      workspaceId: args.workspaceId,
      position: 1,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    await ctx.db.insert("todoLists", {
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

export const getBoards = query({
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

    const query = ctx.db
      .query("todoBoards")
      .withIndex("by_member_workspace", (q) => q.eq("memberId", member._id).eq("workspaceId", args.workspaceId))

    const boards = await query.collect()

    return boards
      .filter((board) => (args.includeArchived ? true : !board.isArchived))
      .sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const getBoard = query({
  args: { boardId: v.id("todoBoards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return null
    }

    const board = await ctx.db.get(args.boardId)
    if (!board) {
      return null
    }

    const member = await ctx.db.get(board.memberId)
    if (!member || member.userId !== userId) {
      return null
    }

    return board
  },
})

export const updateBoard = mutation({
  args: {
    boardId: v.id("todoBoards"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    background: v.optional(v.string()),
    isStarred: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
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

    const member = await ctx.db.get(board.memberId)
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const { boardId, ...updates } = args
    await ctx.db.patch(args.boardId, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

export const deleteBoard = mutation({
  args: { boardId: v.id("todoBoards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const board = await ctx.db.get(args.boardId)
    if (!board) {
      throw new Error("Board not found")
    }

    const member = await ctx.db.get(board.memberId)
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized")
    }

    // Delete all related data
    const lists = await ctx.db
      .query("todoLists")
      .withIndex("by_board_id", (q) => q.eq("boardId", args.boardId))
      .collect()
    for (const list of lists) {
      const cards = await ctx.db
        .query("todoCards")
        .withIndex("by_list_id", (q) => q.eq("listId", list._id))
        .collect()
      for (const card of cards) {
        // Delete checklists and items
        const checklists = await ctx.db
          .query("todoChecklists")
          .withIndex("by_card_id", (q) => q.eq("cardId", card._id))
          .collect()
        for (const checklist of checklists) {
          const items = await ctx.db
            .query("todoChecklistItems")
            .withIndex("by_checklist_id", (q) => q.eq("checklistId", checklist._id))
            .collect()
          for (const item of items) {
            await ctx.db.delete(item._id)
          }
          await ctx.db.delete(checklist._id)
        }
        // Delete comments
        const comments = await ctx.db
          .query("todoComments")
          .withIndex("by_card_id", (q) => q.eq("cardId", card._id))
          .collect()
        for (const comment of comments) {
          await ctx.db.delete(comment._id)
        }
        await ctx.db.delete(card._id)
      }
      await ctx.db.delete(list._id)
    }
    await ctx.db.delete(args.boardId)
  },
})

// List functions
export const createList = mutation({
  args: {
    name: v.string(),
    boardId: v.id("todoBoards"),
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

    const member = await ctx.db.get(board.memberId)
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized")
    }

    // Get the highest position
    const lists = await ctx.db
      .query("todoLists")
      .withIndex("by_board_id", (q) => q.eq("boardId", args.boardId))
      .collect()
    const maxPosition = Math.max(...lists.map((l) => l.position), -1)

    return await ctx.db.insert("todoLists", {
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

export const getLists = query({
  args: {
    boardId: v.id("todoBoards"),
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

    const member = await ctx.db.get(board.memberId)
    if (!member || member.userId !== userId) {
      return []
    }

    const lists = await ctx.db
      .query("todoLists")
      .withIndex("by_board_id", (q) => q.eq("boardId", args.boardId))
      .collect()

    return lists
      .filter((list) => (args.includeArchived ? true : !list.isArchived))
      .sort((a, b) => a.position - b.position)
  },
})

export const updateList = mutation({
  args: {
    listId: v.id("todoLists"),
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

    const member = await ctx.db.get(list.memberId)
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const { listId, ...updates } = args
    await ctx.db.patch(args.listId, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

export const deleteList = mutation({
  args: { listId: v.id("todoLists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const list = await ctx.db.get(args.listId)
    if (!list) {
      throw new Error("List not found")
    }

    const member = await ctx.db.get(list.memberId)
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized")
    }

    // Delete all cards in this list
    const cards = await ctx.db
      .query("todoCards")
      .withIndex("by_list_id", (q) => q.eq("listId", args.listId))
      .collect()
    for (const card of cards) {
      // Delete checklists and items
      const checklists = await ctx.db
        .query("todoChecklists")
        .withIndex("by_card_id", (q) => q.eq("cardId", card._id))
        .collect()
      for (const checklist of checklists) {
        const items = await ctx.db
          .query("todoChecklistItems")
          .withIndex("by_checklist_id", (q) => q.eq("checklistId", checklist._id))
          .collect()
        for (const item of items) {
          await ctx.db.delete(item._id)
        }
        await ctx.db.delete(checklist._id)
      }
      // Delete comments
      const comments = await ctx.db
        .query("todoComments")
        .withIndex("by_card_id", (q) => q.eq("cardId", card._id))
        .collect()
      for (const comment of comments) {
        await ctx.db.delete(comment._id)
      }
      await ctx.db.delete(card._id)
    }
    await ctx.db.delete(args.listId)
  },
})

// Card functions
export const createCard = mutation({
  args: {
    title: v.string(),
    listId: v.id("todoLists"),
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

    const member = await ctx.db.get(list.memberId)
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized")
    }

    // Get the highest position in this list
    const cards = await ctx.db
      .query("todoCards")
      .withIndex("by_list_id", (q) => q.eq("listId", args.listId))
      .collect()
    const maxPosition = Math.max(...cards.map((c) => c.position), -1)

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
    })
  },
})

export const getCards = query({
  args: {
    listId: v.id("todoLists"),
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

    const member = await ctx.db.get(list.memberId)
    if (!member || member.userId !== userId) {
      return []
    }

    const cards = await ctx.db
      .query("todoCards")
      .withIndex("by_list_id", (q) => q.eq("listId", args.listId))
      .collect()

    return cards
      .filter((card) => (args.includeArchived ? true : !card.isArchived))
      .sort((a, b) => a.position - b.position)
  },
})

export const getCard = query({
  args: { cardId: v.id("todoCards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return null
    }

    const card = await ctx.db.get(args.cardId)
    if (!card) {
      return null
    }

    const member = await ctx.db.get(card.memberId)
    if (!member || member.userId !== userId) {
      return null
    }

    return card
  },
})

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
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const card = await ctx.db.get(args.cardId)
    if (!card) {
      throw new Error("Card not found")
    }

    const member = await ctx.db.get(card.memberId)
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const { cardId, ...updates } = args
    await ctx.db.patch(args.cardId, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

export const deleteCard = mutation({
  args: { cardId: v.id("todoCards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const card = await ctx.db.get(args.cardId)
    if (!card) {
      throw new Error("Card not found")
    }

    const member = await ctx.db.get(card.memberId)
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized")
    }

    // Delete checklists and items
    const checklists = await ctx.db
      .query("todoChecklists")
      .withIndex("by_card_id", (q) => q.eq("cardId", args.cardId))
      .collect()
    for (const checklist of checklists) {
      const items = await ctx.db
        .query("todoChecklistItems")
        .withIndex("by_checklist_id", (q) => q.eq("checklistId", checklist._id))
        .collect()
      for (const item of items) {
        await ctx.db.delete(item._id)
      }
      await ctx.db.delete(checklist._id)
    }
    // Delete comments
    const comments = await ctx.db
      .query("todoComments")
      .withIndex("by_card_id", (q) => q.eq("cardId", args.cardId))
      .collect()
    for (const comment of comments) {
      await ctx.db.delete(comment._id)
    }
    await ctx.db.delete(args.cardId)
  },
})

// Get recent cards for workspace
export const getRecentCards = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
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

    const cards = await ctx.db
      .query("todoCards")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .take(args.limit || 10)

    // Get board and list info for each card
    const cardsWithDetails = await Promise.all(
      cards.map(async (card) => {
        const list = await ctx.db.get(card.listId)
        const board = await ctx.db.get(card.boardId)
        return {
          ...card,
          list,
          board,
        }
      }),
    )

    return cardsWithDetails
  },
})

// Checklist functions (keeping existing ones)
export const createChecklist = mutation({
  args: {
    title: v.string(),
    cardId: v.id("todoCards"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const card = await ctx.db.get(args.cardId)
    if (!card) {
      throw new Error("Card not found")
    }

    const member = await ctx.db.get(card.memberId)
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const checklists = await ctx.db
      .query("todoChecklists")
      .withIndex("by_card_id", (q) => q.eq("cardId", args.cardId))
      .collect()
    const maxPosition = Math.max(...checklists.map((c) => c.position), -1)

    return await ctx.db.insert("todoChecklists", {
      title: args.title,
      cardId: args.cardId,
      memberId: member._id,
      workspaceId: card.workspaceId,
      position: maxPosition + 1,
      createdAt: Date.now(),
    })
  },
})

export const getChecklists = query({
  args: { cardId: v.id("todoCards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    const card = await ctx.db.get(args.cardId)
    if (!card) {
      return []
    }

    const member = await ctx.db.get(card.memberId)
    if (!member || member.userId !== userId) {
      return []
    }

    return await ctx.db
      .query("todoChecklists")
      .withIndex("by_card_id", (q) => q.eq("cardId", args.cardId))
      .order("asc")
      .collect()
  },
})

export const createChecklistItem = mutation({
  args: {
    text: v.string(),
    checklistId: v.id("todoChecklists"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const checklist = await ctx.db.get(args.checklistId)
    if (!checklist) {
      throw new Error("Checklist not found")
    }

    const member = await ctx.db.get(checklist.memberId)
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const items = await ctx.db
      .query("todoChecklistItems")
      .withIndex("by_checklist_id", (q) => q.eq("checklistId", args.checklistId))
      .collect()
    const maxPosition = Math.max(...items.map((i) => i.position), -1)

    return await ctx.db.insert("todoChecklistItems", {
      text: args.text,
      checklistId: args.checklistId,
      cardId: checklist.cardId,
      memberId: member._id,
      workspaceId: checklist.workspaceId,
      isCompleted: false,
      position: maxPosition + 1,
      createdAt: Date.now(),
    })
  },
})

export const getChecklistItems = query({
  args: { checklistId: v.id("todoChecklists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    const checklist = await ctx.db.get(args.checklistId)
    if (!checklist) {
      return []
    }

    const member = await ctx.db.get(checklist.memberId)
    if (!member || member.userId !== userId) {
      return []
    }

    return await ctx.db
      .query("todoChecklistItems")
      .withIndex("by_checklist_id", (q) => q.eq("checklistId", args.checklistId))
      .order("asc")
      .collect()
  },
})

export const updateChecklistItem = mutation({
  args: {
    itemId: v.id("todoChecklistItems"),
    text: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const item = await ctx.db.get(args.itemId)
    if (!item) {
      throw new Error("Item not found")
    }

    const member = await ctx.db.get(item.memberId)
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const { itemId, ...updates } = args
    await ctx.db.patch(args.itemId, updates)
  },
})

// Comment functions
export const createComment = mutation({
  args: {
    content: v.string(),
    cardId: v.id("todoCards"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const card = await ctx.db.get(args.cardId)
    if (!card) {
      throw new Error("Card not found")
    }

    const member = await ctx.db.get(card.memberId)
    if (!member || member.userId !== userId) {
      throw new Error("Unauthorized")
    }

    return await ctx.db.insert("todoComments", {
      content: args.content,
      cardId: args.cardId,
      memberId: member._id,
      workspaceId: card.workspaceId,
      createdAt: Date.now(),
    })
  },
})

export const getComments = query({
  args: { cardId: v.id("todoCards") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    const card = await ctx.db.get(args.cardId)
    if (!card) {
      return []
    }

    const member = await ctx.db.get(card.memberId)
    if (!member || member.userId !== userId) {
      return []
    }

    const comments = await ctx.db
      .query("todoComments")
      .withIndex("by_card_id", (q) => q.eq("cardId", args.cardId))
      .order("desc")
      .collect()

    // Get user info for each comment
    const commentsWithUser = await Promise.all(
      comments.map(async (comment) => {
        const commentMember = await ctx.db.get(comment.memberId)
        const user = commentMember ? await ctx.db.get(commentMember.userId) : null
        return {
          ...comment,
          user: user ? { name: user.name, image: user.image } : null,
        }
      }),
    )

    return commentsWithUser
  },
})
