"use client";

import type { PropsWithChildren } from "react";
import WorkspaceLayout from "@/components/workspace-sidebar/workspace-sidebar-layout";
import { WorkspaceSidebarContent } from "./workspace-sidebar-content";
import { FeatureGuard } from "@/components/feature-flags";
import { useAtom, useAtomValue } from "jotai";
import { selectedTodoCardAtom, todoViewModeAtom } from "@/lib/panel-atoms";
import { CardDetailPanel } from "@/features/todos/components/card-detail-panel";
import { CardDetailModal } from "@/features/todos/components/card-detail-modal";

const TodoWorkspaceLayout = ({ children }: Readonly<PropsWithChildren>) => {
  const [selectedCard, setSelectedCard] = useAtom(selectedTodoCardAtom);
  const viewMode = useAtomValue(todoViewModeAtom);

  const rightPanel =
    selectedCard && viewMode === "panel" ? <CardDetailPanel /> : undefined;

  return (
    <FeatureGuard flag="todos">
      <WorkspaceLayout
        autoSaveId="todo-workspace-layout"
        sidebarContent={<WorkspaceSidebarContent />}
        rightPanel={rightPanel}
      >
        {children}
      </WorkspaceLayout>
      {viewMode === "modal" && selectedCard && (
        <CardDetailModal
          card={selectedCard}
          open={!!selectedCard}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedCard(null);
            }
          }}
        />
      )}
    </FeatureGuard>
  );
};

export default TodoWorkspaceLayout;
