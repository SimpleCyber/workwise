import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const schema = defineSchema({
  ...authTables,
  workspaces: defineTable({
    name: v.string(),
    userId: v.id("users"),
    joinCode: v.string(),
  }),
  members: defineTable({
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("lead")),
  })
    .index("by_user_id", ["userId"])
    .index("by_workspace_id", ["workspaceId"])
    .index("by_workspace_id_user_id", ["workspaceId", "userId"]),
  channels: defineTable({
    name: v.string(),
    workspaceId: v.id("workspaces"),
  }).index("by_workspace_id", ["workspaceId"]),
  conversations: defineTable({
    workspaceId: v.id("workspaces"),
    memberOneId: v.id("members"),
    memberTwoId: v.id("members"),
  }).index("by_workspace_id", ["workspaceId"]),
  messages: defineTable({
    body: v.string(),
    image: v.optional(v.id("_storage")),
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    channelId: v.optional(v.id("channels")),
    parentMessageId: v.optional(v.id("messages")),
    conversationId: v.optional(v.id("conversations")),
    updatedAt: v.optional(v.number()),
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_member_id", ["memberId"])
    .index("by_channel_id", ["channelId"])
    .index("by_conversation_id", ["conversationId"])
    .index("by_parent_message_id", ["parentMessageId"])
    .index("by_channel_id_parent_message_id_conversation_id", ["channelId", "parentMessageId", "conversationId"]),
  reactions: defineTable({
    workspaceId: v.id("workspaces"),
    messageId: v.id("messages"),
    memberId: v.id("members"),
    value: v.string(),
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_message_id", ["messageId"])
    .index("by_member_id", ["memberId"]),
  // Attendance table
  attendance: defineTable({
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    date: v.number(),
    checkInTime: v.number(),
    checkOutTime: v.optional(v.number()),
    workLocation: v.union(v.literal("office"), v.literal("home")),
    location: v.optional(v.string()),
    checkInNotes: v.optional(v.string()),
    tasks: v.optional(v.string()),
    taskImage: v.optional(v.id("_storage")),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("absent")),
    adminNotes: v.optional(v.string()),
    approvedBy: v.optional(v.id("members")),
    approvedAt: v.optional(v.number()),
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_member_id", ["memberId"])
    .index("by_member_id_date", ["memberId", "date"])
    .index("by_status", ["status"]),
  // Attendance comments table
  attendanceComments: defineTable({
    attendanceId: v.id("attendance"),
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    content: v.string(),
    image: v.optional(v.id("_storage")),
    createdAt: v.number(),
  })
    .index("by_attendance_id", ["attendanceId"])
    .index("by_workspace_id", ["workspaceId"])
    .index("by_member_id", ["memberId"]),
  // Leave requests table
  leaveRequests: defineTable({
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    startDate: v.number(),
    endDate: v.number(),
    reason: v.string(),
    leaveType: v.union(v.literal("sick"), v.literal("vacation"), v.literal("personal"), v.literal("other")),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    adminNotes: v.optional(v.string()),
    approvedBy: v.optional(v.id("members")),
    approvedAt: v.optional(v.number()),
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_member_id", ["memberId"])
    .index("by_status", ["status"]),
  // Todo/Kanban tables
  todoBoards: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    background: v.optional(v.string()),
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    isStarred: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_member_id", ["memberId"])
    .index("by_workspace_id", ["workspaceId"])
    .index("by_member_workspace", ["memberId", "workspaceId"])
    .index("by_workspace_archived", ["workspaceId", "isArchived"]),
  todoLists: defineTable({
    name: v.string(),
    boardId: v.id("todoBoards"),
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    position: v.number(),
    isArchived: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_board_id", ["boardId"])
    .index("by_member_id", ["memberId"])
    .index("by_workspace_id", ["workspaceId"])
    .index("by_board_archived", ["boardId", "isArchived"]),
  todoCards: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    listId: v.id("todoLists"),
    boardId: v.id("todoBoards"),
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    position: v.number(),
    dueDate: v.optional(v.number()),
    isCompleted: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
    labels: v.optional(v.array(v.string())),
    attachments: v.optional(v.array(v.id("_storage"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_list_id", ["listId"])
    .index("by_board_id", ["boardId"])
    .index("by_member_id", ["memberId"])
    .index("by_workspace_id", ["workspaceId"])
    .index("by_list_archived", ["listId", "isArchived"]),
  todoChecklists: defineTable({
    title: v.string(),
    cardId: v.id("todoCards"),
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    position: v.number(),
    createdAt: v.number(),
  })
    .index("by_card_id", ["cardId"])
    .index("by_member_id", ["memberId"]),
  todoChecklistItems: defineTable({
    text: v.string(),
    checklistId: v.id("todoChecklists"),
    cardId: v.id("todoCards"),
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    isCompleted: v.boolean(),
    position: v.number(),
    createdAt: v.number(),
  })
    .index("by_checklist_id", ["checklistId"])
    .index("by_card_id", ["cardId"])
    .index("by_member_id", ["memberId"]),
  todoComments: defineTable({
    content: v.string(),
    cardId: v.id("todoCards"),
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_card_id", ["cardId"])
    .index("by_member_id", ["memberId"]),

  // Project Management tables
  projectBoards: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    background: v.optional(v.string()),
    boardCode: v.string(), // B01, B02, etc.
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    isStarred: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_member_id", ["memberId"])
    .index("by_workspace_id", ["workspaceId"])
    .index("by_member_workspace", ["memberId", "workspaceId"])
    .index("by_workspace_archived", ["workspaceId", "isArchived"]),

  projectLists: defineTable({
    name: v.string(),
    boardId: v.id("projectBoards"),
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    position: v.number(),
    isArchived: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_board_id", ["boardId"])
    .index("by_member_id", ["memberId"])
    .index("by_workspace_id", ["workspaceId"])
    .index("by_board_archived", ["boardId", "isArchived"]),

  projectTasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    taskCode: v.string(), // B01-1, B01-2, etc.
    listId: v.id("projectLists"),
    boardId: v.id("projectBoards"),
    createdById: v.id("members"),
    assignedToId: v.id("members"),
    assignedById: v.id("members"),
    workspaceId: v.id("workspaces"),
    position: v.number(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    dueDate: v.optional(v.number()),
    isCompleted: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
    labels: v.optional(v.array(v.string())),
    attachments: v.optional(v.array(v.id("_storage"))),
    createdAt: v.number(),
    updatedAt: v.number(),
    assignedAt: v.number(),
  })
    .index("by_list_id", ["listId"])
    .index("by_board_id", ["boardId"])
    .index("by_created_by", ["createdById"])
    .index("by_assigned_to", ["assignedToId"])
    .index("by_assigned_by", ["assignedById"])
    .index("by_workspace_id", ["workspaceId"])
    .index("by_list_archived", ["listId", "isArchived"]),
})

export default schema
