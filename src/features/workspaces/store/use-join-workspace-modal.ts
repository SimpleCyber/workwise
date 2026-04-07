"use client";

import { atom, useAtom } from "jotai";

const joinWorkspaceModalAtom = atom(false);

export const useJoinWorkspaceModal = () => {
  return useAtom(joinWorkspaceModalAtom);
};
