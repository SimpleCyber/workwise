"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useGetTreeData } from "@/features/tree/api/use-get-tree-data";
import { TreeVisualization } from "@/features/tree/tree-visualization";

export default function TreeWorkspacePage({
  params,
}: {
  params: { workspaceId: Id<"workspaces"> };
}) {
  const { workspaceId } = params;

  const { data: treeData, isLoading: treeLoading } = useGetTreeData({
    workspaceId,
  });

  if (treeLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Loading tree data...
          </span>
        </div>
      </div>
    );
  }

  if (!treeData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <TriangleAlert className="size-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Tree data not found.
          </span>
        </div>
      </div>
    );
  }

  console.log("tree :", treeData);

  return (
    <div className="h-full w-full">
      <TreeVisualization data={treeData} workspaceId={workspaceId} />
    </div>
  );
}
