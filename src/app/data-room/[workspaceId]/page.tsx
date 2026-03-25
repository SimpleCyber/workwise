"use client";

import type React from "react";
import { useState } from "react";
import { format } from "date-fns";
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
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { useGetWorkspaceMembers } from "@/features/projects/api/use-get-workspace-members";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";
import {
  useGetDataRoomFiles,
  useUploadDataRoomFile,
  useDeleteDataRoomFile,
  useUpdateFilePermissions,
} from "@/features/data-room/api/use-data-room";
import type { Id } from "../../../../convex/_generated/dataModel";

import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useConfirm } from "@/hooks/use-confirm";

interface DataRoomPageProps {
  workspaceId: Id<"workspaces">;
}

interface FileUploadData {
  file: File;
  comment: string;
  visibility: "public" | "private";
  allowedMembers: Id<"members">[];
}

const ITEMS_PER_PAGE = 12;

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) return ImageIcon;
  if (fileType === "application/pdf") return FileText;
  return File;
};

const getFileTypeColor = (fileType: string) => {
  if (fileType.startsWith("image/")) return "bg-green-100 text-green-800";
  if (fileType === "application/pdf") return "bg-red-100 text-red-800";
  if (fileType.includes("document") || fileType.includes("word"))
    return "bg-blue-100 text-blue-800";
  if (fileType.includes("spreadsheet") || fileType.includes("excel"))
    return "bg-emerald-100 text-emerald-800";
  return "bg-gray-100 text-gray-800";
};

