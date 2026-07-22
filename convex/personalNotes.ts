import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getLists = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const lists = await ctx.db
      .query("personalTaskLists")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    const allNotes = await ctx.db
      .query("personalNotes")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    const listsWithCount = lists.map((list) => {
      const activeCount = allNotes.filter(
        (n) => n.listId === list._id && !n.isCompleted,
      ).length;
      return {
        ...list,
        activeCount,
      };
    });

    return listsWithCount.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const createList = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("personalTaskLists", {
      userId,
      name: args.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const renameList = mutation({
  args: {
    id: v.id("personalTaskLists"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const list = await ctx.db.get(args.id);
    if (!list || list.userId !== userId) {
      throw new Error("Not found or unauthorized");
    }

    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      updatedAt: Date.now(),
    });
  },
});

export const deleteList = mutation({
  args: {
    id: v.id("personalTaskLists"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const list = await ctx.db.get(args.id);
    if (!list || list.userId !== userId) {
      throw new Error("Not found or unauthorized");
    }

    await ctx.db.delete(args.id);

    const notesInList = await ctx.db
      .query("personalNotes")
      .withIndex("by_list_id", (q) => q.eq("listId", args.id))
      .collect();

    for (const note of notesInList) {
      if (note.userId === userId) {
        await ctx.db.delete(note._id);
      }
    }
  },
});

export const get = query({
  args: {
    listId: v.optional(v.id("personalTaskLists")),
    isStarred: v.optional(v.boolean()),
    showCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    let notesQuery = ctx.db
      .query("personalNotes")
      .withIndex("by_user_id", (q) => q.eq("userId", userId));

    const notes = await notesQuery.collect();

    let filteredNotes = notes.sort((a, b) => b.createdAt - a.createdAt);

    if (args.listId) {
      filteredNotes = filteredNotes.filter((n) => n.listId === args.listId);
    } else if (args.isStarred) {
      filteredNotes = filteredNotes.filter((n) => n.isStarred);
    }

    if (args.showCompleted !== undefined) {
      filteredNotes = filteredNotes.filter(
        (n) => !!n.isCompleted === args.showCompleted,
      );
    }

    return filteredNotes;
  },
});

export const create = mutation({
  args: {
    listId: v.optional(v.id("personalTaskLists")),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    hasTime: v.optional(v.boolean()),
    isStarred: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const noteId = await ctx.db.insert("personalNotes", {
      userId,
      listId: args.listId,
      title: args.title,
      content: args.content,
      dueDate: args.dueDate,
      hasTime: args.hasTime,
      isStarred: args.isStarred || false,
      isTask: true,
      isCompleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return noteId;
  },
});

export const update = mutation({
  args: {
    id: v.id("personalNotes"),
    listId: v.optional(v.id("personalTaskLists")),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    dueDate: v.optional(v.union(v.number(), v.null())),
    hasTime: v.optional(v.boolean()),
    isCompleted: v.optional(v.boolean()),
    isStarred: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const note = await ctx.db.get(args.id);
    if (!note || note.userId !== userId) {
      throw new Error("Not found or unauthorized");
    }

    await ctx.db.patch(args.id, {
      listId: args.listId !== undefined ? args.listId : note.listId,
      title: args.title !== undefined ? args.title : note.title,
      content: args.content !== undefined ? args.content : note.content,
      dueDate:
        args.dueDate !== undefined
          ? args.dueDate === null
            ? undefined
            : args.dueDate
          : note.dueDate,
      hasTime: args.hasTime !== undefined ? args.hasTime : note.hasTime,
      isCompleted:
        args.isCompleted !== undefined ? args.isCompleted : note.isCompleted,
      isStarred: args.isStarred !== undefined ? args.isStarred : note.isStarred,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("personalNotes"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const note = await ctx.db.get(args.id);
    if (!note || note.userId !== userId) {
      throw new Error("Not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});
