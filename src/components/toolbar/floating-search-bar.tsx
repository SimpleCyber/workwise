"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Grip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRealtimeSearch } from "@/features/search/api/use-realtime-search";
import { SearchResults } from "@/features/search/components/search-results";
import { useWorkspaceId } from "@/hooks/use-workspace-id";

interface Position {
  x: number;
  y: number;
}

interface FloatingSearchBarProps {
  defaultPosition?: "bottom" | "top" | "center";
  className?: string;
}

export const FloatingSearchBar: React.FC<FloatingSearchBarProps> = ({
  defaultPosition = "bottom",
  className,
}) => {
  const workspaceId = useWorkspaceId();
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const searchBarRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search hook with debounced query
  const { data: searchResults, isLoading } = useRealtimeSearch({
    workspaceId,
    query: debouncedQuery,
    filters: { types: [], sortBy: "relevance" },
    limit: 50,
  });

  // Show results when there's a query and results
  useEffect(() => {
    if (debouncedQuery.trim() && searchResults?.results?.length) {
      setShowResults(true);
    } else if (!debouncedQuery.trim()) {
      setShowResults(false);
    }
  }, [debouncedQuery, searchResults]);

  // Initialize position based on default
  useEffect(() => {
    const updatePosition = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let newPosition: Position;

      switch (defaultPosition) {
        case "top":
          newPosition = { x: windowWidth / 2 - 200, y: 50 };
          break;
        case "center":
          newPosition = { x: windowWidth / 2 - 200, y: windowHeight / 2 - 25 };
          break;
        case "bottom":
        default:
          newPosition = { x: windowWidth / 2 - 200, y: windowHeight - 100 };
          break;
      }

      setPosition(newPosition);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [defaultPosition]);

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem("floating-search-position");
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (error) {
        console.error("Failed to parse saved position:", error);
      }
    }
  }, []);

  // Save position to localStorage
  const savePosition = useCallback((newPosition: Position) => {
    localStorage.setItem(
      "floating-search-position",
      JSON.stringify(newPosition),
    );
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow dragging from drag handle when expanded, or anywhere when collapsed
    if (isExpanded && !dragRef.current?.contains(e.target as Node)) return;
    if (!isExpanded && !searchBarRef.current?.contains(e.target as Node))
      return;

    e.preventDefault();
    setIsDragging(true);

    const rect = searchBarRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const newPosition = {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        };

        // Keep within viewport bounds with proper margins
        const searchBarWidth = isExpanded ? 400 : 50;
        const maxX = window.innerWidth - searchBarWidth;
        const maxY = window.innerHeight - 50;

        newPosition.x = Math.max(10, Math.min(maxX - 10, newPosition.x));
        newPosition.y = Math.max(10, Math.min(maxY - 10, newPosition.y));

        setPosition(newPosition);
      });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        savePosition(position);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none"; // Prevent text selection while dragging
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, dragOffset, position, savePosition, isExpanded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is outside both search bar and results
      const isOutsideSearchBar =
        searchBarRef.current && !searchBarRef.current.contains(target);
      const isOutsideResults =
        !resultsRef.current || !resultsRef.current.contains(target);

      if (isOutsideSearchBar && isOutsideResults) {
        setIsExpanded(false);
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate results position
  const getResultsPosition = () => {
    const searchBarHeight = 50;
    const windowHeight = window.innerHeight;
    const resultsHeight = 400;

    // If search bar is in bottom half, show results above
    const showAbove = position.y > windowHeight / 2;

    return {
      x: position.x,
      y: showAbove
        ? position.y - resultsHeight - 10
        : position.y + searchBarHeight + 10,
    };
  };

  const resultsPosition = getResultsPosition();

  return (
    <>
      {/* Search Bar */}
      <div
        ref={searchBarRef}
        className={cn(
          "fixed z-50 transition-all duration-200 ease-out",
          isDragging
            ? "cursor-grabbing scale-105"
            : isExpanded
              ? "cursor-default"
              : "cursor-grab hover:scale-105",
          className,
        )}
        style={{
          left: position.x,
          top: position.y,
          width: isExpanded ? "400px" : "50px",
          height: "50px",
        }}
        onMouseDown={handleMouseDown}
      >
        <Card
          className={cn(
            "h-full shadow-lg border-2 transition-all duration-200",
            "bg-background/95 backdrop-blur-sm",
            isExpanded ? "rounded-full px-4" : "rounded-full p-0",
            isDragging ? "shadow-2xl" : "hover:shadow-xl",
          )}
        >
          {isExpanded ? (
            <div className="flex items-center h-full gap-2">
              {/* Drag Handle */}
              <div
                ref={dragRef}
                className="cursor-grab hover:cursor-grabbing p-1 rounded-full hover:bg-muted/50 transition-colors"
              >
                <Grip className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Search Icon */}
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />

              {/* Input */}
              <Input
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 text-sm placeholder:text-muted-foreground"
                autoFocus
              />

              {/* Clear Button */}
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-muted/50 rounded-full"
                  onClick={() => {
                    setSearchQuery("");
                    setShowResults(false);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full h-full rounded-full p-0 hover:bg-muted/50 transition-all duration-200"
              onClick={(e) => {
                // Only expand if not dragging
                if (!isDragging) {
                  setIsExpanded(true);
                }
              }}
            >
              <Search className="h-5 w-5 text-muted-foreground" />
            </Button>
          )}
        </Card>
      </div>

      {/* Search Results */}
      {showResults && isExpanded && (
        <div
          ref={resultsRef}
          className="fixed z-40 w-96 max-h-96 overflow-hidden transition-all duration-200"
          style={{
            left: resultsPosition.x,
            top: resultsPosition.y,
          }}
        >
          <Card className="shadow-xl border-2 bg-background/95 backdrop-blur-sm">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Search Results</h3>
                <span className="text-xs text-muted-foreground">
                  {searchResults?.total || 0} results
                </span>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <SearchResults
                results={searchResults?.results || []}
                total={searchResults?.total || 0}
                isLoading={isLoading}
                query={debouncedQuery}
              />
            </div>
          </Card>
        </div>
      )}
    </>
  );
};