const DataRoomWorkspacePage = () => {
  const workspaceId = useWorkspaceId();
  // State management
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    dateFilter,
    userFilter,
    fileTypeFilter,
  });
  const uploadFile = useUploadDataRoomFile();
  const deleteFile = useDeleteDataRoomFile();
  const updatePermissions = useUpdateFilePermissions();

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "This action cannot be undone.",
  );

  // Early return if workspaceId is not available
  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Workspace not found</h2>
          <p className="text-muted-foreground">
            Please check the URL and try again.
          </p>
        </div>
      </div>
    );
  }

  const files = filesData?.files || [];
  const totalPages = Math.ceil((filesData?.total || 0) / ITEMS_PER_PAGE);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadData.comment?.trim()) {
      toast.error("Please select a file and add a comment");
      return;
    }

    try {
      const uploadToast = toast.loading("Uploading file...");

      // Generate upload URL
      const url = await generateUploadUrl({}, { throwError: true });
      if (!url) throw new Error("Failed to get upload URL");

      // Upload file to storage
      const result = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!result.ok) throw new Error("Failed to upload file");

      const { storageId } = await result.json();

      // Save file metadata
      await uploadFile.mutate({
        workspaceId,
        storageId,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        comment: uploadData.comment!,
        visibility: uploadData.visibility!,
        allowedMembers: uploadData.allowedMembers!,
      });

      toast.dismiss(uploadToast);
      toast.success("File uploaded successfully!");

      // Reset form
      setSelectedFile(null);
      setUploadData({
        comment: "",
        visibility: "public",
        allowedMembers: [],
      });
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    }
  };

  const handleDownload = async (file: any) => {
    try {
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

  const handleDelete = async (fileId: Id<"dataRoomFiles">) => {
    const ok = await confirm();
    if (!ok) return;

    try {
      await deleteFile.mutate({ fileId });
      toast.success("File deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  return (
    <div className="flex h-full flex-col p-6 overflow-hidden">
      <ConfirmDialog />
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Data Room</h1>
          <p className="text-muted-foreground">
            Manage and share documents with your team
          </p>
        </div>
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* File Selection */}
              <div className="space-y-2">
                <Label>Select File</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to select a file or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, XLS, PPT, Images (Max 50MB)
                    </p>
                  </label>
                </div>
                {selectedFile && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <File className="w-4 h-4" />
                    <span className="text-sm">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(selectedFile.size)})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="ml-auto h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="What is this file about?"
                  value={uploadData.comment}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, comment: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {/* Visibility Settings */}
              <div className="space-y-4">
                <Label>Visibility</Label>
                <Tabs
                  value={uploadData.visibility}
                  onValueChange={(value: string) => {
                    if (value === "public" || value === "private") {
                      setUploadData({ ...uploadData, visibility: value });
                    }
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="public">Public</TabsTrigger>
                    <TabsTrigger value="private">Private</TabsTrigger>
                  </TabsList>
                  <TabsContent value="public" className="mt-4">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        All workspace members can view this file
                      </span>
                    </div>
                  </TabsContent>
                  <TabsContent value="private" className="mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                        <Users className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-orange-800">
                          Only selected members can view this file
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Label>Select Members</Label>
                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {members?.map((member) => (
                            <div
                              key={member._id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={member._id}
                                checked={uploadData.allowedMembers?.includes(
                                  member._id,
                                )}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setUploadData({
                                      ...uploadData,
                                      allowedMembers: [
                                        ...(uploadData.allowedMembers || []),
                                        member._id,
                                      ],
                                    });
                                  } else {
                                    setUploadData({
                                      ...uploadData,
                                      allowedMembers:
                                        uploadData.allowedMembers?.filter(
                                          (id) => id !== member._id,
                                        ),
                                    });
                                  }
                                }}
                              />
                              <label
                                htmlFor={member._id}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Avatar className="w-6 h-6">
                                  <AvatarImage
                                    src={
                                      member.user?.image || "/placeholder.svg"
                                    }
                                  />
                                  <AvatarFallback className="text-xs">
                                    {member.user?.name?.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">
                                  {member.user?.name}
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !uploadData.comment?.trim()}
                >
                  Upload File
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="flex-shrink-0">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search files, comments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            {/* User Filter */}
            <div className="space-y-2">
              <Label>Uploaded By</Label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {members?.map((member) => (
                    <SelectItem key={member._id} value={member._id}>
                      {member.user?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Type Filter */}
            <div className="space-y-2">
              <Label>File Type</Label>
              <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || dateFilter || userFilter || fileTypeFilter) && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setDateFilter("");
                  setUserFilter("");
                  setFileTypeFilter("");
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Files Grid */}
      <div className="flex-1 min-h-0 overflow-auto space-y-4 pr-1">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-32 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : files.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No files found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || dateFilter || userFilter || fileTypeFilter
                  ? "Try adjusting your search filters"
                  : "Upload your first document to get started"}
              </p>
              {!searchQuery &&
                !dateFilter &&
                !userFilter &&
                !fileTypeFilter && (
                  <Button onClick={() => setIsUploadModalOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map((file: any) => {
              const FileIcon = getFileIcon(file.fileType);
              return (
                <Card
                  key={file._id}
                  className="group hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    {/* File Preview */}
                    <div className="relative mb-4">
                      <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                        {file.fileType.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={file.fileUrl || "/placeholder.svg"}
                            alt={file.fileName}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <FileIcon className="w-12 h-12 text-muted-foreground" />
                        )}
                      </div>

                      {/* File Actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(file.fileUrl, "_blank")
                              }
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDownload(file)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(file._id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* File Type Badge */}
                      <Badge
                        className={`absolute bottom-2 left-2 text-xs ${getFileTypeColor(file.fileType)}`}
                      >
                        {file.fileType.split("/")[1]?.toUpperCase() || "FILE"}
                      </Badge>
                    </div>

                    {/* File Info */}
                    <div className="space-y-2">
                      <h4
                        className="font-medium text-sm truncate"
                        title={file.fileName}
                      >
                        {file.fileName}
                      </h4>
                      <p
                        className="text-xs text-muted-foreground line-clamp-2"
                        title={file.comment}
                      >
                        {file.comment}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <div className="flex items-center gap-1">
                          {file.visibility === "private" && (
                            <Badge variant="secondary" className="text-xs">
                              Private
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Uploader Info */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Avatar className="w-6 h-6">
                          <AvatarImage
                            src={
                              file.uploader?.user?.image || "/placeholder.svg"
                            }
                          />
                          <AvatarFallback className="text-xs">
                            {file.uploader?.user?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {file.uploader?.user?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(file.createdAt), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                {totalPages > 5 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataRoomWorkspacePage;
