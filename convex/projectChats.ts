import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listForBoard = query({
  args: { boardId: v.id("projectBoards") },
  handler: async (ctx, { boardId }) => {
    const chats = await ctx.db
      .query("projectChats")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .order("desc")
      .collect();

    const enriched = await Promise.all(
      chats.map(async (c) => {
        const msgs = await ctx.db
          .query("projectChatMessages")
          .withIndex("by_chat", (q) => q.eq("chatId", c._id))
          .order("desc")
          .take(1);
        const last = msgs[0];

        const allForCount = await ctx.db
          .query("projectChatMessages")
          .withIndex("by_chat", (q) => q.eq("chatId", c._id))
          .collect();
        const messageCount = allForCount.length;

        return {
          ...c,
          id: c._id,
          preview: last?.content ?? "Ask anything…",
          messageCount,
        };
      }),
    );

    return enriched;
  },
});

export const getMessages = query({
  args: { chatId: v.id("projectChats"), limit: v.optional(v.number()) },
  handler: async (ctx, { chatId, limit = 200 }) => {
    const msgs = await ctx.db
      .query("projectChatMessages")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .order("asc")
      .take(limit);
    return msgs.map((m) => ({ ...m, id: m._id }));
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    boardId: v.id("projectBoards"),
    title: v.string(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, { workspaceId, boardId, title, createdBy }) => {
    const now = new Date().toISOString();
    const chatId = await ctx.db.insert("projectChats", {
      workspaceId,
      boardId,
      title: title || "New chat",
      pinned: false,
      createdBy,
      createdAt: now,
      updatedAt: now,
    });
    return chatId;
  },
});

export const rename = mutation({
  args: { chatId: v.id("projectChats"), title: v.string() },
  handler: async (ctx, { chatId, title }) => {
    const chat = await ctx.db.get(chatId);
    if (!chat) throw new Error("Chat not found");
    await ctx.db.patch(chatId, { title, updatedAt: new Date().toISOString() });
  },
});

export const togglePin = mutation({
  args: { chatId: v.id("projectChats") },
  handler: async (ctx, { chatId }) => {
    const chat = await ctx.db.get(chatId);
    if (!chat) throw new Error("Chat not found");
    await ctx.db.patch(chatId, {
      pinned: !chat.pinned,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const remove = mutation({
  args: { chatId: v.id("projectChats") },
  handler: async (ctx, { chatId }) => {
    // Delete messages
    const msgs = await ctx.db
      .query("projectChatMessages")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .collect();
    await Promise.all(msgs.map((m) => ctx.db.delete(m._id)));
    // Delete chat
    await ctx.db.delete(chatId);
  },
});

export const appendMessage = mutation({
  args: {
    chatId: v.id("projectChats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { chatId, role, content, userId }) => {
    const now = new Date().toISOString();
    await ctx.db.insert("projectChatMessages", {
      chatId,
      role,
      content,
      createdAt: now,
      userId,
    });
    await ctx.db.patch(chatId, { updatedAt: now });
  },
});

export const deleteFromMessage = mutation({
  args: {
    chatId: v.id("projectChats"),
    fromMessageId: v.id("projectChatMessages"),
  },
  handler: async (ctx, { chatId, fromMessageId }) => {
    const fromMsg = await ctx.db.get(fromMessageId);
    if (!fromMsg) throw new Error("Message not found");
    if (fromMsg.chatId !== chatId)
      throw new Error("Message does not belong to chat");

    // delete all messages with createdAt >= fromMsg.createdAt
    const toDelete = await ctx.db
      .query("projectChatMessages")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .order("asc")
      .collect();

    const boundary = fromMsg.createdAt;
    const del = toDelete.filter((m) => m.createdAt >= boundary);
    await Promise.all(del.map((m) => ctx.db.delete(m._id)));

    await ctx.db.patch(chatId, { updatedAt: new Date().toISOString() });
  },
});

export const listHooks = query({
  args: { chatId: v.id("projectChats") },
  handler: async (ctx, { chatId }) => {
    const hooks = await ctx.db
      .query("projectChatHooks")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .order("asc")
      .collect();
    return hooks.map((h) => ({ ...h, id: h._id }));
  },
});

export const toggleHook = mutation({
  args: {
    chatId: v.id("projectChats"),
    messageId: v.id("projectChatMessages"),
    content: v.string(),
  },
  handler: async (ctx, { chatId, messageId, content }) => {
    const existing = await ctx.db
      .query("projectChatHooks")
      .withIndex("by_chat_message", (q) =>
        q.eq("chatId", chatId).eq("messageId", messageId),
      )
      .unique()
      .catch(() => null as any);

    const now = new Date().toISOString();
    if (!existing) {
      await ctx.db.insert("projectChatHooks", {
        chatId,
        messageId,
        content,
        selected: true,
        createdAt: now,
      });
    } else {
      await ctx.db.patch(existing._id, { selected: !existing.selected });
    }
    await ctx.db.patch(chatId, { updatedAt: now });
  },
});

export const setHookSelected = mutation({
  args: { hookId: v.id("projectChatHooks"), selected: v.boolean() },
  handler: async (ctx, { hookId, selected }) => {
    await ctx.db.patch(hookId, { selected });
  },
});
