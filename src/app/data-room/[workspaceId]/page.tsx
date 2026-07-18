"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { format, isToday, isYesterday, subDays, startOfDay } from "date-fns";
import {
  Upload,
  Search,
  Download,
  Eye,
  FileText,
  ImageIcon,
  File,
  Users,
  MoreHorizontal,
  X,
  LayoutGrid,
  Trash2,
  ChevronRight,
  FileSpreadsheet,
  FolderPlus,
  Folder as FolderIcon,
  List,
  Grid,
  FileIcon,
  ExternalLink,
  Pin,
  PinOff,
  Film,
  ChevronLeft,
  Play,
  Pause,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryState, parseAsString, parseAsBoolean } from "nuqs";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useGetWorkspaceMembers } from "@/features/projects/api/use-get-workspace-members";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";
import {
  useGetDataRoomFiles,
  useUploadDataRoomFile,
  useDeleteDataRoomFile,
  useCreateDataRoomFolder,
  useTogglePinDataRoomFolder,
  useMoveDataRoomItems,
  useDeleteDataRoomFolder,
} from "@/features/data-room/api/use-data-room";
import type { Id } from "../../../../convex/_generated/dataModel";

import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ResponsiveModal } from "@/components/responsive-modal";
import { PdfToolsPanel } from "./pdf-tools-panel";
import { CsvViewer } from "@/features/data-room/components/csv-viewer";
import { JsonViewer } from "@/features/data-room/components/json-viewer";

interface FileUploadData {
  file: File;
  comment: string;
  visibility: "public" | "private";
  allowedMembers: Id<"members">[];
}

const ITEMS_PER_PAGE = 50; // Increased for better grid view experience

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) return ImageIcon;
  if (fileType === "application/pdf") return FileText;
  if (
    fileType.includes("spreadsheet") ||
    fileType.includes("excel") ||
    fileType.includes("csv")
  )
    return FileSpreadsheet;
  if (fileType.startsWith("video/")) return Film;
  return File;
};

const getFileTypeColor = (fileType: string) => {
  if (fileType.startsWith("image/")) return "text-green-600";
  if (fileType === "application/pdf") return "text-red-600";
  if (fileType.includes("document") || fileType.includes("word"))
    return "text-blue-600";
  if (
    fileType.includes("spreadsheet") ||
    fileType.includes("excel") ||
    fileType.includes("csv")
  )
    return "text-emerald-600";
  if (fileType.startsWith("video/")) return "text-purple-600";
  return "text-gray-600";
};

const FOLDER_LABELS: Record<string, string> = {
  all: "All Files",
  image: "Images",
  document: "Documents",
  spreadsheet: "Spreadsheets",
  pdf: "PDFs",
};

