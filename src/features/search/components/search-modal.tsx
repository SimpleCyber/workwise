"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Calendar,
  MessageSquare,
  CheckSquare,
  FolderKanban,
  Users,
  FileText,
  Clock,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { useGlobalSearch } from "@/features/search/api/use-global-search";
import type { Id } from "@/../convex/_generated/dataModel";

interface SearchModalProps {
  workspaceId: Id<"workspaces">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "chat":
      return MessageSquare;
    case "todo":
      return CheckSquare;
    case "projects":
      return FolderKanban;
    case "members":
      return Users;
    case "dataroom":
      return FileText;
    default:
      return Search;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "chat":
      return "bg-blue-100 text-blue-800";
    case "todo":
      return "bg-green-100 text-green-800";
    case "projects":
      return "bg-purple-100 text-purple-800";
    case "members":
      return "bg-orange-100 text-orange-800";
    case "dataroom":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const SearchModal = ({
  workspaceId,
  open,
  onOpenChange,
}: SearchModalProps) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    type: "all" as const,
    types: [] as string[],
    dateRange: undefined as { start: number; end: number } | undefined,
    sortBy: "relevance" as const,
  });

  const [customDateRange, setCustomDateRange] = useState({
    start: format(new Date(), "yyyy-MM-dd"),
    end: format(new Date(Date.now() - 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: searchResults, isLoading } = useGlobalSearch({
    workspaceId,
    query,
    filters,
    limit: 50,
  });

  // Handle date range presets
  const handleDateRangePreset = (preset: string) => {
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    switch (preset) {
      case "today":
        setFilters((prev) => ({
          ...prev,
          dateRange: {
            start: todayStart,
            end: todayStart + 24 * 60 * 60 * 1000 - 1,
          },
        }));
        break;
      case "week":
        const weekAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
        setFilters((prev) => ({
          ...prev,
          dateRange: {
            start: weekAgo,
            end: now,
          },
        }));
        break;
      case "month":
        const monthAgo = todayStart - 30 * 24 * 60 * 60 * 1000;
        setFilters((prev) => ({
          ...prev,
          dateRange: {
            start: monthAgo,
            end: now,
          },
        }));
        break;
      case "custom":
        const startDate = new Date(customDateRange.start);
        const endDate = new Date(customDateRange.end);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        if (endDate.getTime() >= startDate.getTime()) {
          setFilters((prev) => ({
            ...prev,
            dateRange: {
              start: startDate.getTime(),
              end: endDate.getTime(),
            },
          }));
        }
        break;
      case "all":
      default:
        setFilters((prev) => ({
          ...prev,
          dateRange: undefined,
        }));
        break;
    }
  };

  const handleResultClick = (result: any) => {
    router.push(result.url);
    onOpenChange(false);
    setQuery("");
  };

  const clearFilters = () => {
    setFilters({
      type: "all",
      types: [],
      dateRange: undefined,
      sortBy: "relevance",
    });
  };

  const hasActiveFilters =
    filters.type !== "all" ||
    filters.dateRange ||
    filters.sortBy !== "relevance";

  return (
    <Command className="rounded-lg border shadow-md">
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder="Search workspace..."
          value={query}
          onValueChange={setQuery}
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="flex items-center gap-2 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-muted" : ""}
          >
            <Filter className="h-4 w-4" />
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="border-b p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={filters.type}
                onValueChange={(value: any) =>
                  setFilters((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="members">Members</SelectItem>
                  <SelectItem value="dataroom">Data Room</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.dateRange ? "Custom Range" : "All Time"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleDateRangePreset("all")}
                      >
                        All Time
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleDateRangePreset("today")}
                      >
                        Today
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleDateRangePreset("week")}
                      >
                        Last 7 Days
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleDateRangePreset("month")}
                      >
                        Last 30 Days
                      </Button>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Custom Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Start
                          </label>
                          <Input
                            type="date"
                            value={customDateRange.start}
                            onChange={(e) =>
                              setCustomDateRange((prev) => ({
                                ...prev,
                                start: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">
                            End
                          </label>
                          <Input
                            type="date"
                            value={customDateRange.end}
                            max={customDateRange.start}
                            onChange={(e) =>
                              setCustomDateRange((prev) => ({
                                ...prev,
                                end: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleDateRangePreset("custom")}
                      >
                        Apply Custom Range
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Sort Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select
                value={filters.sortBy}
                onValueChange={(value: any) =>
                  setFilters((prev) => ({ ...prev, sortBy: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date_desc">Newest First</SelectItem>
                  <SelectItem value="date_asc">Oldest First</SelectItem>
                  <SelectItem value="name_asc">Name A-Z</SelectItem>
                  <SelectItem value="name_desc">Name Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <CommandList>
        {query.length < 2 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search
          </div>
        ) : isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        ) : !searchResults?.results.length ? (
          <CommandEmpty>
            <div className="text-center py-6">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search terms or filters
              </p>
            </div>
          </CommandEmpty>
        ) : (
          <ScrollArea className="max-h-96">
            <CommandGroup>
              {searchResults.results.map((result: any) => {
                const Icon = getTypeIcon(result.type);
                return (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    onSelect={() => handleResultClick(result)}
                    className="flex items-start gap-3 p-4 cursor-pointer"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {result.title}
                        </h4>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getTypeColor(result.type)}`}
                        >
                          {result.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {result.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Avatar className="h-4 w-4">
                          <AvatarImage
                            src={result.authorImage || "/placeholder.svg"}
                          />
                          <AvatarFallback className="text-xs">
                            {result.author?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{result.author}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(result.date), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </ScrollArea>
        )}
      </CommandList>

      {searchResults && searchResults.total > searchResults.results.length && (
        <div className="border-t p-2 text-center text-sm text-muted-foreground">
          Showing {searchResults.results.length} of {searchResults.total}{" "}
          results
        </div>
      )}
    </Command>
  );
};
