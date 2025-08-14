import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export const useCreateNodeComment = () => {
  return useMutation(api.advancetree.createNodeComment);
};
