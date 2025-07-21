import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Real-time comprehensive search with highlighting support
export const realtimeSearch = query({
  args: {
    workspaceId: v.id("workspaces"),
    query: v.string(),
    filters: v.object({
      types: v.array(v.string()), // ["chat", "projects", "todo", "members", "dataroom"]
      dateRange: v.optional(
        v.object({
          start: v.number(),
          end: v.number(),
        }),
      ),
      sortBy: v.optional(v.string()),
    }),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { results: [], total: 0 };
    }

    // Check if user is a member of the workspace
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId),
      )
      .unique();

    if (!member) {
      return { results: [], total: 0 };
    }

    const searchQuery = args.query.toLowerCase().trim();
    const limit = args.limit || 100;
    const results: any[] = [];

    // If no query, return empty results
    if (!searchQuery) {
      return { results: [], total: 0 };
    }

    // Get selected types or default to all
    const searchTypes =
      args.filters.types.length > 0
        ? args.filters.types
        : ["chat", "projects", "todo", "members", "dataroom"];

    // Helper function to create match highlights
    const createHighlights = (text: string, query: string) => {
      if (!text || !query) return { text, highlights: [] };

      const lowerText = text.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const highlights: { start: number; end: number }[] = [];

      let index = 0;
      while (index < lowerText.length) {
        const foundIndex = lowerText.indexOf(lowerQuery, index);
        if (foundIndex === -1) break;

        highlights.push({
          start: foundIndex,
          end: foundIndex + lowerQuery.length,
        });
        index = foundIndex + lowerQuery.length;
      }

      return { text, highlights };
    };

    // Search Messages (Chat)
    if (searchTypes.includes("chat")) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_workspace_id", (q) =>
          q.eq("workspaceId", args.workspaceId),
        )
        .collect();

      for (const message of messages) {
        const bodyMatch = message.body.toLowerCase().includes(searchQuery);

        if (bodyMatch) {
          // Apply date filter
          if (args.filters.dateRange) {
            const messageDate = message._creationTime;
            if (
              messageDate < args.filters.dateRange.start ||
              messageDate > args.filters.dateRange.end
            ) {
              continue;
            }
          }

          const messageMember = await ctx.db.get(message.memberId);
          const messageUser = messageMember
            ? await ctx.db.get(messageMember.userId)
            : null;

          // Get channel or conversation info
          let contextInfo: {
            type: string;
            name: string;
            id: Id<"channels"> | null;
          } = {
            type: "conversation",
            name: "Direct Message",
            id: null,
          };
          if (message.channelId) {
            const channel = await ctx.db.get(message.channelId);
            contextInfo = {
              type: "channel",
              name: channel?.name || "Unknown Channel",
              id: message.channelId,
            };
          }

          const titleHighlights = createHighlights(
            `Message in ${contextInfo.name}`,
            searchQuery,
          );
          const contentHighlights = createHighlights(message.body, searchQuery);

          results.push({
            id: message._id,
            type: "chat",
            title: `Message in ${contextInfo.name}`,
            titleHighlights,
            content: message.body,
            contentHighlights,
            author: messageUser?.name || "Unknown User",
            authorImage: messageUser?.image,
            date: message._creationTime,
            url: message.channelId
              ? `/workspace/${args.workspaceId}/channel/${message.channelId}`
              : `/workspace/${args.workspaceId}/member/${message.memberId}`,
            metadata: {
              channelId: message.channelId,
              conversationId: message.conversationId,
              hasImage: !!message.image,
              contextType: contextInfo.type,
            },
            relevanceScore: bodyMatch ? 10 : 0,
          });
        }
      }
    }

    // Search Project Tasks
    if (searchTypes.includes("projects")) {
      const tasks = await ctx.db
        .query("projectTasks")
        .withIndex("by_workspace_id", (q) =>
          q.eq("workspaceId", args.workspaceId),
        )
        .collect();

      for (const task of tasks) {
        const titleMatch = task.title.toLowerCase().includes(searchQuery);
        const descriptionMatch = task.description
          ?.toLowerCase()
          .includes(searchQuery);
        const taskCodeMatch = task.taskCode.toLowerCase().includes(searchQuery);

        if (titleMatch || descriptionMatch || taskCodeMatch) {
          // Apply date filter
          if (args.filters.dateRange) {
            if (
              task.createdAt < args.filters.dateRange.start ||
              task.createdAt > args.filters.dateRange.end
            ) {
              continue;
            }
          }

          const assignedTo = task.assignedToId
            ? await ctx.db.get(task.assignedToId)
            : null;
          const assignedUser = assignedTo
            ? await ctx.db.get(assignedTo.userId)
            : null;
          const board = await ctx.db.get(task.boardId);

          const titleText = `${task.taskCode}: ${task.title}`;
          const titleHighlights = createHighlights(titleText, searchQuery);
          const contentHighlights = createHighlights(
            task.description || "No description",
            searchQuery,
          );

          let relevanceScore = 0;
          if (taskCodeMatch) relevanceScore += 15;
          if (titleMatch) relevanceScore += 10;
          if (descriptionMatch) relevanceScore += 5;

          results.push({
            id: task._id,
            type: "projects",
            title: titleText,
            titleHighlights,
            content: task.description || "No description",
            contentHighlights,
            author: assignedUser?.name || "Unassigned",
            authorImage: assignedUser?.image,
            date: task.createdAt,
            url: `/projects/${args.workspaceId}/board/${task.boardId}`,
            metadata: {
              taskCode: task.taskCode,
              priority: task.priority,
              boardName: board?.name,
              isCompleted: task.isCompleted,
            },
            relevanceScore,
          });
        }
      }
    }

    // Search Todo Cards
    if (searchTypes.includes("todo")) {
      const cards = await ctx.db
        .query("todoCards")
        .withIndex("by_workspace_id", (q) =>
          q.eq("workspaceId", args.workspaceId),
        )
        .collect();

      for (const card of cards) {
        const titleMatch = card.title.toLowerCase().includes(searchQuery);
        const descriptionMatch = card.description
          ?.toLowerCase()
          .includes(searchQuery);

        if (titleMatch || descriptionMatch) {
          // Apply date filter
          if (args.filters.dateRange) {
            if (
              card.createdAt < args.filters.dateRange.start ||
              card.createdAt > args.filters.dateRange.end
            ) {
              continue;
            }
          }

          const cardMember = await ctx.db.get(card.memberId);
          const cardUser = cardMember
            ? await ctx.db.get(cardMember.userId)
            : null;
          const board = await ctx.db.get(card.boardId);

          const titleHighlights = createHighlights(card.title, searchQuery);
          const contentHighlights = createHighlights(
            card.description || "No description",
            searchQuery,
          );

          let relevanceScore = 0;
          if (titleMatch) relevanceScore += 10;
          if (descriptionMatch) relevanceScore += 5;

          results.push({
            id: card._id,
            type: "todo",
            title: card.title,
            titleHighlights,
            content: card.description || "No description",
            contentHighlights,
            author: cardUser?.name || "Unknown User",
            authorImage: cardUser?.image,
            date: card.createdAt,
            url: `/todo/${args.workspaceId}/board/${card.boardId}`,
            metadata: {
              boardName: board?.name,
              isCompleted: card.isCompleted,
              dueDate: card.dueDate,
              labels: card.labels,
            },
            relevanceScore,
          });
        }
      }
    }

    // Search Members
    if (searchTypes.includes("members")) {
      const members = await ctx.db
        .query("members")
        .withIndex("by_workspace_id", (q) =>
          q.eq("workspaceId", args.workspaceId),
        )
        .collect();

      for (const memberRecord of members) {
        const user = await ctx.db.get(memberRecord.userId);
        const nameMatch = user?.name?.toLowerCase().includes(searchQuery);
        const emailMatch = user?.email?.toLowerCase().includes(searchQuery);
        const roleMatch = memberRecord.role.toLowerCase().includes(searchQuery);

        if (nameMatch || emailMatch || roleMatch) {
          const titleText = user?.name || "Unknown User";
          const contentText = `Role: ${memberRecord.role}${user?.email ? ` • ${user.email}` : ""}`;

          const titleHighlights = createHighlights(titleText, searchQuery);
          const contentHighlights = createHighlights(contentText, searchQuery);

          let relevanceScore = 0;
          if (nameMatch) relevanceScore += 15;
          if (emailMatch) relevanceScore += 10;
          if (roleMatch) relevanceScore += 5;

          results.push({
            id: memberRecord._id,
            type: "members",
            title: titleText,
            titleHighlights,
            content: contentText,
            contentHighlights,
            author: user?.name || "Unknown User",
            authorImage: user?.image,
            date: memberRecord._creationTime,
            url: `/workspace/${args.workspaceId}/member/${memberRecord._id}`,
            metadata: {
              role: memberRecord.role,
              email: user?.email,
            },
            relevanceScore,
          });
        }
      }
    }

    // Search Data Room Files
    if (searchTypes.includes("dataroom")) {
      const files = await ctx.db
        .query("dataRoomFiles")
        .withIndex("by_workspace_id", (q) =>
          q.eq("workspaceId", args.workspaceId),
        )
        .collect();

      for (const file of files) {
        const fileNameMatch = file.fileName.toLowerCase().includes(searchQuery);
        const commentMatch = file.comment.toLowerCase().includes(searchQuery);

        if (fileNameMatch || commentMatch) {
          // Check file permissions
          if (
            file.visibility === "private" &&
            file.uploaderId !== member._id &&
            !file.allowedMembers.includes(member._id)
          ) {
            continue;
          }

          // Apply date filter
          if (args.filters.dateRange) {
            if (
              file.createdAt < args.filters.dateRange.start ||
              file.createdAt > args.filters.dateRange.end
            ) {
              continue;
            }
          }

          const uploader = await ctx.db.get(file.uploaderId);
          const uploaderUser = uploader
            ? await ctx.db.get(uploader.userId)
            : null;

          const titleHighlights = createHighlights(file.fileName, searchQuery);
          const contentHighlights = createHighlights(file.comment, searchQuery);

          let relevanceScore = 0;
          if (fileNameMatch) relevanceScore += 10;
          if (commentMatch) relevanceScore += 5;

          results.push({
            id: file._id,
            type: "dataroom",
            title: file.fileName,
            titleHighlights,
            content: file.comment,
            contentHighlights,
            author: uploaderUser?.name || "Unknown User",
            authorImage: uploaderUser?.image,
            date: file.createdAt,
            url: `/workspace/${args.workspaceId}/data-room`,
            metadata: {
              fileType: file.fileType,
              fileSize: file.fileSize,
              visibility: file.visibility,
            },
            relevanceScore,
          });
        }
      }
    }

    // Sort results
    const sortBy = args.filters.sortBy || "relevance";
    results.sort((a, b) => {
      switch (sortBy) {
        case "date_asc":
          return a.date - b.date;
        case "date_desc":
          return b.date - a.date;
        case "name_asc":
          return a.title.localeCompare(b.title);
        case "name_desc":
          return b.title.localeCompare(a.title);
        case "relevance":
        default:
          if (a.relevanceScore !== b.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
          }
          return b.date - a.date;
      }
    });

    return {
      results: results.slice(0, limit),
      total: results.length,
    };
  },
});

// Add this export at the end of the file for backward compatibility
export const globalSearch = realtimeSearch;
