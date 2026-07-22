"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { notesOpenAtom } from "@/lib/panel-atoms";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  X,
  ExternalLink,
  Star,
  Circle,
  ChevronDown,
  Check,
  Plus,
  MoreVertical,
  ListPlus,
  ChevronRight,
  Search,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  CheckCircle2,
  Tag,
  Sparkles,
  ArrowRight,
  FolderPlus,
  FolderKanban,
  CheckSquare,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isTomorrow, isPast, addDays } from "date-fns";
import { useMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

// Mini component for inputting a new list name
const NewListInput = ({
  initialValue = "",
  onSubmit,
  onCancel,
  placeholder = "Enter list name",
}: {
  initialValue?: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  placeholder?: string;
}) => {
  const [name, setName] = useState(initialValue);
  return (
    <div className="flex items-center gap-2 p-2 mx-3 my-2 border rounded-xl bg-muted/30 border-primary/30 shadow-sm animate-in fade-in zoom-in-95 duration-150">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onSubmit(name.trim());
          if (e.key === "Escape") onCancel();
        }}
        placeholder={placeholder}
        className="text-xs bg-transparent border-0 outline-none flex-1 py-1 font-medium text-foreground placeholder:text-muted-foreground/60"
      />
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 rounded-full hover:bg-muted text-muted-foreground"
        onClick={onCancel}
      >
        <X className="w-3.5 h-3.5" />
      </Button>
      <Button
        size="sm"
        className="h-6 px-2.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium shadow-xs"
        onClick={() => name.trim() && onSubmit(name.trim())}
      >
        Save
      </Button>
    </div>
  );
};

