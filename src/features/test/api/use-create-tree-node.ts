import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export const useCreateTreeNode = () => {
  return useMutation(api.advancetree.createTreeNode);
};
