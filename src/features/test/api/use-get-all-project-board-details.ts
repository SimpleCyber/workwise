import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface UseGetProjectFullBoardProps {
  boardId: Id<"projectBoards">;
}

export const useGetFullProjectBoard = ({
  boardId,
}: UseGetProjectFullBoardProps) => {
  const datas = useQuery(api.projects.getFullProjectBoard, { boardId });
  const isLoading = datas === undefined;

  return { datas, isLoading };
};