export const DraggableNotesPanel = () => {
  const [open, setOpen] = useAtom(notesOpenAtom);
  const isMobile = useMobile();

  const lists = useQuery(api.personalNotes.getLists);
  const createList = useMutation(api.personalNotes.createList);
  const renameList = useMutation(api.personalNotes.renameList);
  const deleteList = useMutation(api.personalNotes.deleteList);

  const [activeListId, setActiveListId] = useState<string | "starred" | null>(
    null,
  );
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "starred" | "completed"
  >("all");

  // Set default list if none selected
  useEffect(() => {
    if (!activeListId && lists && lists.length > 0) {
      setActiveListId(lists[0]._id);
    }
  }, [lists, activeListId]);

  const tasks =
    useQuery(
      api.personalNotes.get,
      activeListId === "starred"
        ? { isStarred: true }
        : activeListId
          ? { listId: activeListId as any }
          : {},
    ) || [];

  const createTask = useMutation(api.personalNotes.create);
  const updateTask = useMutation(api.personalNotes.update);
  const removeTask = useMutation(api.personalNotes.remove);

  // Add Task Form State
  const [isAdding, setIsAdding] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addContent, setAddContent] = useState("");
  const [addDate, setAddDate] = useState("");
  const [addIsStarred, setAddIsStarred] = useState(false);

  // Inline Edit State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");

  const [showCompleted, setShowCompleted] = useState(true);

  // Filter tasks based on search & tab
  const filteredTasks = tasks.filter((t) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchContent = t.content?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }

    // Tab filter
    if (activeTab === "active") return !t.isCompleted;
    if (activeTab === "starred") return !!t.isStarred;
    if (activeTab === "completed") return !!t.isCompleted;
    return true;
  });

  const completedTasks = filteredTasks.filter((t) => t.isCompleted);
  const activeTasks = filteredTasks.filter((t) => !t.isCompleted);

  const handleCreateList = async (name: string) => {
    try {
      const newListId = await createList({ name });
      setActiveListId(newListId);
      setIsCreatingList(false);
      toast.success("List created");
    } catch {
      toast.error("Failed to create list");
    }
  };

  const handleRenameList = async (listId: string, newName: string) => {
    try {
      await renameList({
        id: listId as Id<"personalTaskLists">,
        name: newName,
      });
      setEditingListId(null);
      toast.success("List renamed");
    } catch {
      toast.error("Failed to rename list");
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await deleteList({ id: listId as Id<"personalTaskLists"> });
      if (activeListId === listId) {
        const nextList = lists?.find((l) => l._id !== listId);
        setActiveListId(nextList ? nextList._id : null);
      }
      toast.success("List deleted");
    } catch {
      toast.error("Failed to delete list");
    }
  };

  const handleAddTask = async () => {
    if (!addTitle.trim() && !addContent.trim()) {
      setIsAdding(false);
      return;
    }
    try {
      await createTask({
        listId:
          activeListId !== "starred" && activeListId
            ? (activeListId as any)
            : undefined,
        title: addTitle.trim() || undefined,
        content: addContent.trim() || undefined,
        isStarred: activeListId === "starred" || addIsStarred,
        dueDate: addDate ? new Date(addDate).getTime() : undefined,
      });
      setAddTitle("");
      setAddContent("");
      setAddDate("");
      setAddIsStarred(false);
      setIsAdding(false);
      toast.success("Task added");
    } catch {
      toast.error("Failed to add task");
    }
  };

  const startEditTask = (task: any) => {
    setEditingTaskId(task._id);
    setEditTitle(task.title || "");
    setEditContent(task.content || "");
    setEditDate(
      task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : "",
    );
  };

  const handleSaveTaskEdit = async (taskId: any) => {
    try {
      await updateTask({
        id: taskId,
        title: editTitle.trim() || undefined,
        content: editContent.trim() || undefined,
        dueDate: editDate ? new Date(editDate).getTime() : null,
      });
      setEditingTaskId(null);
      toast.success("Task updated");
    } catch {
      toast.error("Failed to update task");
    }
  };

  const toggleComplete = async (id: any, isCompleted: boolean) => {
    try {
      await updateTask({ id, isCompleted });
    } catch {
      toast.error("Failed to update status");
    }
  };

  const toggleStar = async (id: any, isStarred: boolean) => {
    try {
      await updateTask({ id, isStarred });
    } catch {
      toast.error("Failed to star task");
    }
  };

  const currentList = lists?.find((l) => l._id === activeListId);
  const currentListName =
    activeListId === "starred"
      ? "Starred Tasks"
      : currentList?.name || "My Tasks";

  // Date helper badges
  const renderDateBadge = (dueDateTimestamp: number) => {
    const date = new Date(dueDateTimestamp);
    const today = isToday(date);
    const tomorrow = isTomorrow(date);
    const overdue = isPast(date) && !today;

    let badgeClass = "text-muted-foreground bg-muted/50 border-border/60";
    let icon = <Clock className="w-3 h-3" />;
    let label = format(date, "d MMM yyyy");

    if (overdue) {
      badgeClass =
        "text-destructive bg-destructive/10 border-destructive/20 font-medium";
      icon = <AlertCircle className="w-3 h-3 text-destructive" />;
      label = `Overdue (${format(date, "d MMM")})`;
    } else if (today) {
      badgeClass =
        "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 font-medium";
      icon = <Calendar className="w-3 h-3 text-amber-500" />;
      label = "Today";
    } else if (tomorrow) {
      badgeClass =
        "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20 font-medium";
      icon = <Calendar className="w-3 h-3 text-blue-500" />;
      label = "Tomorrow";
    }

    return (
      <div
        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 border rounded-full transition-colors ${badgeClass}`}
      >
        {icon}
        <span>{label}</span>
      </div>
    );
  };

  const renderTask = (item: any) => {
    const isEditingThis = editingTaskId === item._id;

    if (isEditingThis) {
      return (
        <div
          key={item._id}
          className="p-3 border-b border-border/60 bg-muted/20 space-y-2.5 animate-in fade-in duration-150"
        >
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title"
            className="w-full text-xs font-semibold bg-transparent outline-none border-b border-primary/40 pb-1 text-foreground placeholder:text-muted-foreground/50"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Details / Description"
            className="w-full text-xs bg-transparent outline-none resize-none h-14 text-muted-foreground placeholder:text-muted-foreground/50"
          />
          <div className="flex items-center justify-between pt-1">
            <input
              type="datetime-local"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="text-[11px] bg-background border border-border rounded-lg px-2 py-1 outline-none text-muted-foreground"
            />
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-2.5 text-muted-foreground"
                onClick={() => setEditingTaskId(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs px-3 bg-primary text-primary-foreground rounded-lg font-medium shadow-xs"
                onClick={() => handleSaveTaskEdit(item._id)}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={item._id}
        className="group relative p-3 border-b border-border/40 hover:bg-muted/30 transition-all duration-150 flex items-start gap-3"
      >
        {/* Toggle Checkbox */}
        <button
          onClick={() => toggleComplete(item._id, !item.isCompleted)}
          className="mt-0.5 shrink-0 transition-transform active:scale-95 flex items-center justify-center p-0.5 rounded-full hover:bg-muted/60 text-muted-foreground hover:text-primary outline-none"
          title={item.isCompleted ? "Mark incomplete" : "Mark complete"}
        >
          {item.isCompleted ? (
            <CheckCircle2
              className="w-[19px] h-[19px] text-blue-600 dark:text-blue-400 fill-blue-500/10"
              strokeWidth={2.2}
            />
          ) : (
            <Circle
              className="w-[19px] h-[19px] text-muted-foreground/70 group-hover:text-primary transition-colors"
              strokeWidth={1.5}
            />
          )}
        </button>

        {/* Content Area */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => !item.isCompleted && startEditTask(item)}
        >
          <p
            className={`text-xs font-medium leading-relaxed break-words ${
              item.isCompleted
                ? "line-through text-muted-foreground/70 opacity-75"
                : "text-foreground group-hover:text-primary transition-colors"
            }`}
          >
            {item.title || item.content}
          </p>

          {!item.isCompleted && item.title && item.content && (
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
              {item.content}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1.5">
            {item.isCompleted ? (
              <span className="text-[10px] text-muted-foreground/60">
                Completed {format(item.updatedAt, "MMM d, h:mm a")}
              </span>
            ) : item.dueDate ? (
              renderDateBadge(item.dueDate)
            ) : null}
          </div>
        </div>

        {/* Right Actions & Star */}
        <div className="flex items-center gap-1 shrink-0">
          {!item.isCompleted && (
            <button
              onClick={() => toggleStar(item._id, !item.isStarred)}
              className="p-1 rounded-full hover:bg-muted/60 transition-colors"
              title={item.isStarred ? "Unstar" : "Star"}
            >
              {item.isStarred ? (
                <Star className="w-4 h-4 text-amber-500 fill-amber-500 animate-in zoom-in-50 duration-150" />
              ) : (
                <Star
                  className="w-4 h-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-amber-500 transition-all"
                  strokeWidth={1.5}
                />
              )}
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-full hover:bg-muted/60 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity outline-none">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 rounded-xl shadow-lg border-border/50"
            >
              <DropdownMenuItem
                onClick={() => startEditTask(item)}
                className="text-xs cursor-pointer gap-2 py-2"
              >
                <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Edit details</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => removeTask({ id: item._id })}
                className="text-xs text-destructive focus:text-destructive cursor-pointer gap-2 py-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete task</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const renderContent = () => (
    <div className="flex flex-col h-full bg-background border-0">
      {/* Top Header */}
      <div className="p-3 pb-2 border-b border-border/50 flex flex-col no-drag shrink-0 relative bg-muted/10">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-lg bg-primary/10 text-primary">
              <CheckSquare className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Notes & Tasks
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-full transition-colors ${isSearchOpen ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) setSearchQuery("");
              }}
              title="Search tasks"
            >
              <Search className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
              title="Close panel"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* List Title Dropdown & Management */}
        {editingListId ? (
          <NewListInput
            initialValue={currentList?.name}
            onSubmit={(name) => handleRenameList(editingListId, name)}
            onCancel={() => setEditingListId(null)}
            placeholder="Rename list"
          />
        ) : (
          <div className="flex items-center justify-between mt-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 px-2 text-base font-semibold text-foreground hover:bg-muted/50 -ml-1 rounded-lg flex items-center gap-1.5"
                >
                  <span className="truncate max-w-[170px]">
                    {currentListName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-60 rounded-xl shadow-xl border-border/50 py-1.5"
              >
                {/* Starred item */}
                <DropdownMenuItem
                  className={`py-2 px-3 rounded-lg cursor-pointer flex items-center justify-between text-xs mx-1 ${
                    activeListId === "starred"
                      ? "bg-primary/10 text-primary font-medium"
                      : ""
                  }`}
                  onClick={() => setActiveListId("starred")}
                >
                  <div className="flex items-center gap-2.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Starred Tasks</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                {/* Lists list */}
                {lists?.map((list) => (
                  <DropdownMenuItem
                    key={list._id}
                    className={`py-2 px-3 rounded-lg cursor-pointer flex items-center justify-between text-xs mx-1 group ${
                      list._id === activeListId
                        ? "bg-primary/10 text-primary font-medium"
                        : ""
                    }`}
                    onClick={() => setActiveListId(list._id)}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {list._id === activeListId ? (
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      ) : (
                        <FolderKanban className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="truncate">{list.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {list.activeCount !== undefined &&
                        list.activeCount > 0 && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground font-semibold">
                            {list.activeCount}
                          </span>
                        )}
                    </div>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  className="py-2 px-3 rounded-lg cursor-pointer flex items-center gap-2.5 text-xs text-primary font-medium mx-1"
                  onClick={() => setIsCreatingList(true)}
                >
                  <ListPlus className="w-4 h-4" />
                  <span>Create new list</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* List Option Menu (Rename / Delete active custom list) */}
            {activeListId && activeListId !== "starred" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-muted-foreground"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-40 rounded-xl shadow-lg border-border/50"
                >
                  <DropdownMenuItem
                    onClick={() =>
                      currentList && setEditingListId(currentList._id)
                    }
                    className="text-xs cursor-pointer gap-2 py-2"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Rename list</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      currentList && handleDeleteList(currentList._id)
                    }
                    className="text-xs text-destructive focus:text-destructive cursor-pointer gap-2 py-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete list</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {isCreatingList && (
          <NewListInput
            onSubmit={handleCreateList}
            onCancel={() => setIsCreatingList(false)}
            placeholder="New list name..."
          />
        )}

        {/* Collapsible Search Input */}
        {isSearchOpen && (
          <div className="mt-2 relative animate-in fade-in slide-in-from-top-1 duration-150">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in notes & tasks..."
              className="w-full text-xs bg-background border border-border rounded-xl pl-8 pr-8 py-1.5 outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/60 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Tabs Filter Bar */}
        <div className="flex items-center gap-1 mt-2.5 pt-1 overflow-x-auto no-scrollbar">
          {(["all", "active", "starred", "completed"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg capitalize transition-all shrink-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="flex-1 bg-background">
        <div className="p-0">
          {/* Quick Add Button / Expanded Creator */}
          <div className="border-b border-border/40 bg-background sticky top-0 z-10 p-2">
            {!isAdding ? (
              <Button
                variant="ghost"
                className="w-full justify-start py-2.5 px-3 rounded-xl bg-muted/20 hover:bg-muted/50 text-primary font-medium text-xs border border-dashed border-border/80 hover:border-primary/40 transition-all gap-2 group"
                onClick={() => setIsAdding(true)}
              >
                <div className="p-1 rounded-md bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </div>
                <span>Add a task or note...</span>
              </Button>
            ) : (
              <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-muted/30 border border-primary/20 shadow-sm animate-in fade-in zoom-in-98 duration-150">
                <input
                  autoFocus
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="Task title"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && addTitle.trim()) {
                      e.preventDefault();
                      handleAddTask();
                    }
                  }}
                  className="text-xs font-semibold outline-none bg-transparent placeholder:text-muted-foreground/50 text-foreground"
                />
                <textarea
                  value={addContent}
                  onChange={(e) => setAddContent(e.target.value)}
                  placeholder="Details / Description (optional)"
                  className="text-xs outline-none bg-transparent resize-none h-14 text-muted-foreground placeholder:text-muted-foreground/50"
                />

                {/* Preset Date Buttons & Star Toggle */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground font-medium mr-1">
                    Due:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAddDate(new Date().toISOString().slice(0, 16))
                    }
                    className="text-[10px] px-2 py-0.5 rounded-md bg-background border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAddDate(
                        addDays(new Date(), 1).toISOString().slice(0, 16),
                      )
                    }
                    className="text-[10px] px-2 py-0.5 rounded-md bg-background border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAddDate(
                        addDays(new Date(), 7).toISOString().slice(0, 16),
                      )
                    }
                    className="text-[10px] px-2 py-0.5 rounded-md bg-background border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Next Week
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddIsStarred(!addIsStarred)}
                    className={`ml-auto p-1 rounded-md transition-colors ${
                      addIsStarred
                        ? "bg-amber-500/10 text-amber-500"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    title="Star task"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${addIsStarred ? "fill-amber-500" : ""}`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <input
                    type="datetime-local"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    className="text-[10px] bg-background rounded-lg px-2 py-1 outline-none border border-border text-muted-foreground"
                  />
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2.5 text-muted-foreground"
                      onClick={() => setIsAdding(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs px-3 bg-primary text-primary-foreground rounded-lg font-medium shadow-xs"
                      onClick={handleAddTask}
                    >
                      Save Task
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Tasks List */}
          <div className="flex flex-col">{activeTasks.map(renderTask)}</div>

          {/* Completed Section Accordion */}
          {completedTasks.length > 0 && activeTab !== "active" && (
            <div className="mt-1">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-muted/30 text-xs font-semibold text-muted-foreground border-t border-border/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${showCompleted ? "rotate-90" : ""}`}
                  />
                  <span>Completed</span>
                </div>
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-medium">
                  {completedTasks.length}
                </span>
              </button>
              {showCompleted && (
                <div className="flex flex-col animate-in fade-in duration-150">
                  {completedTasks.map(renderTask)}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {filteredTasks.length === 0 && !isAdding && (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-muted-foreground animate-in fade-in duration-200">
              <div className="w-16 h-16 mb-4 bg-primary/5 dark:bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 text-primary/40">
                <CheckSquare className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="text-xs font-semibold text-foreground mb-1">
                {searchQuery ? "No matching tasks found" : "All caught up!"}
              </h3>
              <p className="text-[11px] text-muted-foreground/70 max-w-[200px] mb-4">
                {searchQuery
                  ? "Try searching for another keyword"
                  : "Add your first task or note to keep track of your work."}
              </p>
              {!searchQuery && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs px-3 rounded-lg border-primary/20 text-primary hover:bg-primary/5"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add a task
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  if (!open) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="h-[90vh] p-0 rounded-t-[24px] overflow-hidden bg-background">
          {renderContent()}
        </DrawerContent>
      </Drawer>
    );
  }

  // Right sidebar presentation styling
  return (
    <Card className="h-full w-full bg-background border-l border-y-0 border-r-0 border-border flex flex-col rounded-none shadow-xs overflow-hidden">
      <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
        {renderContent()}
      </CardContent>
    </Card>
  );
};
