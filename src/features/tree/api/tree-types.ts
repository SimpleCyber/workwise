import type { Id } from "../../../../convex/_generated/dataModel";

export interface User {
  _id: Id<"users">;
  name?: string;
  email?: string;
  image?: string;
}

export interface Member {
  _id: Id<"members">;
  role: "admin" | "member" | "lead";
  user: User;
  taskCounts?: {
    todo: number;
    progress: number;
    hold: number;
    review: number;
    done: number;
    total: number;
  };
}

export interface Task {
  _id: Id<"projectTasks">;
  title: string;
  taskCode: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: number;
  isCompleted?: boolean;
  createdAt: number;
  updatedAt: number;
  assignedAt: number;
  commentsCount: number;
  assignedTo?: Member | null;
  assignedBy?: Member | null;
  createdBy?: Member | null;
}

export interface ProjectList {
  _id: Id<"projectLists">;
  name: string;
  position: number;
  taskCount: number;
  tasks: Task[];
}

export interface Project {
  _id: Id<"projectBoards">;
  name: string;
  boardCode: string;
  totalTasks: number;
  lists: ProjectList[];
  members: Member[];
}

export interface Workspace {
  _id: Id<"workspaces">;
  name: string;
  projects: Project[];
}

export interface TreeData {
  user: User;
  workspaces: Workspace[];
}

export interface TreeVisualizationProps {
  data: TreeData;
  workspaceId: Id<"workspaces">;
}

export type ViewMode = "all" | "overview";
export type Layout = "vertical" | "horizontal";
