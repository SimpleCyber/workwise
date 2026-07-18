"use client";

import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
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

export const ProjectTaskDetailPanel = () => {
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

  if (!task || viewMode !== "panel") return null;

  return (
    <TooltipProvider>
      <Card className="h-full w-full bg-background border-l border-y-0 border-r-0 border-border flex flex-col rounded-none shadow-none overflow-hidden xl:min-w-[400px]">
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col min-h-full">
            <TaskHeader
              task={task}
              lists={lists}
              onClose={() => setTask(null)}
            />
            <div className="flex-1 flex flex-col bg-background relative">
              <TaskContent
                task={task}
                lists={lists}
                onImagePreview={setImagePreview}
              />
            </div>
          </div>
        </div>
      </Card>

      <ImagePreviewModal
        imageUrl={imagePreview}
        onClose={() => setImagePreview(null)}
      />
    </TooltipProvider>
  );
};
