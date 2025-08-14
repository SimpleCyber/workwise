import type { Node, Edge } from "reactflow";

export class TreeNodeManager {
  /**
   * Creates a new tree node
   */
  createNode(
    id: string,
    label: string,
    callbacks: {
      onAddChild: () => void;
      onDelete: () => void;
    },
  ): Node {
    return {
      id,
      type: "treeNode",
      position: { x: 0, y: 0 }, // Will be calculated by layout manager
      data: {
        label,
        onAddChild: callbacks.onAddChild,
        onDelete: callbacks.onDelete,
        isRoot: false,
        hasChildren: false,
      },
    };
  }

  /**
   * Creates a new edge between parent and child
   */
  createEdge(parentId: string, childId: string): Edge {
    return {
      id: `e${parentId}-${childId}`,
      source: parentId,
      target: childId,
      type: "smoothstep",
      style: {
        strokeWidth: 2,
        stroke: "#3b82f6",
      },
      animated: false,
    };
  }

  /**
   * Finds all descendant nodes of a given node
   */
  findDescendants(nodeId: string, edges: Edge[]): string[] {
    const findChildren = (id: string): string[] => {
      const children = edges
        .filter((edge) => edge.source === id)
        .map((edge) => edge.target);

      return children.concat(children.flatMap(findChildren));
    };

    return findChildren(nodeId);
  }

  /**
   * Checks if a node has children
   */
  hasChildren(nodeId: string, edges: Edge[]): boolean {
    return edges.some((edge) => edge.source === nodeId);
  }

  /**
   * Gets all children of a node
   */
  getChildren(nodeId: string, edges: Edge[]): string[] {
    return edges
      .filter((edge) => edge.source === nodeId)
      .map((edge) => edge.target);
  }

  /**
   * Gets the parent of a node
   */
  getParent(nodeId: string, edges: Edge[]): string | null {
    const parentEdge = edges.find((edge) => edge.target === nodeId);
    return parentEdge ? parentEdge.source : null;
  }
}
