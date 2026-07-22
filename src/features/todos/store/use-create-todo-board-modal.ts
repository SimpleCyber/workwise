"use client";

import { atom, useAtom } from "jotai";

const createTodoBoardModalAtom = atom(false);
const showArchivedBoardsAtom = atom(false);

export const useCreateTodoBoardModal = () => {
  return useAtom(createTodoBoardModalAtom);
};

export const useShowArchivedBoards = () => {
  return useAtom(showArchivedBoardsAtom);
};
