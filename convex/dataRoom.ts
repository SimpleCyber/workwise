import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Upload data room file
export const uploadDataRoomFile = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    comment: v.string(),
    visibility: v.union(v.literal("public"), v.literal("private")),
    allowedMembers: v.array(v.id("members")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    // Check if user is a member of the workspace
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId),
      )
      .unique();

    if (!member) {
      throw new Error("Not a member of this workspace");
    }

    const fileId = await ctx.db.insert("dataRoomFiles", {
      workspaceId: args.workspaceId,
      uploaderId: member._id,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      comment: args.comment,
      visibility: args.visibility,
      allowedMembers: args.allowedMembers,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Get user and workspace info for notifications
    const user = await ctx.db.get(userId);
    const workspace = await ctx.db.get(args.workspaceId);

    // If it's a public document, notify all workspace members
    if (args.visibility === "public") {
      const allMembers = await ctx.db
        .query("members")
        .withIndex("by_workspace_id", (q) =>
          q.eq("workspaceId", args.workspaceId),
        )
        .filter((q) => q.neq(q.field("_id"), member._id)) // Exclude the uploader
        .collect();

      await Promise.all(
        allMembers.map(async (workspaceMember) => {
          await ctx.db.insert("notifications", {
            userId: workspaceMember.userId,
            workspaceId: args.workspaceId,
            type: "document_uploaded",
            title: "New Public Document",
            message: `${user?.name || "A user"} uploaded a new public document "${args.fileName}" in ${workspace?.name || "workspace"}.`,
            relatedId: fileId,
            actionBy: userId,
            isRead: false,
            createdAt: Date.now(),
            sendedmail: false,
          });
        }),
      );
    } else {
      // If it's a private document, notify only allowed members
      await Promise.all(
        args.allowedMembers.map(async (allowedMemberId) => {
          const allowedMember = await ctx.db.get(allowedMemberId);
          if (allowedMember && allowedMember._id !== member._id) {
            // Don't notify the uploader
            await ctx.db.insert("notifications", {
              userId: allowedMember.userId,
              workspaceId: args.workspaceId,
              type: "document_shared",
              title: "Document Shared With You",
              message: `${user?.name || "A user"} shared a private document "${args.fileName}" with you in ${workspace?.name || "workspace"}.`,
              relatedId: fileId,
              actionBy: userId,
              isRead: false,
              createdAt: Date.now(),
              sendedmail: false,
            });
          }
        }),
      );
    }

    return fileId;
  },
});

// Get data room files with search and pagination
export const getDataRoomFiles = query({
  args: {
    workspaceId: v.id("workspaces"),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    dateFilter: v.optional(v.string()),
    userFilter: v.optional(v.string()),
    fileTypeFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { files: [], total: 0 };
    }

    // Check if user is a member of the workspace
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId),
      )
      .unique();

    if (!member) {
      return { files: [], total: 0 };
    }

    const page = args.page || 1;
    const limit = args.limit || 12;
    const offset = (page - 1) * limit;

    // Get all files for the workspace
    let files = await ctx.db
      .query("dataRoomFiles")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .collect();

    // Filter files based on visibility and permissions
    files = files.filter((file) => {
      if (file.visibility === "public") return true;
      if (file.uploaderId === member._id) return true;
      return file.allowedMembers.includes(member._id);
    });

    // Apply search filter
    if (args.search && args.search.trim()) {
      const searchLower = args.search.toLowerCase();
      files = files.filter(
        (file) =>
          file.fileName.toLowerCase().includes(searchLower) ||
          file.comment.toLowerCase().includes(searchLower),
      );
    }

    // Apply date filter
    if (args.dateFilter && args.dateFilter.trim()) {
      const filterDate = new Date(args.dateFilter);
      if (!isNaN(filterDate.getTime())) {
        const startOfDay = new Date(filterDate.setHours(0, 0, 0, 0)).getTime();
        const endOfDay = new Date(
          filterDate.setHours(23, 59, 59, 999),
        ).getTime();
        files = files.filter(
          (file) => file.createdAt >= startOfDay && file.createdAt <= endOfDay,
        );
      }
    }

    // Apply user filter
    if (args.userFilter && args.userFilter.trim()) {
      files = files.filter((file) => file.uploaderId === args.userFilter);
    }

    // Apply file type filter
    if (args.fileTypeFilter && args.fileTypeFilter.trim()) {
      files = files.filter((file) => {
        switch (args.fileTypeFilter) {
          case "pdf":
            return file.fileType === "application/pdf";
          case "image":
            return file.fileType.startsWith("image/");
          case "document":
            return (
              file.fileType.includes("document") ||
              file.fileType.includes("word")
            );
          case "spreadsheet":
            return (
              file.fileType.includes("spreadsheet") ||
              file.fileType.includes("excel")
            );
          default:
            return true;
        }
      });
    }

    // Sort by creation date (newest first)
    files.sort((a, b) => b.createdAt - a.createdAt);

    const total = files.length;
    const paginatedFiles = files.slice(offset, offset + limit);

    // Get file details with uploader info and file URLs
    const filesWithDetails = await Promise.all(
      paginatedFiles.map(async (file) => {
        const uploader = await ctx.db.get(file.uploaderId);
        const uploaderUser = uploader
          ? await ctx.db.get(uploader.userId)
          : null;
        const fileUrl = await ctx.storage.getUrl(file.storageId);
        return {
          ...file,
          uploader: uploader ? { ...uploader, user: uploaderUser } : null,
          fileUrl,
        };
      }),
    );

    return {
      files: filesWithDetails,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },
});

// Delete data room file
export const deleteDataRoomFile = mutation({
  args: { fileId: v.id("dataRoomFiles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }

    const member = await ctx.db.get(file.uploaderId);
    if (!member || member.userId !== userId) {
      throw new Error("You can only delete your own files");
    }

    await ctx.db.delete(args.fileId);
    return args.fileId;
  },
});

// Update file permissions
export const updateFilePermissions = mutation({
  args: {
    fileId: v.id("dataRoomFiles"),
    visibility: v.union(v.literal("public"), v.literal("private")),
    allowedMembers: v.array(v.id("members")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }

    const member = await ctx.db.get(file.uploaderId);
    if (!member || member.userId !== userId) {
      throw new Error("You can only update permissions for your own files");
    }

    await ctx.db.patch(args.fileId, {
      visibility: args.visibility,
      allowedMembers: args.allowedMembers,
      updatedAt: Date.now(),
    });

    return args.fileId;
  },
});
