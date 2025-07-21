"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  CheckSquare,
  FolderKanban,
  Users,
  FileText,
  Clock,
  Search,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HighlightedText } from "./highlighted-text";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  titleHighlights: {
    text: string;
    highlights: { start: number; end: number }[];
  };
  content: string;
  contentHighlights: {
    text: string;
    highlights: { start: number; end: number }[];
  };
  author: string;
  authorImage?: string;
  date: number;
  url: string;
  metadata: any;
  relevanceScore: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  total: number;
  isLoading: boolean;
  query: string;
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

export const SearchResults = ({
  results,
  total,
  isLoading,
  query,
}: SearchResultsProps) => {
  const router = useRouter();

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
  };

  if (!query.trim()) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>Start typing to search across your workspace</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-4" />
        <p>Searching...</p>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No results found</h3>
        <p>Try adjusting your search terms or filters</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-muted/30">
        <p className="text-sm text-muted-foreground">
          Found {total} result{total !== 1 ? "s" : ""} for &quot;{query}&quot;
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {results.map((result) => {
            const Icon = getTypeIcon(result.type);
            return (
              <div
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <HighlightedText
                      text={result.titleHighlights.text}
                      highlights={result.titleHighlights.highlights}
                      className="font-medium text-sm truncate"
                    />
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getTypeColor(result.type)}`}
                    >
                      {result.type}
                    </Badge>
                  </div>
                  <HighlightedText
                    text={result.contentHighlights.text}
                    highlights={result.contentHighlights.highlights}
                    className="text-sm text-muted-foreground line-clamp-2 mb-2"
                  />
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
                    <span>{format(new Date(result.date), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
