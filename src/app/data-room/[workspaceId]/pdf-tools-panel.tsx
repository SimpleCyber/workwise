"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  FileStack,
  Plus,
  Zap,
  Download,
  Save,
  File as FileIcon,
  Image as ImageIcon,
  Loader2,
  Check,
  ChevronRight,
  Search,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  useGetDataRoomFiles,
  useUploadDataRoomFile,
} from "@/features/data-room/api/use-data-room";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";
import type { Id } from "@/../convex/_generated/dataModel";

interface PdfToolsPanelProps {
  isOpen: boolean;
  tool: string | null;
  onClose: () => void;
  workspaceId: Id<"workspaces">;
  currentFolderId: Id<"dataRoomFolders"> | null;
}

export const PdfToolsPanel = ({
  isOpen,
  tool,
  onClose,
  workspaceId,
  currentFolderId,
}: PdfToolsPanelProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");

  const { data: filesData } = useGetDataRoomFiles({
    workspaceId,
    limit: 100, // Load enough files to pick from
    search: searchQuery,
  });

  const uploadFile = useUploadDataRoomFile();
  const { mutate: generateUploadUrl } = useGenerateUploadUrl();

  const allFiles = useMemo(() => filesData?.files || [], [filesData]);

  // Filter files based on tool
  const pickableFiles = useMemo(() => {
    if (tool === "merge") {
      return allFiles.filter(
        (f) =>
          f.fileType === "application/pdf" || f.fileType.startsWith("image/"),
      );
    }
    if (tool === "create") {
      return allFiles.filter((f) => f.fileType.startsWith("image/"));
    }
    return allFiles;
  }, [allFiles, tool]);

  const selectedFiles = useMemo(
    () => pickableFiles.filter((f) => selectedFileIds.has(f._id)),
    [pickableFiles, selectedFileIds],
  );

  const toggleFile = (id: string) => {
    const newSet = new Set(selectedFileIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedFileIds(newSet);
  };

  const handleProcess = async (action: "download" | "save") => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    setIsProcessing(true);
    const loadingToast = toast.loading(
      action === "download" ? "Generating PDF..." : "Saving to Data Room...",
    );

    try {
      const pdfDoc = await PDFDocument.create();

      for (const file of selectedFiles) {
        if (!file.fileUrl) continue;
        const response = await fetch(file.fileUrl);
        const buffer = await response.arrayBuffer();

        if (file.fileType === "application/pdf") {
          const donorPdf = await PDFDocument.load(buffer);
          const copiedPages = await pdfDoc.copyPages(
            donorPdf,
            donorPdf.getPageIndices(),
          );
          copiedPages.forEach((page) => pdfDoc.addPage(page));
        } else if (file.fileType.startsWith("image/")) {
          let image;
          if (file.fileType === "image/png") {
            image = await pdfDoc.embedPng(buffer);
          } else {
            image = await pdfDoc.embedJpg(buffer);
          }

          const page = pdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], {
        type: "application/pdf",
      });

      if (action === "download") {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `merged_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("PDF downloaded!");
      } else {
        // Save to Data Room
        const uploadUrl = await generateUploadUrl({}, { throwError: true });
        if (!uploadUrl) throw new Error("Failed to get upload URL");

        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "application/pdf" },
          body: blob,
        });

        if (!result.ok) throw new Error("Failed to upload PDF");
        const { storageId } = await result.json();

        await uploadFile.mutate({
          workspaceId,
          storageId,
          fileName: `Merged_${new Date().toLocaleDateString()}.pdf`,
          fileType: "application/pdf",
          fileSize: pdfBytes.length,
          comment: "Created using Data Room tools",
          visibility: "public",
          allowedMembers: [],
          folderId: currentFolderId || undefined,
        });

        toast.success("Saved to Data Room!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to process PDF");
    } finally {
      setIsProcessing(false);
      toast.dismiss(loadingToast);
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="h-full w-full bg-card border-l border-y-0 border-r-0 border-border flex flex-col rounded-none shadow-none overflow-hidden animate-in slide-in-from-right duration-300">
      <CardHeader className="flex flex-row items-center justify-between p-1.5 border-b border-border bg-gradient-to-r from-muted/50 to-card">
        <div className="flex items-center gap-3 pl-2.5">
          {tool === "merge" ? (
            <FileStack className="w-5 h-5 text-foreground/80" />
          ) : (
            <Plus className="w-5 h-5 text-foreground/80" />
          )}
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground capitalize">
              {tool === "merge" ? "Merge PDFs" : "Create PDF"}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 no-drag">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 p-0 rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
        <div className="p-3 bg-muted/10 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input
              placeholder="Search files to add..."
              className="h-9 pl-8 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                Data Room Files
              </p>
              {pickableFiles.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  No compatible files found
                </p>
              ) : (
                pickableFiles.map((file) => (
                  <div
                    key={file._id}
                    onClick={() => toggleFile(file._id)}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group",
                      selectedFileIds.has(file._id)
                        ? "bg-primary/10"
                        : "hover:bg-muted",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded border flex items-center justify-center bg-white overflow-hidden relative shrink-0",
                        selectedFileIds.has(file._id)
                          ? "border-primary ring-1 ring-primary"
                          : "border-muted-foreground/20",
                      )}
                    >
                      {file.fileType.startsWith("image/") && file.fileUrl ? (
                        <>
                          <img
                            src={file.fileUrl}
                            alt={file.fileName}
                            className="w-full h-full object-cover"
                          />
                          {selectedFileIds.has(file._id) && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[1px]">
                              <Check className="w-5 h-5 text-primary drop-shadow-md font-bold" />
                            </div>
                          )}
                        </>
                      ) : selectedFileIds.has(file._id) ? (
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      ) : (
                        <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.fileName}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {file.fileType.split("/")[1]}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedFiles.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                    Selected ({selectedFiles.length})
                  </p>
                  <div className="space-y-2">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={file._id}
                        className="flex items-center gap-2 p-2 bg-muted/40 rounded-md text-xs"
                      >
                        <Badge
                          variant="outline"
                          className="h-5 w-5 p-0 flex items-center justify-center rounded-full shrink-0"
                        >
                          {idx + 1}
                        </Badge>
                        <span className="truncate flex-1">{file.fileName}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFile(file._id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/20 space-y-2 mt-auto">
          <Button
            className="w-full h-10 gap-2"
            disabled={selectedFiles.length === 0 || isProcessing}
            onClick={() => handleProcess("download")}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Result
          </Button>
          <Button
            variant="outline"
            className="w-full h-10 gap-2"
            disabled={selectedFiles.length === 0 || isProcessing}
            onClick={() => handleProcess("save")}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save to Data Room
          </Button>
          <p className="text-[10px] text-center text-muted-foreground px-2">
            Processing takes place entirely in your browser. Files never leave
            the platform.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
