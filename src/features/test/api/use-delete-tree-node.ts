import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export const useDeleteTreeNode = () => {
  return useMutation(api.advancetree.deleteTreeNode);
};
