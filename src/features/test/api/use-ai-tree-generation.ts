import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export const useCreateAIGeneratedTree = () => {
  return useMutation(api.advancetree.createAIGeneratedTree);
};

export const useExpandNodeWithAI = () => {
  return useMutation(api.advancetree.expandNodeWithAI);
};
