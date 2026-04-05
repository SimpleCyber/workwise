import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertCircle, FileCode } from "lucide-react";

interface JsonViewerProps {
  url: string;
}

export const JsonViewer = ({ url }: JsonViewerProps) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJson = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch JSON");
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load JSON");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJson();
  }, [url]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground font-premium">
          Loading JSON data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-destructive h-full">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background/50 rounded-lg border overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b">
        <FileCode className="w-4 h-4 text-orange-500" />
        <span className="text-xs font-medium text-muted-foreground">
          JSON Viewer
        </span>
      </div>
      <ScrollArea className="flex-1 w-full">
        <pre className="p-4 text-[12px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      </ScrollArea>
    </div>
  );
};
