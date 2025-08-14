import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export const useUpdateTreeNode = () => {
  return useMutation(api.advancetree.updateNodeWithPermission);
};