const DataRoomWorkspacePage = () => {
  const workspaceId = useWorkspaceId();

  // URL States
  const [activeTypeFilter, setActiveTypeFilter] = useQueryState(
    "folder",
    parseAsString.withDefault("all"),
  );
  const [view, setView] = useQueryState(
    "view",
    parseAsString.withDefault("grid"),
  );
  const [currentFolderId, setCurrentFolderId] = useQueryState(
    "folderId",
    parseAsString,
  );
  const [tool, setTool] = useQueryState("tool", parseAsString);
  const [isUploadParam, setIsUploadParam] = useQueryState(
    "upload",
    parseAsBoolean.withDefault(false),
  );

  // Local UI States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    if (isUploadParam) {
      setIsUploadModalOpen(true);
    }
  }, [isUploadParam]);

  const handleOpenChangeUpload = (open: boolean) => {
    setIsUploadModalOpen(open);
    if (!open) setIsUploadParam(null);
  };

  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(
    new Set(),
  );
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadData, setUploadData] = useState<Partial<FileUploadData>>({
    comment: "",
    visibility: "public",
    allowedMembers: [],
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFolderTapRef = useRef<number>(0);

  const handleFolderClick = (e: React.MouseEvent, folderId: string) => {
    // Only intercept to catch fast sequential mobile taps
    const now = Date.now();
    if (now - lastFolderTapRef.current < 400) {
      setCurrentFolderId(folderId as Id<"dataRoomFolders">);
      lastFolderTapRef.current = 0;
    } else {
      lastFolderTapRef.current = now;
    }
  };

  // API hooks
  const { data: members } = useGetWorkspaceMembers({ workspaceId });
  const { mutate: generateUploadUrl } = useGenerateUploadUrl();
  const { data: filesData, isLoading } = useGetDataRoomFiles({
    workspaceId,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: searchQuery,
    fileTypeFilter: activeTypeFilter === "all" ? "" : activeTypeFilter,
    folderId: (currentFolderId as Id<"dataRoomFolders">) || undefined,
  });
  const createFolder = useCreateDataRoomFolder();
  const togglePinFolder = useTogglePinDataRoomFolder();
  const deleteFile = useDeleteDataRoomFile();
  const deleteFolder = useDeleteDataRoomFolder();
  const moveItems = useMoveDataRoomItems();

  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isInternalDragging, setIsInternalDragging] = useState(false);
  const uploadFile = useUploadDataRoomFile();

  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState(3000); // 3 seconds

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete File(s)",
    "Are you sure you want to delete the selected file(s)? This action cannot be undone.",
  );

  const [ConfirmFolderDeleteDialog, confirmFolderDelete] = useConfirm(
    "Delete Folder",
    "Are you sure you want to delete this folder and all its contents? This action cannot be undone.",
  );

  const files = useMemo(() => filesData?.files || [], [filesData?.files]);
  const folders = useMemo(() => filesData?.folders || [], [filesData?.folders]);
  const totalPages = filesData?.totalPages || 1;

  // Grouping logic for Grid View
  const groupedFiles = useMemo(() => {
    const groups: { label: string; items: any[] }[] = [
      { label: "Today", items: [] },
      { label: "Yesterday", items: [] },
      { label: "A long time ago", items: [] },
    ];

    files.forEach((file: any) => {
      const date = new Date(file.createdAt);
      if (isToday(date)) groups[0].items.push(file);
      else if (isYesterday(date)) groups[1].items.push(file);
      else groups[2].items.push(file);
    });

    return groups.filter(
      (g) => g.items.length > 0 || (g.label === "Today" && folders.length > 0),
    );
  }, [files, folders]);

  const processFiles = (files: File[]) => {
    const validFiles: File[] = [];
    let oversizedCount = 0;

    files.forEach((file) => {
      if (file.size <= 50 * 1024 * 1024) {
        validFiles.push(file);
      } else {
        oversizedCount++;
      }
    });

    if (oversizedCount > 0) {
      toast.error(`${oversizedCount} file(s) exceed the 50MB limit`);
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setIsUploadModalOpen(true);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isInternalMove = e.dataTransfer.types.includes(
      "application/workwise-items",
    );
    const hasFiles = e.dataTransfer.types.includes("Files");

    if (hasFiles && !isInternalMove) {
      setIsDragging(true);
    } else {
      setIsDragging(false);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.types.includes("application/workwise-items")) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
      return;
    }

    const url = e.dataTransfer.getData("text/uri-list");
    if (url) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      if (
        url.includes(appUrl.replace("http://", "").replace("https://", "")) ||
        url.includes("localhost:3000")
      ) {
        return;
      }
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !uploadData.comment?.trim()) {
      toast.error("Please select files and add a description");
      return;
    }

    try {
      const uploadToast = toast.loading(
        `Uploading ${selectedFiles.length} file(s)...`,
      );

      for (const file of selectedFiles) {
        const url = await generateUploadUrl({}, { throwError: true });
        if (!url) throw new Error("Failed to get upload URL");

        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) throw new Error(`Failed to upload ${file.name}`);
        const { storageId } = await result.json();

        await uploadFile.mutate({
          workspaceId,
          storageId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          comment: uploadData.comment!,
          visibility: uploadData.visibility!,
          allowedMembers: uploadData.allowedMembers!,
          folderId: (currentFolderId as Id<"dataRoomFolders">) || undefined,
        });
      }

      toast.dismiss(uploadToast);
      toast.success("All files uploaded successfully!");
      setSelectedFiles([]);
      setUploadData({ comment: "", visibility: "public", allowedMembers: [] });
      handleOpenChangeUpload(false);
    } catch (error) {
      toast.error("Failed to upload some or all files");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder.mutate({
        workspaceId,
        name: newFolderName,
        parentId: (currentFolderId as Id<"dataRoomFolders">) || undefined,
      });
      toast.success("Folder created!");
      setNewFolderName("");
      setIsNewFolderModalOpen(false);
    } catch (e) {
      toast.error("Failed to create folder");
    }
  };

  const handleDownload = async (file: any) => {
    try {
      if (!file.fileUrl) {
        toast.error("File URL not available");
        return;
      }
      const response = await fetch(file.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("File downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const handleDelete = async (fileIds: string[]) => {
    const ok = await confirm();
    if (!ok) return;
    try {
      for (const fileId of fileIds) {
        await deleteFile.mutate({ fileId: fileId as Id<"dataRoomFiles"> });
      }
      setSelectedFileIds(new Set());
      toast.success("Deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    const ok = await confirmFolderDelete();
    if (!ok) return;
    try {
      await deleteFolder.mutate({
        folderId: folderId as Id<"dataRoomFolders">,
      });
      toast.success("Folder and its contents deleted!");
    } catch (error) {
      toast.error("Failed to delete folder");
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFileIds);
    if (newSelection.has(fileId)) newSelection.delete(fileId);
    else newSelection.add(fileId);
    setSelectedFileIds(newSelection);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
    );
  };

  const handleNextFile = useCallback(() => {
    if (!previewFile || files.length <= 1) return;
    const currentIndex = files.findIndex((f: any) => f._id === previewFile._id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % files.length;
    setPreviewFile(files[nextIndex]);
  }, [previewFile, files]);

  const handlePreviousFile = useCallback(() => {
    if (!previewFile || files.length <= 1) return;
    const currentIndex = files.findIndex((f: any) => f._id === previewFile._id);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + files.length) % files.length;
    setPreviewFile(files[prevIndex]);
  }, [previewFile, files]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewFile) return;
      // Don't navigate if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;

      if (e.key === "ArrowRight") handleNextFile();
      if (e.key === "ArrowLeft") handlePreviousFile();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewFile, handleNextFile, handlePreviousFile]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSlideshowActive && previewFile) {
      interval = setInterval(() => {
        handleNextFile();
      }, slideshowInterval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSlideshowActive, previewFile, handleNextFile, slideshowInterval]);

  const toggleSlideshow = useCallback(() => {
    if (!isSlideshowActive) {
      if (!previewFile && files.length > 0) {
        setPreviewFile(files[0]);
      }
      setIsSlideshowActive(true);
    } else {
      setIsSlideshowActive(false);
    }
  }, [isSlideshowActive, previewFile, files]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest(
      "button, a, input, [role='menuitem'], .no-select, .dropdown-trigger, [data-selectable-id], [draggable='true']",
    );

    if (!isInteractive) {
      // Clear selection if not holding modifier keys
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        setSelectedFileIds(new Set());
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x =
          e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
        const y = e.clientY - rect.top + (containerRef.current?.scrollTop || 0);
        setDragStart({ x, y });
        setDragEnd({ x, y });
      }
    }
  }, []);

  useEffect(() => {
    if (!dragStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragEnd({
          x: e.clientX - rect.left + (containerRef.current?.scrollLeft || 0),
          y: e.clientY - rect.top + (containerRef.current?.scrollTop || 0),
        });
      }
    };

    const handleMouseUp = () => {
      if (dragStart && dragEnd) {
        const rect = {
          left: Math.min(dragStart.x, dragEnd.x),
          top: Math.min(dragStart.y, dragEnd.y),
          right: Math.max(dragStart.x, dragEnd.x),
          bottom: Math.max(dragStart.y, dragEnd.y),
        };

        const width = Math.abs(dragStart.x - dragEnd.x);
        const height = Math.abs(dragStart.y - dragEnd.y);

        // Only select if it was actually a drag (e.g. > 5px)
        if (width > 5 || height > 5) {
          const selectableItems = containerRef.current?.querySelectorAll(
            "[data-selectable-id]",
          );
          const newSelection = new Set<string>();

          selectableItems?.forEach((item) => {
            const itemRect = (item as HTMLElement).getBoundingClientRect();
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (containerRect) {
              const relativeItemRect = {
                left:
                  itemRect.left -
                  containerRect.left +
                  (containerRef.current?.scrollLeft || 0),
                top:
                  itemRect.top -
                  containerRect.top +
                  (containerRef.current?.scrollTop || 0),
                right:
                  itemRect.right -
                  containerRect.left +
                  (containerRef.current?.scrollLeft || 0),
                bottom:
                  itemRect.bottom -
                  containerRect.top +
                  (containerRef.current?.scrollTop || 0),
              };

              const isIntersecting = !(
                relativeItemRect.left > rect.right ||
                relativeItemRect.right < rect.left ||
                relativeItemRect.top > rect.bottom ||
                relativeItemRect.bottom < rect.top
              );

              if (isIntersecting) {
                const id = item.getAttribute("data-selectable-id");
                if (id) newSelection.add(id);
              }
            }
          });

          if (newSelection.size > 0) {
            setSelectedFileIds(newSelection);
          } else {
            setSelectedFileIds(new Set());
          }
        }
      }
      setDragStart(null);
      setDragEnd(null);
      setIsInternalDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragStart, dragEnd]);

  const handleItemDragStart = (
    e: React.DragEvent,
    id: string,
    type: "file" | "folder",
  ) => {
    setIsInternalDragging(true);
    let idsToMove = Array.from(selectedFileIds);
    if (!selectedFileIds.has(id)) {
      idsToMove = [id];
    }

    e.dataTransfer.setData(
      "application/workwise-items",
      JSON.stringify(idsToMove),
    );
    e.dataTransfer.effectAllowed = "move";

    // Center the drag image on the icon container
    const dragPreview = (e.currentTarget as HTMLElement).querySelector(
      ".drag-preview",
    );
    if (dragPreview) {
      e.dataTransfer.setDragImage(dragPreview, 32, 40);
    }
  };

  const handleItemDragOver = (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInternalDragging) {
      setDropTargetId(targetId || "root");
    }
  };

  const handleItemDrop = async (
    e: React.DragEvent,
    targetId: string | null,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(null);
    setIsInternalDragging(false);

    const data = e.dataTransfer.getData("application/workwise-items");
    if (!data) return;

    try {
      const ids = JSON.parse(data) as string[];
      const fileIds: Id<"dataRoomFiles">[] = [];
      const folderIds: Id<"dataRoomFolders">[] = [];

      // Categorize IDs (simplified check using provided data or lookup)
      // In this app, we can just check against our current files/folders
      ids.forEach((id) => {
        if (filesData?.files.some((f) => f._id === id)) {
          fileIds.push(id as Id<"dataRoomFiles">);
        } else if (filesData?.folders.some((f) => f._id === id)) {
          folderIds.push(id as Id<"dataRoomFolders">);
        }
      });

      if (fileIds.length === 0 && folderIds.length === 0) return;

      const promise = moveItems.mutate({
        workspaceId: workspaceId as Id<"workspaces">,
        fileIds,
        folderIds,
        targetFolderId: (targetId as Id<"dataRoomFolders">) || null,
      });

      toast.promise(promise, {
        loading: "Moving items...",
        success: "Items moved successfully",
        error: "Failed to move items",
      });

      setSelectedFileIds(new Set());
    } catch (err) {
      console.error("Drop error:", err);
    }
  };

  if (!workspaceId) return null;

  return (
    <div
      className="flex flex-col h-full overflow-hidden bg-background relative"
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
    >
      {isDragging && (
        <div
          className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-primary/40 m-4 rounded-xl transition-all animate-in fade-in zoom-in duration-200"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4 text-primary pointer-events-none">
            <div className="p-6 bg-primary/10 rounded-full animate-bounce">
              <Upload className="w-12 h-12" />
            </div>
            <p className="text-2xl font-bold">Drop files to upload</p>
            <p className="text-muted-foreground">
              Release your files to start the upload process
            </p>
          </div>
        </div>
      )}
      <ConfirmDialog />
      <ConfirmFolderDeleteDialog />

      {/* Modals */}
      <ResponsiveModal
        open={isUploadModalOpen}
        onOpenChange={handleOpenChangeUpload}
        title="Upload Document"
        className="max-w-2xl"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Select File</Label>
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/50 transition cursor-pointer"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">
                Click to select or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max 50MB per file
              </p>
            </div>
            {selectedFiles.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border text-sm"
                  >
                    <File className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatFileSize(file.size)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFiles((prev) =>
                          prev.filter((_, i) => i !== index),
                        );
                      }}
                      className="h-6 w-6"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="What is this file about?"
              value={uploadData.comment}
              onChange={(e) =>
                setUploadData({ ...uploadData, comment: e.target.value })
              }
              rows={2}
            />
          </div>
          <Tabs
            value={uploadData.visibility}
            onValueChange={(v) =>
              setUploadData({ ...uploadData, visibility: v as any })
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="public">Public</TabsTrigger>
              <TabsTrigger value="private">Private</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setIsUploadModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            className="w-full sm:w-auto"
            disabled={selectedFiles.length === 0 || !uploadData.comment?.trim()}
          >
            Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}
          </Button>
        </div>
      </ResponsiveModal>

      <ResponsiveModal
        open={isNewFolderModalOpen}
        onOpenChange={setIsNewFolderModalOpen}
        title="New Folder"
      >
        <div className="py-4">
          <Label>Folder Name</Label>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Enter folder name..."
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setIsNewFolderModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim()}
          >
            Create
          </Button>
        </div>
      </ResponsiveModal>

      {/* Main Header */}
      <div className="border-b bg-background sticky top-0 z-10 w-full">
        <div className="flex flex-col md:flex-row justify-between md:items-center px-4 py-3 md:py-2 border-b bg-muted/5 gap-3 md:gap-0 overflow-hidden w-full">
          {/* Row 1 Mobile / Left Desktop: Breadcrumbs & Mobile Actions */}
          <div className="flex items-center justify-between w-full md:w-auto md:flex-1 min-w-0">
            <div className="flex items-center text-[13px] md:text-sm text-muted-foreground min-w-0 overflow-x-auto hide-scrollbar flex-nowrap shrink">
              <span
                className={cn(
                  "hover:text-foreground cursor-pointer px-1 rounded transition-colors whitespace-nowrap",
                  dropTargetId === "root" && "bg-primary/20",
                )}
                onDragOver={(e) => handleItemDragOver(e, null)}
                onDragLeave={() => setDropTargetId(null)}
                onDrop={(e) => handleItemDrop(e, null)}
                onClick={() => {
                  setCurrentFolderId(null);
                  setActiveTypeFilter("all");
                }}
              >
                Data Room
              </span>
              {filesData?.breadcrumbPath?.map((folder) => (
                <React.Fragment key={folder._id}>
                  <ChevronRight className="w-4 h-4 mx-1 flex-shrink-0" />
                  <span
                    className={cn(
                      "hover:text-foreground cursor-pointer truncate max-w-[120px] px-1 rounded transition-colors whitespace-nowrap",
                      dropTargetId === folder._id && "bg-primary/20",
                    )}
                    onDragOver={(e) => handleItemDragOver(e, folder._id)}
                    onDragLeave={() => setDropTargetId(null)}
                    onDrop={(e) => handleItemDrop(e, folder._id)}
                    onClick={() => setCurrentFolderId(folder._id)}
                  >
                    {folder.name}
                  </span>
                </React.Fragment>
              ))}
              {activeTypeFilter !== "all" && (
                <>
                  <ChevronRight className="w-4 h-4 mx-1 flex-shrink-0" />
                  <Badge
                    variant="secondary"
                    className="font-normal capitalize whitespace-nowrap"
                  >
                    {FOLDER_LABELS[activeTypeFilter] || activeTypeFilter}
                  </Badge>
                </>
              )}
            </div>

            {/* Mobile Actions (Hidden on Desktop) */}
            <div className="flex md:hidden items-center gap-1 flex-shrink-0 ml-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleSlideshow}
                className={cn(
                  "h-8 w-8 px-0",
                  isSlideshowActive && "bg-primary/10 text-primary",
                )}
              >
                {isSlideshowActive ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => setIsUploadModalOpen(true)}
                className="h-8 w-8 px-0"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsNewFolderModalOpen(true)}
                className="h-8 w-8 px-0"
              >
                <FolderPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Row 2 Mobile / Right Desktop: Desktop Actions, Toggles & Search */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0 overflow-x-auto hide-scrollbar pb-1 md:pb-0">
            {/* Desktop Actions (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-2 mr-2">
              <Button
                size="sm"
                onClick={() => setIsUploadModalOpen(true)}
                className="h-8"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsNewFolderModalOpen(true)}
                className="h-8"
              >
                <FolderPlus className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleSlideshow}
                className={cn(
                  "h-8",
                  isSlideshowActive && "bg-primary/10 border-primary",
                )}
              >
                {isSlideshowActive ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
            </div>

            {/* Delete Selection Actions (Mobile & Desktop) */}
            {selectedFileIds.size > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(Array.from(selectedFileIds))}
                className="h-8 w-8 text-destructive hover:bg-destructive/10 md:hidden flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            {selectedFileIds.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(Array.from(selectedFileIds))}
                className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 hidden md:flex"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete (
                {selectedFileIds.size})
              </Button>
            )}

            {/* View Mode Toggle */}
            <div className="flex border rounded-md p-0.5 h-8 bg-muted/20 flex-shrink-0">
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setView("list")}
                className="h-7 w-7"
              >
                <List className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setView("grid")}
                className="h-7 w-7"
              >
                <Grid className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Search - Flex-1 on mobile, fixed width on desktop */}
            <div className="relative flex-1 md:w-64 md:flex-none">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <input
                placeholder="Search everywhere..."
                className="h-8 pl-8 text-sm bg-muted/20 border rounded-md w-full outline-none focus:ring-1 focus:ring-primary transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          className={cn(
            "flex-1 overflow-auto bg-background/50 relative selection-area",
            dragStart && "select-none",
          )}
        >
          {dragStart && dragEnd && (
            <div
              className="absolute z-50 bg-primary/20 border border-primary/50 rounded-sm pointer-events-none"
              style={{
                left: Math.min(dragStart.x, dragEnd.x),
                top: Math.min(dragStart.y, dragEnd.y),
                width: Math.abs(dragStart.x - dragEnd.x),
                height: Math.abs(dragStart.y - dragEnd.y),
              }}
            />
          )}
          {isLoading ? (
            <div className="p-8 space-y-4">
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
              <div className="h-40 w-full bg-muted animate-pulse rounded" />
            </div>
          ) : folders.length === 0 && files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-12 text-muted-foreground">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <FolderIcon className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-lg font-medium text-foreground/70">
                No files or folders here
              </p>
              <p className="text-sm">Upload something to get started</p>
            </div>
          ) : view === "list" ? (
            <Table>
              <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="w-[40px] px-4">
                    <Checkbox
                      checked={
                        selectedFileIds.size === files.length &&
                        files.length > 0
                      }
                      onCheckedChange={() =>
                        setSelectedFileIds(
                          new Set(
                            selectedFileIds.size === files.length
                              ? []
                              : files.map((f: any) => f._id),
                          ),
                        )
                      }
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {folders.map((folder) => (
                  <TableRow
                    key={folder._id}
                    data-selectable-id={folder._id}
                    draggable
                    onDragStart={(e) =>
                      handleItemDragStart(e, folder._id, "folder")
                    }
                    onDragOver={(e) => handleItemDragOver(e, folder._id)}
                    onDragLeave={() => setDropTargetId(null)}
                    onDrop={(e) => handleItemDrop(e, folder._id)}
                    onClick={(e) => handleFolderClick(e, folder._id)}
                    onDoubleClick={() => setCurrentFolderId(folder._id)}
                    className={cn(
                      "cursor-pointer group hover:bg-muted/40 transition-colors relative",
                      selectedFileIds.has(folder._id) && "bg-primary/5",
                      dropTargetId === folder._id &&
                        "bg-primary/10 shadow-[inset_0_0_0_2px_rgba(var(--primary),0.2)]",
                    )}
                  >
                    <TableCell className="px-4">
                      <FolderIcon className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
                    </TableCell>
                    <TableCell className="font-medium flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <FolderIcon className="w-5 h-5 text-yellow-500 fill-yellow-500/40" />
                        {folder.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      Folder
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(folder.createdAt, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              togglePinFolder.mutate({
                                folderId: folder._id,
                                isPinned: !folder.isPinned,
                              })
                            }
                          >
                            {folder.isPinned ? (
                              <>
                                <PinOff className="h-4 h-4 mr-2" />
                                Unpin from Sidebar
                              </>
                            ) : (
                              <>
                                <Pin className="h-4 h-4 mr-2" />
                                Pin to Sidebar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder._id);
                            }}
                          >
                            <Trash2 className="h-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {files.map((file) => (
                  <TableRow
                    key={file._id}
                    data-selectable-id={file._id}
                    draggable
                    onDragStart={(e) =>
                      handleItemDragStart(e, file._id, "file")
                    }
                    className={cn(
                      "cursor-pointer group transition-colors",
                      selectedFileIds.has(file._id) && "bg-primary/5",
                    )}
                    onDoubleClick={() => setPreviewFile(file)}
                  >
                    <TableCell className="px-4">
                      <Checkbox
                        checked={selectedFileIds.has(file._id)}
                        onCheckedChange={() => toggleFileSelection(file._id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium flex items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-1.5 rounded-md bg-muted",
                            getFileTypeColor(file.fileType),
                          )}
                        >
                          <FileIcon className="w-4 h-4" />
                        </div>
                        <span className="truncate">{file.fileName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {file.fileType.split("/")[1]?.toUpperCase() || "FILE"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(file.createdAt, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatFileSize(file.fileSize)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={!file.fileUrl}
                            onClick={() => setPreviewFile(file)}
                          >
                            <Eye className="h-4 h-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!file.fileUrl}
                            onClick={() =>
                              file.fileUrl &&
                              window.open(file.fileUrl, "_blank")
                            }
                          >
                            <ExternalLink className="h-4 h-4 mr-2" />
                            Open in New Tab
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownload(file)}
                          >
                            <Download className="h-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete([file._id])}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6 space-y-10">
              {groupedFiles.map((group) => (
                <div key={group.label} className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1 flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5" />
                    {group.label}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-4 gap-y-8">
                    {/* Folders in Today Group */}
                    {group.label === "Today" &&
                      folders.map((folder) => (
                        <div
                          key={folder._id}
                          data-selectable-id={folder._id}
                          draggable
                          onDragStart={(e) =>
                            handleItemDragStart(e, folder._id, "folder")
                          }
                          onDragOver={(e) => handleItemDragOver(e, folder._id)}
                          onDragLeave={() => setDropTargetId(null)}
                          onDrop={(e) => handleItemDrop(e, folder._id)}
                          onClick={(e) => handleFolderClick(e, folder._id)}
                          onDoubleClick={() => setCurrentFolderId(folder._id)}
                          className={cn(
                            "group flex flex-col items-center gap-2 cursor-pointer relative p-2 rounded-lg transition-all",
                            selectedFileIds.has(folder._id) &&
                              "bg-primary/5 shadow-sm",
                            dropTargetId === folder._id &&
                              "bg-primary/10 scale-105 ring-2 ring-primary/20",
                          )}
                        >
                          <div className="w-16 h-20 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-transparent group-hover:bg-muted group-hover:border-primary/20 transition-all relative drag-preview">
                            <FolderIcon className="w-10 h-10 text-yellow-500 fill-yellow-500/20" />
                            {selectedFileIds.has(folder._id) && (
                              <div
                                className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5 hover:bg-primary/80 transition-colors cursor-pointer z-[60]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFileSelection(folder._id);
                                }}
                              >
                                <X className="w-3 h-3 rotate-45" />
                              </div>
                            )}
                            <div className="absolute top-1 right-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-3 h-3 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePinFolder.mutate({
                                        folderId: folder._id,
                                        isPinned: !folder.isPinned,
                                      });
                                    }}
                                  >
                                    {folder.isPinned ? (
                                      <>
                                        <PinOff className="h-4 h-4 mr-2" />
                                        Unpin from Sidebar
                                      </>
                                    ) : (
                                      <>
                                        <Pin className="h-4 h-4 mr-2" />
                                        Pin to Sidebar
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFolder(folder._id);
                                    }}
                                  >
                                    <Trash2 className="h-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <span className="text-xs text-center font-medium truncate w-full px-1">
                            {folder.name}
                          </span>
                        </div>
                      ))}
                    {/* Files */}
                    {group.items.map((file) => {
                      const FileIcon = getFileIcon(file.fileType);
                      const isSelected = selectedFileIds.has(file._id);
                      return (
                        <div
                          key={file._id}
                          data-selectable-id={file._id}
                          draggable
                          onDragStart={(e) =>
                            handleItemDragStart(e, file._id, "file")
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                              toggleFileSelection(file._id);
                            } else {
                              if (
                                selectedFileIds.size > 0 &&
                                !selectedFileIds.has(file._id)
                              ) {
                                setSelectedFileIds(new Set([file._id]));
                              } else {
                                setPreviewFile(file);
                              }
                            }
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            toggleFileSelection(file._id);
                          }}
                          className={cn(
                            "group flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg transition-all",
                            selectedFileIds.has(file._id) &&
                              "bg-primary/5 shadow-sm",
                          )}
                        >
                          <div
                            className={cn(
                              "w-16 h-20 rounded-lg flex items-center justify-center border-2 transition-all relative overflow-hidden drag-preview",
                              isSelected
                                ? "bg-primary/10 border-primary"
                                : "bg-muted/30 border-transparent hover:bg-muted",
                            )}
                          >
                            {file.fileType.startsWith("image/") ? (
                              <Image
                                src={file.fileUrl || ""}
                                fill
                                className="object-cover"
                                alt={file.fileName || "Image"}
                              />
                            ) : (
                              <div
                                className={cn(
                                  "p-2",
                                  getFileTypeColor(file.fileType),
                                )}
                              >
                                <FileIcon className="w-8 h-8" />
                              </div>
                            )}
                            {isSelected && (
                              <div
                                className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5 hover:bg-primary/80 transition-colors cursor-pointer z-[60]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFileSelection(file._id);
                                }}
                              >
                                <X className="w-3 h-3 rotate-45" />
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-center font-medium line-clamp-2 w-full px-1 leading-tight">
                            {file.fileName}
                          </span>
                        </div>
                      );
                    })}
                    {/* Preview Modal */}
                    <Dialog
                      open={!!previewFile}
                      onOpenChange={(open) => {
                        if (!open) {
                          setPreviewFile(null);
                          setIsSlideshowActive(false);
                        }
                      }}
                    >
                      <DialogContent className="max-w-5xl w-full h-[100dvh] max-h-[100dvh] sm:h-[90vh] sm:max-h-[90vh] border-0 sm:border rounded-none sm:rounded-lg flex flex-col p-0 sm:p-1 gap-0 !m-0">
                        <DialogHeader className="p-3 sm:p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 space-y-0">
                          <div className="flex items-center gap-2 overflow-hidden w-full sm:w-auto pr-8 sm:pr-0">
                            <div
                              className={cn(
                                "p-1.5 rounded-md bg-muted flex-shrink-0",
                                previewFile &&
                                  getFileTypeColor(previewFile.fileType),
                              )}
                            >
                              {previewFile &&
                                React.createElement(
                                  getFileIcon(previewFile.fileType),
                                  { className: "w-4 h-4" },
                                )}
                            </div>
                            <DialogTitle className="text-base font-semibold truncate">
                              {previewFile?.fileName}
                            </DialogTitle>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border whitespace-nowrap">
                                {files.findIndex(
                                  (f: any) => f._id === previewFile?._id,
                                ) + 1}{" "}
                                of {files.length}
                              </span>
                              <div className="flex items-center gap-1 bg-muted/50 rounded-md border p-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={toggleSlideshow}
                                >
                                  {isSlideshowActive ? (
                                    <Pause className="w-3.5 h-3.5" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                                <div className="hidden sm:flex border-l pl-1 items-center gap-1">
                                  <Clock className="w-3 h-3 text-muted-foreground mr-0.5" />
                                  {[3, 5, 10].map((s) => (
                                    <Button
                                      key={s}
                                      variant={
                                        slideshowInterval === s * 1000
                                          ? "secondary"
                                          : "ghost"
                                      }
                                      size="sm"
                                      className="h-6 px-1.5 min-w-[24px] text-[10px]"
                                      onClick={() =>
                                        setSlideshowInterval(s * 1000)
                                      }
                                    >
                                      {s}s
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2">
                              {previewFile?.fileUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 sm:w-auto sm:px-3 px-0 flex-shrink-0"
                                  onClick={() =>
                                    window.open(previewFile.fileUrl, "_blank")
                                  }
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 sm:w-auto sm:px-3 px-0 flex-shrink-0"
                                onClick={() =>
                                  previewFile && handleDownload(previewFile)
                                }
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </DialogHeader>
                        <div className="flex-1 bg-muted/20 relative flex items-center justify-center overflow-hidden group/preview">
                          {/* Side Navigation Buttons */}
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handlePreviousFile}
                              disabled={files.length <= 1}
                              className="h-12 w-12 rounded-full opacity-10 group-hover/preview:opacity-100 hover:bg-background/20 transition-all duration-300"
                            >
                              <ChevronLeft className="w-8 h-8" />
                            </Button>
                          </div>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleNextFile}
                              disabled={files.length <= 1}
                              className="h-12 w-12 rounded-full opacity-10 group-hover/preview:opacity-100 hover:bg-background/20 transition-all duration-300"
                            >
                              <ChevronRight className="w-8 h-8" />
                            </Button>
                          </div>

                          {previewFile && (
                            <>
                              {previewFile.fileType.startsWith("image/") ? (
                                <Image
                                  src={previewFile.fileUrl || ""}
                                  alt={previewFile.fileName}
                                  fill
                                  className="object-contain"
                                />
                              ) : previewFile.fileType === "application/pdf" ? (
                                <iframe
                                  src={previewFile.fileUrl}
                                  className="w-full h-full border-none"
                                  title="PDF Preview"
                                />
                              ) : previewFile.fileType.includes("document") ||
                                previewFile.fileType.includes("word") ||
                                previewFile.fileType.includes("spreadsheet") ||
                                previewFile.fileType.includes("excel") ||
                                previewFile.fileType.includes("presentation") ||
                                previewFile.fileType.includes("powerpoint") ? (
                                <iframe
                                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewFile.fileUrl)}&embedded=true`}
                                  className="w-full h-full border-none"
                                  title="Document Preview"
                                />
                              ) : previewFile.fileType.includes("csv") ||
                                previewFile.fileName
                                  .toLowerCase()
                                  .endsWith(".csv") ? (
                                <CsvViewer url={previewFile.fileUrl} />
                              ) : previewFile.fileType.includes("json") ||
                                previewFile.fileName
                                  .toLowerCase()
                                  .endsWith(".json") ? (
                                <JsonViewer url={previewFile.fileUrl} />
                              ) : previewFile.fileType.startsWith("video/") ? (
                                <div className="w-full h-full flex items-center justify-center bg-black">
                                  <video
                                    src={previewFile.fileUrl}
                                    controls
                                    className="max-w-full max-h-full"
                                    autoPlay
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              ) : (
                                <div className="text-center p-8">
                                  <File className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                                  <p className="text-lg font-medium">
                                    No preview available for this file type
                                  </p>
                                  <p className="text-sm text-muted-foreground mb-4">
                                    You can still download or open it in a new
                                    tab
                                  </p>
                                  <Button
                                    onClick={() =>
                                      window.open(previewFile.fileUrl, "_blank")
                                    }
                                  >
                                    Open in New Tab
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination Fix if needed */}
      <div className="p-2 border-t text-[10px] text-muted-foreground bg-muted/5 flex justify-between items-center px-4">
        <span>{files.length + folders.length} items in total</span>
        <div className="flex gap-2 items-center">
          <Button
            size="icon"
            variant="ghost"
            disabled={currentPage === 1}
            className="h-6 w-6"
            onClick={() => setCurrentPage((c) => c - 1)}
          >
            <ChevronRight className="rotate-180 w-3 h-3" />
          </Button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <Button
            size="icon"
            variant="ghost"
            disabled={currentPage === totalPages}
            className="h-6 w-6"
            onClick={() => setCurrentPage((c) => c + 1)}
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataRoomWorkspacePage;
