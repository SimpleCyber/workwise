import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertCircle } from "lucide-react";

interface CsvViewerProps {
  url: string;
}

export const CsvViewer = ({ url }: CsvViewerProps) => {
  const [data, setData] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCsv = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch CSV");
        const text = await response.text();

        // Simple CSV parser
        const rows = text.split(/\r?\n/).filter((row) => row.trim() !== "");
        const parsedData = rows.map((row) => {
          // Handle both comma and semicolon (simple check)
          // For a more robust solution, a library like PapaParse would be better,
          // but this works for most standard CSVs without extra dependencies.
          const delimiter = row.includes(";") && !row.includes(",") ? ";" : ",";
          return row
            .split(delimiter)
            .map((cell) => cell.replace(/^["']|["']$/g, "").trim());
        });

        setData(parsedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load CSV");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCsv();
  }, [url]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground font-premium">
          Loading CSV data...
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

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground h-full">
        <p>No data found in this CSV file.</p>
      </div>
    );
  }

  const headers = data[0];
  const rows = data.slice(1);

  return (
    <div className="h-full w-full bg-background/50 rounded-lg border overflow-hidden flex flex-col">
      <ScrollArea className="h-full w-full">
        <Table className="relative w-full border-collapse">
          <TableHeader className="bg-muted/90 sticky top-0 z-10 backdrop-blur-sm border-b shadow-sm">
            <TableRow className="hover:bg-transparent">
              {headers.map((header, i) => (
                <TableHead
                  key={i}
                  className="px-3 py-2 font-bold text-foreground border-r last:border-r-0 text-[11px] min-w-[120px] max-w-[250px] truncate"
                  title={header}
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow
                key={i}
                className="hover:bg-muted/30 transition-colors border-b last:border-b-0"
              >
                {row.map((cell, j) => (
                  <TableCell
                    key={j}
                    className="px-3 py-2 text-[11px] border-r last:border-r-0 break-words max-w-[250px]"
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};
