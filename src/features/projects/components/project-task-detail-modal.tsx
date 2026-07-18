"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Id } from "../../../../convex/_generated/dataModel";
import { TaskHeader } from "./task-modal/task-header";
import { TaskContent } from "./task-modal/task-content";
import { ImagePreviewModal } from "./task-modal/image-preview-modal";
import { useGetProjectTask } from "../api/use-get-project-task";

import { useAtom, useAtomValue } from "jotai";
import {
  selectedProjectTaskAtom,
  projectTaskViewModeAtom,
} from "@/lib/panel-atoms";
import { useGetProjectLists } from "../api/use-get-project-lists";

export const ProjectTaskDetailModal = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [initialTask, setTask] = useAtom(selectedProjectTaskAtom);
  const viewMode = useAtomValue(projectTaskViewModeAtom);

  const { data: listsData } = useGetProjectLists({
    boardId: initialTask?.boardId as Id<"projectBoards">,
  });

  const lists = listsData || [];

  const { data: realtimeTask } = useGetProjectTask({
    taskId: initialTask?._id || null,
  });

  const task = (realtimeTask as any) || initialTask;

  if (!task || viewMode !== "modal") return null;

  return (
    <TooltipProvider>
      <Dialog
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            setTask(null);
          }
        }}
      >
        <DialogContent
          hideClose
          className="max-w-5xl h-[92vh] p-0 flex flex-col overflow-hidden border-none shadow-2xl rounded-xl ring-1 ring-border/50"
        >
          <TaskHeader task={task} lists={lists} onClose={() => setTask(null)} />
          <div className="flex-1 min-h-0 bg-background">
            <TaskContent
              task={task}
              lists={lists}
              onImagePreview={setImagePreview}
            />
          </div>
        </DialogContent>
      </Dialog>

      <ImagePreviewModal
        imageUrl={imagePreview}
        onClose={() => setImagePreview(null)}
      />
    </TooltipProvider>
  );
};
