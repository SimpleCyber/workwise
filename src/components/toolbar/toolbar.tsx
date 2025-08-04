"use client";

import type React from "react";

import {
  Search,
  Filter,
  Calendar,
  ArrowUpDown,
  X,
  MessageSquare,
  CheckSquare,
  FolderKanban,
  Users,
  FileText,
  Bell,
  CalendarClock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa";

import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { SearchResults } from "@/features/search/components/search-results";
import { useRealtimeSearch } from "@/features/search/api/use-realtime-search";
import { links } from "@/config";
import { useGetChannels } from "@/features/channels/api/use-get-channels";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { format } from "date-fns";

import { useAtom } from "jotai";
import { calendarOpenAtom, notificationOpenAtom } from "@/lib/panel-atoms";
import { ToolbarButton } from "./toolbar-button";

const searchTypes = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "todo", label: "Todo", icon: CheckSquare },
  { id: "members", label: "Members", icon: Users },
  { id: "dataroom", label: "Data Room", icon: FileText },
];

export const Toolbar = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const { data } = useGetWorkspace({ id: workspaceId });
  const { data: channels } = useGetChannels({ workspaceId });
  const { data: members } = useGetMembers({ workspaceId });
  const [calendarOpen, setCalendarOpen] = useAtom(calendarOpenAtom);
  const [notificationOpen, setNotificationOpen] = useAtom(notificationOpenAtom);

  // Original command dialog state
  const [open, setOpen] = useState(false);

  // New search states
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<
    { start: number; end: number } | undefined
  >();
  const [sortBy, setSortBy] = useState("relevance");
  const [customDateRange, setCustomDateRange] = useState({
    start: format(new Date(), "yyyy-MM-dd"),
    end: format(new Date(Date.now() - 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
  });

  // Search filters
  const filters = {
    types: selectedTypes,
    dateRange,
    sortBy,
  };

  // Search hook
  const { data: searchResults, isLoading } = useRealtimeSearch({
    workspaceId,
    query: searchQuery,
    filters,
    limit: 100,
  });

  const onChannelClick = (channelId: Id<"channels">) => {
    setOpen(false);
    router.push(`/workspace/${workspaceId}/channel/${channelId}`);
  };

  const onMemberClick = (memberId: Id<"members">) => {
    setOpen(false);
    router.push(`/workspace/${workspaceId}/member/${memberId}`);
  };

  // Handle search on Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setShowSearchResults(true);
    }
  };

  // Handle type selection
  const handleTypeToggle = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId],
    );
  };

  // Handle date range presets
  const handleDateRangePreset = (preset: string) => {
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    switch (preset) {
      case "today":
        setDateRange({
          start: todayStart,
          end: todayStart + 24 * 60 * 60 * 1000 - 1,
        });
        break;
      case "week":
        const weekAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
        setDateRange({
          start: weekAgo,
          end: now,
        });
        break;
      case "month":
        const monthAgo = todayStart - 30 * 24 * 60 * 60 * 1000;
        setDateRange({
          start: monthAgo,
          end: now,
        });
        break;
      case "custom":
        const startDate = new Date(customDateRange.start);
        const endDate = new Date(customDateRange.end);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        if (endDate.getTime() >= startDate.getTime()) {
          setDateRange({
            start: startDate.getTime(),
            end: endDate.getTime(),
          });
        }
        break;
      case "all":
      default:
        setDateRange(undefined);
        break;
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedTypes([]);
    setDateRange(undefined);
    setSortBy("relevance");
  };

  const hasActiveFilters =
    selectedTypes.length > 0 || dateRange || sortBy !== "relevance";

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Don't render if no workspace ID
  if (!workspaceId) {
    return (
      <nav className="flex h-10 items-center justify-between bg-gray-900 p-1.5">
        <div className="flex-1" aria-hidden />
        <div className="min-w-[280px] max-w-[642px] shrink grow-[2]">
          <div className="h-7 w-full bg-accent/25 rounded px-2 flex items-center">
            <Search className="mr-2 size-4 text-white" />
            <span className="text-xs text-white">No workspace selected...</span>
          </div>
        </div>
        <div className="ml-auto flex flex-1 items-center justify-end">
          <Button variant="transparent" size="iconSm" asChild>
            <Link
              href={links.sourceCode}
              target="_blank"
              rel="noreferrer noopener"
              title="Source Code"
            >
              <FaGithub className="size-5 text-white" />
            </Link>
          </Button>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="flex h-10 items-center justify-between bg-gray-900 p-1.5">
        <div className="flex-1" aria-hidden />
        <div className="min-w-[280px] max-w-[642px] shrink grow-[2] flex items-center gap-2">
          {/* Main Search Button */}
          <Button
            onClick={() => setOpen(true)}
            size="sm"
            className="h-7 flex-1 justify-start bg-accent/25 px-2 hover:bg-accent/25"
          >
            <Search className="mr-2 size-4 text-white" />
            <span className="text-xs text-white">
              Search {data?.name ?? "workspace"}...
            </span>
            <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-90">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          {/* Filter Buttons */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-white hover:bg-white/10"
              >
                <Filter className="h-3 w-3" />
                {selectedTypes.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 px-1 text-xs bg-white/20 text-white"
                  >
                    {selectedTypes.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="center">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Content Types</h4>
                  {selectedTypes.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTypes([])}
                      className="h-auto p-1 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {searchTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div
                        key={type.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={type.id}
                          checked={selectedTypes.includes(type.id)}
                          onCheckedChange={() => handleTypeToggle(type.id)}
                        />
                        <label
                          htmlFor={type.id}
                          className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                        >
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-white hover:bg-white/10"
              >
                <Calendar className="h-3 w-3" />
                {dateRange && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 px-1 text-xs bg-white/20 text-white"
                  >
                    •
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="center">
              <div className="space-y-4">
                <h4 className="font-medium">Date Range</h4>
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
                  <label className="text-sm font-medium">Custom Range</label>
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

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-20 h-7 bg-transparent border-white/20 text-white text-xs">
              <ArrowUpDown className="h-3 w-3" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="date_desc">Newest</SelectItem>
              <SelectItem value="date_asc">Oldest</SelectItem>
              <SelectItem value="name_asc">A-Z</SelectItem>
              <SelectItem value="name_desc">Z-A</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 px-2 text-white hover:bg-white/10"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Original Command Dialog */}
        <CommandDialog open={open} onOpenChange={setOpen}>
          <div className="p-4 border-b">
            <Input
              placeholder={`Search ${data?.name ?? "workspace"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to search
            </p>
          </div>
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Channels">
              {channels?.map((channel) => (
                <CommandItem
                  onSelect={() => onChannelClick(channel._id)}
                  key={channel._id}
                >
                  {channel.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Members">
              {members?.map((member) => (
                <CommandItem
                  onSelect={() => onMemberClick(member._id)}
                  key={member._id}
                >
                  {member.user.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>

        <div className="ml-auto flex flex-1 items-center justify-end">
          {/* <Button variant="transparent" size="iconSm" asChild>
            <Link
              href={links.sourceCode}
              target="_blank"
              rel="noreferrer noopener"
              title="Source Code"
            >
              <FaGithub className="size-5 text-white" />
            </Link>
          </Button> */}
          <ToolbarButton
            icon={Bell}
            label=""
            isActive={notificationOpen}
            onClick={() => {
              setNotificationOpen((prev) => {
                const next = !prev;
                if (next) setCalendarOpen(false); // Close calendar if notifications is being opened
                return next;
              });
            }}
          />

          <ToolbarButton
            icon={CalendarClock}
            label=""
            isActive={calendarOpen}
            onClick={() => {
              setCalendarOpen((prev) => {
                const next = !prev;
                if (next) setNotificationOpen(false); // Close notifications if calendar is being opened
                return next;
              });
            }}
          />
        </div>
      </nav>

      {/* Search Results Modal */}
      <Dialog open={showSearchResults} onOpenChange={setShowSearchResults}>
        <DialogContent className="max-w-4xl max-h-[80vh] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Search Results</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
            {" "}
            {/* 60px = header height */}
            <SearchResults
              results={searchResults?.results || []}
              total={searchResults?.total || 0}
              isLoading={isLoading}
              query={searchQuery}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
