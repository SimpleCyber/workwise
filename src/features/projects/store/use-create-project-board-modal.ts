"use client";

import { atom, useAtom } from "jotai";

const createProjectBoardModalAtom = atom(false);

export const useCreateProjectBoardModal = () => {
  return useAtom(createProjectBoardModalAtom);
};
