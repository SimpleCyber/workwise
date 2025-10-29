import type { Node, Edge } from "reactflow";

export class TreeLayoutManager {
  private readonly HORIZONTAL_SPACING = 400;
  private readonly VERTICAL_SPACING = 300;
  private readonly ROOT_POSITION = { x: 600, y: 100 };
  private readonly MIN_NODE_WIDTH = 280;
  recalculateTreeLayout(nodes: Node[], edges: Edge[]): Node[] {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const rootNode = nodes.find((node) => node.data.isRoot);

    if (!rootNode) return nodes;

    const treeStructure = this.buildTreeStructure(nodes, edges);

    const subtreeWidths = this.calculateSubtreeWidths(
      treeStructure,
      rootNode.id,
    );

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

  private buildTreeStructure(
    nodes: Node[],
    edges: Edge[],
  ): Map<string, string[]> {
    const tree = new Map<string, string[]>();

    nodes.forEach((node) => {
      tree.set(node.id, []);
    });

    edges.forEach((edge) => {
      const children = tree.get(edge.source) || [];
      children.push(edge.target);
      tree.set(edge.source, children);
    });

    return tree;
  }

  private calculateSubtreeWidths(
    treeStructure: Map<string, string[]>,
    nodeId: string,
  ): Map<string, number> {
    const widths = new Map<string, number>();

    const calculateWidth = (id: string): number => {
      const children = treeStructure.get(id) || [];

      if (children.length === 0) {
        widths.set(id, this.MIN_NODE_WIDTH);
        return this.MIN_NODE_WIDTH;
      }

      let totalChildWidth = 0;
      children.forEach((childId) => {
        totalChildWidth += calculateWidth(childId);
      });

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

    const y = this.ROOT_POSITION.y + level * this.VERTICAL_SPACING;
    result.push({
      ...node,
      position: { x: centerX - this.MIN_NODE_WIDTH / 2, y },
    });

    if (children.length > 0) {
      const childPositions = this.calculateChildrenPositionsWithWidths(
        centerX,
        children,
        subtreeWidths,
      );

      children.forEach((childId, index) => {
        const childCenterX = childPositions[index];

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

  private calculateChildrenPositionsWithWidths(
    parentCenterX: number,
    children: string[],
    subtreeWidths: Map<string, number>,
  ): number[] {
    if (children.length === 1) {
      return [parentCenterX];
    }

    let totalWidth = 0;
    children.forEach((childId) => {
      totalWidth += subtreeWidths.get(childId) || this.MIN_NODE_WIDTH;
    });

    const spacingBetweenSubtrees = Math.max(
      this.HORIZONTAL_SPACING,
      this.MIN_NODE_WIDTH * 0.7,
    );
    totalWidth += (children.length - 1) * spacingBetweenSubtrees;

    // Calculate starting position
    let currentX = parentCenterX - totalWidth / 2;

    // Position each child at the center of its allocated space
    const positions: number[] = [];
    children.forEach((childId) => {
      const childWidth = subtreeWidths.get(childId) || this.MIN_NODE_WIDTH;
      positions.push(currentX + childWidth / 2);
      currentX += childWidth + spacingBetweenSubtrees;
    });

    return positions;
  }
}
