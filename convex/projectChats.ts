import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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

        const messageCount = c.messageCount || 0;

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

export const listForWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", workspaceId).eq("userId", userId),
      )
      .unique();

    if (!member) return [];

    const chats = await ctx.db
      .query("projectChats")
      .filter((q) => q.eq(q.field("workspaceId"), workspaceId))
      .collect();

    return Promise.all(
      chats.map(async (c) => {
        const msgs = await ctx.db
          .query("projectChatMessages")
          .withIndex("by_chat", (q) => q.eq("chatId", c._id))
          .order("desc")
          .take(1);
        const last = msgs[0];

        return {
          ...c,
          id: c._id,
          preview: last?.content ?? "Ask anything…",
        };
      }),
    );
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
    const now = Date.now();
    const chatId = await ctx.db.insert("projectChats", {
      workspaceId,
      boardId,
      title: title || "New chat",
      pinned: false,
      createdBy,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    });
    return chatId;
  },
});

export const rename = mutation({
  args: { chatId: v.id("projectChats"), title: v.string() },
  handler: async (ctx, { chatId, title }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const chat = await ctx.db.get(chatId);
    if (!chat) throw new Error("Chat not found");
    await ctx.db.patch(chatId, { title, updatedAt: Date.now() });
  },
});

export const togglePin = mutation({
  args: { chatId: v.id("projectChats") },
  handler: async (ctx, { chatId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const chat = await ctx.db.get(chatId);
    if (!chat) throw new Error("Chat not found");
    await ctx.db.patch(chatId, {
      pinned: !chat.pinned,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { chatId: v.id("projectChats") },
  handler: async (ctx, { chatId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
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
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Unauthorized");
    const now = Date.now();
    await ctx.db.insert("projectChatMessages", {
      chatId,
      role,
      content,
      createdAt: now,
      userId,
    });
    const chat = await ctx.db.get(chatId);
    await ctx.db.patch(chatId, {
      updatedAt: now,
      messageCount: (chat?.messageCount || 0) + 1,
    });
  },
});

export const deleteFromMessage = mutation({
  args: {
    chatId: v.id("projectChats"),
    fromMessageId: v.id("projectChatMessages"),
  },
  handler: async (ctx, { chatId, fromMessageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
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

    const chat = await ctx.db.get(chatId);
    await ctx.db.patch(chatId, {
      updatedAt: Date.now(),
      messageCount: Math.max(0, (chat?.messageCount || 0) - del.length),
    });
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const existing = await ctx.db
      .query("projectChatHooks")
      .withIndex("by_chat_message", (q) =>
        q.eq("chatId", chatId).eq("messageId", messageId),
      )
      .unique()
      .catch(() => null as any);

    const now = Date.now();
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await ctx.db.patch(hookId, { selected });
  },
});
