import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const listForBoard = query({
  args: { boardId: v.id("projectBoards") },
  handler: async (ctx, { boardId }) => {
    const chats = await ctx.db
      .query("projectChats")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .order("desc")
      .collect()

    const enriched = await Promise.all(
      chats.map(async (c) => {
        const msgs = await ctx.db
          .query("projectChatMessages")
          .withIndex("by_chat", (q) => q.eq("chatId", c._id))
          .order("desc")
          .take(1)
        const last = msgs[0]

        const allForCount = await ctx.db
          .query("projectChatMessages")
          .withIndex("by_chat", (q) => q.eq("chatId", c._id))
          .collect()
        const messageCount = allForCount.length

        return {
          ...c,
          id: c._id,
          preview: last?.content ?? "Ask anything…",
          messageCount,
        }
      }),
    )

    return enriched
  },
})

export const getMessages = query({
  args: { chatId: v.id("projectChats"), limit: v.optional(v.number()) },
  handler: async (ctx, { chatId, limit = 200 }) => {
    const msgs = await ctx.db
      .query("projectChatMessages")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .order("asc")
      .take(limit)
    return msgs.map((m) => ({ ...m, id: m._id }))
  },
})

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    boardId: v.id("projectBoards"),
    title: v.string(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, { workspaceId, boardId, title, createdBy }) => {
    const now = new Date().toISOString()
    const chatId = await ctx.db.insert("projectChats", {
      workspaceId,
      boardId,
      title: title || "New chat",
      pinned: false,
      createdBy,
      createdAt: now,
      updatedAt: now,
    })
    return chatId
  },
})

export const rename = mutation({
  args: { chatId: v.id("projectChats"), title: v.string() },
  handler: async (ctx, { chatId, title }) => {
    const chat = await ctx.db.get(chatId)
    if (!chat) throw new Error("Chat not found")
    await ctx.db.patch(chatId, { title, updatedAt: new Date().toISOString() })
  },
})

export const togglePin = mutation({
  args: { chatId: v.id("projectChats") },
  handler: async (ctx, { chatId }) => {
    const chat = await ctx.db.get(chatId)
    if (!chat) throw new Error("Chat not found")
    await ctx.db.patch(chatId, {
      pinned: !chat.pinned,
      updatedAt: new Date().toISOString(),
    })
  },
})

export const remove = mutation({
  args: { chatId: v.id("projectChats") },
  handler: async (ctx, { chatId }) => {
    // Delete messages
    const msgs = await ctx.db
      .query("projectChatMessages")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .collect()
    await Promise.all(msgs.map((m) => ctx.db.delete(m._id)))
    // Delete chat
    await ctx.db.delete(chatId)
  },
})

export const appendMessage = mutation({
  args: {
    chatId: v.id("projectChats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { chatId, role, content, userId }) => {
    const now = new Date().toISOString()
    await ctx.db.insert("projectChatMessages", {
      chatId,
      role,
      content,
      createdAt: now,
      userId,
    })
    await ctx.db.patch(chatId, { updatedAt: now })
  },
})
