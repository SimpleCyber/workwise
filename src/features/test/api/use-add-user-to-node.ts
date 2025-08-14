import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export const useAddUserToNode = () => {
  return useMutation(api.advancetree.addUserToNode);
};
