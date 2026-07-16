import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface UseGetProjectTaskProps {
  taskId: Id<"projectTasks"> | null;
}

export const useGetProjectTask = ({ taskId }: UseGetProjectTaskProps) => {
  const data = useQuery(
    api.projects.getProjectTask,
    taskId ? { taskId } : "skip"
  );
  const isLoading = data === undefined;

  return { data, isLoading };
};
