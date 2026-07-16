import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

// Get tree data for a user - hierarchical view with lists and tasks
export const getTreeData = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Get current user
    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Get current member to check permissions
    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!currentMember) return null;

    // Get all workspaces where user is a member
    const memberWorkspaces = await ctx.db
      .query("members")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    const workspaces = [];
    for (const memberWorkspace of memberWorkspaces) {
      const workspace = await ctx.db.get(memberWorkspace.workspaceId);
      if (workspace) {
        // Get projects in this workspace
        const projects = await ctx.db
          .query("projectBoards")
          .withIndex("by_workspace_id", (q) =>
            q.eq("workspaceId", workspace._id),
          )
          .filter((q) => q.eq(q.field("isArchived"), false))
          .collect();

        const projectsWithDetails = [];
        for (const project of projects) {
          let listsWithTasks: any[] = [];

          if (project.projectType === "sales") {
            const leads = await ctx.db
              .query("salesLeads")
              .withIndex("by_board_id", (q) => q.eq("boardId", project._id))
              .filter((q) => q.eq(q.field("isDiscarded"), false))
              .collect();

            const unassignedLeads = leads.filter(l => l.assignmentStatus === "unassigned");
            const rejectedLeads = leads.filter(l => l.stage === "rejected" || l.stage === "lost");
            const wonLeads = leads.filter(l => l.stage === "won");
            const inProgressLeads = leads.filter(l => l.assignmentStatus === "assigned" && l.stage !== "rejected" && l.stage !== "lost" && l.stage !== "won");
            
            // "Remaining" could be considered unassigned + those needing contact/retry
            const remainingLeads = leads.filter(l => l.assignmentStatus === "unassigned" || !l.stage || l.stage === "retry");

            listsWithTasks = [
              {
                _id: `${project._id}-remaining`,
                name: "Remaining",
                boardId: project._id,
                tasks: [],
                taskCount: remainingLeads.length,
                position: 0,
              },
              {
                _id: `${project._id}-inprogress`,
                name: "In Progress",
                boardId: project._id,
                tasks: [],
                taskCount: inProgressLeads.length,
                position: 1,
              },
              {
                _id: `${project._id}-unassigned`,
                name: "Unassigned",
                boardId: project._id,
                tasks: [],
                taskCount: unassignedLeads.length,
                position: 2,
              },
              {
                _id: `${project._id}-rejected`,
                name: "Rejected",
                boardId: project._id,
                tasks: [],
                taskCount: rejectedLeads.length,
                position: 3,
              }
            ];
          } else {
            // Get all lists in this project
            const lists = await ctx.db
              .query("projectLists")
              .withIndex("by_board_id", (q) => q.eq("boardId", project._id))
              .filter((q) => q.eq(q.field("isArchived"), false))
              .collect();

            for (const list of lists) {
              // Get all tasks in this list
              const tasks = await ctx.db
                .query("projectTasks")
                .withIndex("by_list_id", (q) => q.eq("listId", list._id))
                .filter((q) => q.eq(q.field("isArchived"), false))
                .collect();

              const tasksWithDetails = [];
              for (const task of tasks) {
                // Get task assignee details
                const assignedTo = task.assignedToId
                  ? await ctx.db.get(task.assignedToId)
                  : null;
                const assignedBy = task.assignedById
                  ? await ctx.db.get(task.assignedById)
                  : null;
                const createdBy = await ctx.db.get(task.createdById);

                // Get user details
                const assignedToUser = assignedTo
                  ? await ctx.db.get(assignedTo.userId)
                  : null;
                const assignedByUser = assignedBy
                  ? await ctx.db.get(assignedBy.userId)
                  : null;
                const createdByUser = createdBy
                  ? await ctx.db.get(createdBy.userId)
                  : null;

                // Get task comments count
                const commentsCount = await ctx.db
                  .query("taskComments")
                  .withIndex("by_task_id", (q) => q.eq("taskId", task._id))
                  .collect();

                tasksWithDetails.push({
                  ...task,
                  assignedTo: assignedTo
                    ? { ...assignedTo, user: assignedToUser }
                    : null,
                  assignedBy: assignedBy
                    ? { ...assignedBy, user: assignedByUser }
                    : null,
                  createdBy: createdBy
                    ? { ...createdBy, user: createdByUser }
                    : null,
                  commentsCount: commentsCount.length,
                });
              }

              listsWithTasks.push({
                ...list,
                tasks: tasksWithDetails.sort((a, b) => a.position - b.position),
                taskCount: tasksWithDetails.length,
              });
            }
          }

          // Get all workspace members for this project
          const workspaceMembers = await ctx.db
            .query("members")
            .withIndex("by_workspace_id", (q) =>
              q.eq("workspaceId", workspace._id),
            )
            .collect();

          const membersWithTasks = [];
          for (const member of workspaceMembers) {
            const memberUser = await ctx.db.get(member.userId);
            if (memberUser) {
              // Get task counts for this member in this project
              const allTasks = await ctx.db
                .query("projectTasks")
                .withIndex("by_board_id", (q) => q.eq("boardId", project._id))
                .filter((q) => q.eq(q.field("assignedToId"), member._id))
                .filter((q) => q.eq(q.field("isArchived"), false))
                .collect();

              const taskCounts = {
                todo: 0,
                progress: 0,
                hold: 0,
                review: 0,
                done: 0,
                total: allTasks.length,
              };

              // Categorize tasks based on list names
              for (const task of allTasks) {
                const taskList = listsWithTasks.find(
                  (l) => l._id === task.listId,
                );
                if (taskList) {
                  const listName = taskList.name.toLowerCase();
                  if (listName.includes("todo") || listName.includes("to do")) {
                    taskCounts.todo++;
                  } else if (
                    listName.includes("progress") ||
                    listName.includes("doing")
                  ) {
                    taskCounts.progress++;
                  } else if (
                    listName.includes("hold") ||
                    listName.includes("blocked")
                  ) {
                    taskCounts.hold++;
                  } else if (
                    listName.includes("review") ||
                    listName.includes("testing")
                  ) {
                    taskCounts.review++;
                  } else if (
                    listName.includes("done") ||
                    listName.includes("completed")
                  ) {
                    taskCounts.done++;
                  }
                }
              }

              membersWithTasks.push({
                ...member,
                user: memberUser,
                taskCounts,
              });
            }
          }

          let totalTaskCount = 0;
          if (project.projectType === 'sales') {
             const allLeads = await ctx.db.query("salesLeads").withIndex("by_board_id", (q) => q.eq("boardId", project._id)).filter((q) => q.eq(q.field("isDiscarded"), false)).collect();
             totalTaskCount = allLeads.length;
          } else {
             totalTaskCount = listsWithTasks.reduce((acc, list) => acc + list.taskCount, 0);
          }

          projectsWithDetails.push({
            ...project,
            lists: listsWithTasks.sort((a, b) => a.position - b.position),
            members: membersWithTasks,
            totalTasks: totalTaskCount,
          });
        }

        workspaces.push({
          ...workspace,
          projects: projectsWithDetails,
        });
      }
    }

    return {
      user,
      workspaces,
    };
  },
});
