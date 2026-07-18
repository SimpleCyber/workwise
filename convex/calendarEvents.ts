import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Create a new calendar event
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()),
    meetLink: v.optional(v.string()),
    attendees: v.optional(v.array(v.string())),
    workspaceId: v.id("workspaces"),
    googleEventId: v.optional(v.string()),
    googleAccountEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId),
      )
      .unique();

    if (!member) {
      throw new Error("Not a member of this workspace");
    }

    const now = Date.now();
    const eventId = await ctx.db.insert("calendarEvents", {
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      location: args.location,
      meetLink: args.meetLink,
      attendees: args.attendees,
      userId: userId,
      workspaceId: args.workspaceId,
      googleEventId: args.googleEventId,
      googleAccountEmail: args.googleAccountEmail,
      isGoogleSynced: !!args.googleEventId,
      createdAt: now,
      updatedAt: now,
    });

    return eventId;
  },
});

// Get all events for a user in a workspace
export const getEventsByWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
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

    const events = await ctx.db
      .query("calendarEvents")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", userId).eq("workspaceId", args.workspaceId),
      )
      .collect();

    return events;
  },
});

// Get events for a specific date range
export const getEventsByDateRange = query({
  args: {
    workspaceId: v.id("workspaces"),
    startTime: v.number(),
    endTime: v.number(),
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

    const events = await ctx.db
      .query("calendarEvents")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", userId).eq("workspaceId", args.workspaceId),
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("startTime"), args.startTime),
          q.lte(q.field("startTime"), args.endTime),
        ),
      )
      .collect();

    return events;
  },
});

// Update an existing event
export const updateEvent = mutation({
  args: {
    eventId: v.id("calendarEvents"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    location: v.optional(v.string()),
    meetLink: v.optional(v.string()),
    attendees: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.startTime !== undefined) updates.startTime = args.startTime;
    if (args.endTime !== undefined) updates.endTime = args.endTime;
    if (args.location !== undefined) updates.location = args.location;
    if (args.meetLink !== undefined) updates.meetLink = args.meetLink;
    if (args.attendees !== undefined) updates.attendees = args.attendees;

    await ctx.db.patch(args.eventId, updates);
    return args.eventId;
  },
});

// Delete an event
export const deleteEvent = mutation({
  args: {
    eventId: v.id("calendarEvents"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.eventId);
    return { success: true };
  },
});

// Upsert a Google Calendar event (used during sync)
export const upsertGoogleEvent = internalMutation({
  args: {
    googleEventId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()),
    meetLink: v.optional(v.string()),
    attendees: v.optional(v.array(v.string())),
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    googleAccountEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if this Google event already exists in our DB
    const existing = await ctx.db
      .query("calendarEvents")
      .withIndex("by_google_event_id", (q) =>
        q.eq("googleEventId", args.googleEventId),
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing event with latest data from Google
      await ctx.db.patch(existing._id, {
        title: args.title,
        description: args.description,
        startTime: args.startTime,
        endTime: args.endTime,
        location: args.location,
        meetLink: args.meetLink,
        attendees: args.attendees,
        isGoogleSynced: true,
        googleAccountEmail: args.googleAccountEmail,
        updatedAt: now,
      });
      return { created: false, eventId: existing._id };
    } else {
      // Insert new event
      const eventId = await ctx.db.insert("calendarEvents", {
        title: args.title,
        description: args.description,
        startTime: args.startTime,
        endTime: args.endTime,
        location: args.location,
        meetLink: args.meetLink,
        attendees: args.attendees,
        userId: args.userId,
        workspaceId: args.workspaceId,
        googleEventId: args.googleEventId,
        googleAccountEmail: args.googleAccountEmail,
        isGoogleSynced: true,
        createdAt: now,
        updatedAt: now,
      });
      return { created: true, eventId };
    }
  },
});
