import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface UseGetProjectTasksProps {
  listId: Id<"projectLists">;
  includeArchived?: boolean;
  assignedToIds?: Id<"members">[]; // Change to array
}

export const useGetProjectTasks = ({
  listId,
  includeArchived,
  assignedToIds, // Change to array
}: UseGetProjectTasksProps) => {
  const data = useQuery(api.projects.getProjectTasks, {
    listId,
    includeArchived,
    assignedToIds, // Pass array to the query
  });
  const isLoading = data === undefined;

  return { data, isLoading };
};
