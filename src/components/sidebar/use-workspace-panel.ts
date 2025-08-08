"use client";

import { useRef, useState, useCallback } from "react";
import { ImperativePanelHandle } from "react-resizable-panels";

export function useWorkspacePanel(defaultSize: number = 25) {
  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const togglePanel = useCallback(() => {
    const panel = leftPanelRef.current;
    if (panel) {
      if (isCollapsed) {
        // Expand to default size
        panel.resize(defaultSize);
        setIsCollapsed(false);
      } else {
        // Collapse to 0% width
        panel.resize(0);
        setIsCollapsed(true);
      }
    }
  }, [isCollapsed, defaultSize]);

  const handlePanelResize = useCallback((size: number) => {
    // Update collapsed state based on panel size
    setIsCollapsed(size === 0);
  }, []);

  return {
    leftPanelRef,
    isCollapsed,
    togglePanel,
    handlePanelResize,
  };
}
