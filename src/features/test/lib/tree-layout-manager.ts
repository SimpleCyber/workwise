import type { Node, Edge } from "@xyflow/react";

export class TreeLayoutManager {
  private readonly HORIZONTAL_SPACING = 400;
  private readonly VERTICAL_SPACING = 250;
  private readonly ROOT_POSITION = { x: 600, y: 100 };
  private readonly MIN_NODE_WIDTH = 200;

  /**
   * Recalculates the entire tree layout for perfect symmetry
   */
  recalculateTreeLayout(nodes: Node[], edges: Edge[]): Node[] {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const rootNode = nodes.find((node) => node.data.isRoot);

    if (!rootNode) return nodes;

    // Build tree structure
    const treeStructure = this.buildTreeStructure(nodes, edges);

    // Calculate subtree widths to prevent overlapping
    const subtreeWidths = this.calculateSubtreeWidths(
      treeStructure,
      rootNode.id,
    );

    // Calculate positions starting from root
    const positionedNodes = this.calculateNodePositions(
      treeStructure,
      rootNode.id,
      nodeMap,
      subtreeWidths,
      0,
      this.ROOT_POSITION.x,
    );

    return positionedNodes;
  }

  /**
   * Builds a tree structure from nodes and edges
   */
  private buildTreeStructure(
    nodes: Node[],
    edges: Edge[],
  ): Map<string, string[]> {
    const tree = new Map<string, string[]>();

    // Initialize all nodes
    nodes.forEach((node) => {
      tree.set(node.id, []);
    });

    // Build parent-child relationships
    edges.forEach((edge) => {
      const children = tree.get(edge.source) || [];
      children.push(edge.target);
      tree.set(edge.source, children);
    });

    return tree;
  }

  /**
   * Calculates the width required for each subtree
   */
  private calculateSubtreeWidths(
    treeStructure: Map<string, string[]>,
    nodeId: string,
  ): Map<string, number> {
    const widths = new Map<string, number>();

    const calculateWidth = (id: string): number => {
      const children = treeStructure.get(id) || [];

      if (children.length === 0) {
        // Leaf node
        widths.set(id, this.MIN_NODE_WIDTH);
        return this.MIN_NODE_WIDTH;
      }

      // Calculate total width needed for all children
      let totalChildWidth = 0;
      children.forEach((childId) => {
        totalChildWidth += calculateWidth(childId);
      });

      // Add spacing between children
      const spacingWidth = (children.length - 1) * this.HORIZONTAL_SPACING;
      const subtreeWidth = Math.max(
        this.MIN_NODE_WIDTH,
        totalChildWidth + spacingWidth,
      );

      widths.set(id, subtreeWidth);
      return subtreeWidth;
    };

    calculateWidth(nodeId);
    return widths;
  }

  /**
   * Calculates positions for all nodes recursively with proper spacing
   */
  private calculateNodePositions(
    treeStructure: Map<string, string[]>,
    nodeId: string,
    nodeMap: Map<string, Node>,
    subtreeWidths: Map<string, number>,
    level = 0,
    centerX: number = this.ROOT_POSITION.x,
  ): Node[] {
    const node = nodeMap.get(nodeId);
    if (!node) return [];

    const children = treeStructure.get(nodeId) || [];
    const result: Node[] = [];

    // Position current node
    const y = this.ROOT_POSITION.y + level * this.VERTICAL_SPACING;
    result.push({
      ...node,
      position: { x: centerX - this.MIN_NODE_WIDTH / 2, y },
    });

    if (children.length > 0) {
      // Calculate positions for children based on their subtree widths
      const childPositions = this.calculateChildrenPositionsWithWidths(
        centerX,
        children,
        subtreeWidths,
      );

      children.forEach((childId, index) => {
        const childCenterX = childPositions[index];

        // Recursively position children and their subtrees
        const childNodes = this.calculateNodePositions(
          treeStructure,
          childId,
          nodeMap,
          subtreeWidths,
          level + 1,
          childCenterX,
        );

        result.push(...childNodes);
      });
    }

    return result;
  }

  /**
   * Calculates positions for children based on their subtree widths
   */
  private calculateChildrenPositionsWithWidths(
    parentCenterX: number,
    children: string[],
    subtreeWidths: Map<string, number>,
  ): number[] {
    if (children.length === 1) {
      return [parentCenterX];
    }

    // Calculate total width needed
    let totalWidth = 0;
    children.forEach((childId) => {
      totalWidth += subtreeWidths.get(childId) || this.MIN_NODE_WIDTH;
    });

    // Add spacing between subtrees
    totalWidth += (children.length - 1) * this.HORIZONTAL_SPACING;

    // Calculate starting position
    let currentX = parentCenterX - totalWidth / 2;

    // Position each child at the center of its allocated space
    const positions: number[] = [];
    children.forEach((childId) => {
      const childWidth = subtreeWidths.get(childId) || this.MIN_NODE_WIDTH;
      positions.push(currentX + childWidth / 2);
      currentX += childWidth + this.HORIZONTAL_SPACING;
    });

    return positions;
  }
}
