import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export const useToggleStar = () => {
  return useMutation(api.advancetree.toggleNodeStarred);
};
