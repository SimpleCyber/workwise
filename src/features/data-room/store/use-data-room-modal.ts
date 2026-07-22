"use client";

import { atom, useAtom } from "jotai";

const dataRoomUploadModalAtom = atom(false);
const dataRoomFolderModalAtom = atom(false);

export const useDataRoomUploadModal = () => {
  return useAtom(dataRoomUploadModalAtom);
};

export const useDataRoomFolderModal = () => {
  return useAtom(dataRoomFolderModalAtom);
};
