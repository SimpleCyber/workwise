"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { useQueryState, parseAsString } from "nuqs";

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
} from "@/features/data-room/api/use-data-room";
import type { Id } from "../../../../convex/_generated/dataModel";

import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";

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

  // Local UI States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
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
  const uploadFile = useUploadDataRoomFile();
  const deleteFile = useDeleteDataRoomFile();
  const createFolder = useCreateDataRoomFolder();

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete File(s)",
    "Are you sure you want to delete the selected file(s)? This action cannot be undone.",
  );

  const files = filesData?.files || [];
  const folders = filesData?.folders || [];
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

  if (!workspaceId) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
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
      setIsUploadModalOpen(false);
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

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <ConfirmDialog />

      {/* Modals */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={
                selectedFiles.length === 0 || !uploadData.comment?.trim()
              }
            >
              Upload{" "}
              {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isNewFolderModalOpen}
        onOpenChange={setIsNewFolderModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
          </DialogHeader>
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewFolderModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Header */}
      <div className="border-b bg-background">
        <div className="flex items-center px-4 py-2 border-b bg-muted/5 overflow-hidden">
          <div className="flex items-center text-sm text-muted-foreground flex-1 min-w-0">
            <span
              className="hover:text-foreground cursor-pointer"
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
                  className="hover:text-foreground cursor-pointer truncate max-w-[120px]"
                  onClick={() => setCurrentFolderId(folder._id)}
                >
                  {folder.name}
                </span>
              </React.Fragment>
            ))}
            {activeTypeFilter !== "all" && (
              <>
                <ChevronRight className="w-4 h-4 mx-1" />
                <Badge variant="secondary" className="font-normal capitalize">
                  {FOLDER_LABELS[activeTypeFilter] || activeTypeFilter}
                </Badge>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 mx-4 flex-shrink-0">
            <Button
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              className="h-8"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsNewFolderModalOpen(true)}
              className="h-8"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <div className="flex border rounded-md p-0.5 h-8 bg-muted/20">
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

            {selectedFileIds.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(Array.from(selectedFileIds))}
                className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedFileIds.size})
              </Button>
            )}
          </div>

          <div className="relative w-64 flex-shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <input
              placeholder="Search everywhere..."
              className="h-8 pl-8 text-sm bg-muted/20 border rounded-md w-full outline-none focus:ring-1 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-background/50">
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
                      selectedFileIds.size === files.length && files.length > 0
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
                  className="cursor-pointer group hover:bg-muted/40"
                  onDoubleClick={() => setCurrentFolderId(folder._id)}
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
                  <TableCell className="text-muted-foreground text-sm">
                    --
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
              {files.map((file) => (
                <TableRow
                  key={file._id}
                  className={cn(
                    "cursor-pointer group",
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
                            file.fileUrl && window.open(file.fileUrl, "_blank")
                          }
                        >
                          <ExternalLink className="h-4 h-4 mr-2" />
                          Open in New Tab
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(file)}>
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
                        onDoubleClick={() => setCurrentFolderId(folder._id)}
                        className="group flex flex-col items-center gap-2 cursor-pointer"
                      >
                        <div className="w-16 h-20 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-transparent group-hover:bg-muted group-hover:border-primary/20 transition-all relative">
                          <FolderIcon className="w-10 h-10 text-yellow-500 fill-yellow-500/20" />
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
                        onClick={() => {
                          if (selectedFileIds.size > 0) {
                            toggleFileSelection(file._id);
                          } else {
                            setPreviewFile(file);
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          toggleFileSelection(file._id);
                        }}
                        className="group flex flex-col items-center gap-2 cursor-pointer"
                      >
                        <div
                          className={cn(
                            "w-16 h-20 rounded-lg flex items-center justify-center border-2 transition-all relative overflow-hidden",
                            isSelected
                              ? "bg-primary/10 border-primary"
                              : "bg-muted/30 border-transparent hover:bg-muted",
                          )}
                        >
                          {file.fileType.startsWith("image/") ? (
                            <img
                              src={file.fileUrl || undefined}
                              className="w-full h-full object-cover"
                              alt=""
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
                            <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5">
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
                    onOpenChange={() => setPreviewFile(null)}
                  >
                    <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-1 gap-0">
                      <DialogHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2 overflow-hidden mr-8">
                          <div
                            className={cn(
                              "p-1.5 rounded-md bg-muted",
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
                        <div className="flex items-center gap-2 pr-8">
                          {previewFile?.fileUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-2"
                              onClick={() =>
                                window.open(previewFile.fileUrl, "_blank")
                              }
                            >
                              <ExternalLink className="w-4 h-4" />
                              Open in New Tab
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2"
                            onClick={() =>
                              previewFile && handleDownload(previewFile)
                            }
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      </DialogHeader>
                      <div className="flex-1 bg-muted/20 relative flex items-center justify-center overflow-hidden">
                        {previewFile && (
                          <>
                            {previewFile.fileType.startsWith("image/") ? (
                              <img
                                src={previewFile.fileUrl}
                                alt={previewFile.fileName}
                                className="max-w-full max-h-full object-contain"
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
                            ) : (
                              <div className="text-center p-8">
                                <File className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                                <p className="text-lg font-medium">
                                  No preview available for this file type
                                </p>
                                <p className="text-sm text-muted-foreground mb-4">
                                  You can still download or open it in a new tab
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
