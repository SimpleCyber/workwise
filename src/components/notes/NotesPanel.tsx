"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { notesOpenAtom } from "@/lib/panel-atoms";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

// Mini component for inputting a new list (inline)
const NewListInput = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState("");
  return (
    <div className="flex p-2 items-center gap-2 border-b border-border bg-muted/10">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onSubmit(name.trim());
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Enter list name"
        className="text-sm bg-transparent border-b border-primary outline-none flex-1 py-1"
      />
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={() => onCancel()}
      >
        <X className="w-3 h-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={() => name.trim() && onSubmit(name.trim())}
      >
        <Check className="w-3 h-3" />
      </Button>
    </div>
  );
};

export const DraggableNotesPanel = () => {
  const [open, setOpen] = useAtom(notesOpenAtom);
  const isMobile = useMobile();

  const lists = useQuery(api.personalNotes.getLists);
  const createList = useMutation(api.personalNotes.createList);

  const [activeListId, setActiveListId] = useState<string | "starred" | null>(
    null,
  );
  const [isCreatingList, setIsCreatingList] = useState(false);

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
          : { showCompleted: false }, // default fail-safe
    ) || [];

  const createTask = useMutation(api.personalNotes.create);
  const updateTask = useMutation(api.personalNotes.update);
  const removeTask = useMutation(api.personalNotes.remove);

  const [isAdding, setIsAdding] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addContent, setAddContent] = useState("");
  const [addDate, setAddDate] = useState("");

  const [showCompleted, setShowCompleted] = useState(false);

  const completedTasks = tasks.filter((t) => t.isCompleted);
  const activeTasks = tasks.filter((t) => !t.isCompleted);

  const handleCreateList = async (name: string) => {
    try {
      const newListId = await createList({ name });
      setActiveListId(newListId);
      setIsCreatingList(false);
    } catch {
      toast.error("Failed to create list");
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
        isStarred: activeListId === "starred" ? true : false,
        dueDate: addDate ? new Date(addDate).getTime() : undefined,
      });
      setAddTitle("");
      setAddContent("");
      setAddDate("");
      setIsAdding(false);
    } catch {
      toast.error("Failed to add task");
    }
  };

  const toggleComplete = async (id: any, isCompleted: boolean) => {
    try {
      await updateTask({ id, isCompleted });
    } catch {
      toast.error("Failed");
    }
  };

  const toggleStar = async (id: any, isStarred: boolean) => {
    try {
      await updateTask({ id, isStarred });
    } catch {
      toast.error("Failed");
    }
  };

  const currentListName =
    activeListId === "starred"
      ? "Starred"
      : lists?.find((l) => l._id === activeListId)?.name || "My Tasks";

  const renderTask = (item: any) => (
    <div
      key={item._id}
      className="relative group p-3 pr-8 hover:bg-muted/30 border-b border-border/40 transition-colors flex items-start gap-4"
    >
      <button
        onClick={() => toggleComplete(item._id, !item.isCompleted)}
        className="mt-0.5 shrink-0 transition-colors flex items-center justify-center p-1 -ml-1 rounded-full hover:bg-muted/50"
      >
        {item.isCompleted ? (
          <Check
            className="w-[18px] h-[18px] text-blue-600"
            strokeWidth={2.5}
          />
        ) : (
          <Circle
            className="w-[18px] h-[18px] text-muted-foreground hover:text-primary"
            strokeWidth={1.5}
          />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-[14px] font-[500] leading-snug ${item.isCompleted ? "line-through text-muted-foreground opacity-80" : "text-foreground"}`}
        >
          {item.title || item.content}
        </p>

        {!item.isCompleted && item.title && item.content && (
          <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2">
            {item.content}
          </p>
        )}

        {item.isCompleted ? (
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Completed: {format(item.updatedAt, "E d MMM")}
          </p>
        ) : item.dueDate ? (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 border border-border/80 rounded-full text-muted-foreground">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {format(item.dueDate, "d MMMM yyyy")}
            </div>
          </div>
        ) : null}
      </div>

      <div className="absolute right-3 top-3 flex flex-col items-center gap-2">
        {/* More option menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground outline-none data-[state=open]:opacity-100">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[160px] rounded-lg shadow-md border-border/50"
          >
            <DropdownMenuItem
              onClick={() => removeTask({ id: item._id })}
              className="text-red-600 focus:text-red-600 cursor-pointer text-[13px] py-1.5"
            >
              Delete task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Star icon (only for active tasks) */}
        {!item.isCompleted && (
          <button
            onClick={() => toggleStar(item._id, !item.isStarred)}
            className="p-1"
          >
            {item.isStarred ? (
              <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
            ) : (
              <Star
                className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
                strokeWidth={1.5}
              />
            )}
          </button>
        )}
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-3 pb-1 border-b border-border/50 flex flex-col no-drag shrink-0 relative bg-background">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase ml-1">
            Tasks
          </span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() => setOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center -mt-1 ml-1 pb-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 px-2 text-[20px] font-[400] text-foreground hover:bg-muted/50 -ml-1"
              >
                {currentListName}{" "}
                <ChevronDown className="w-4 h-4 opacity-50 ml-1 mt-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[240px] rounded-xl shadow-lg border-border/40 py-2"
            >
              <DropdownMenuItem
                className="py-2.5 px-4 rounded-none cursor-pointer"
                onClick={() => setActiveListId("starred")}
              >
                <Star
                  className="w-[18px] h-[18px] mr-3 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <span className="text-[14px]">Starred</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              {lists?.map((list) => (
                <DropdownMenuItem
                  key={list._id}
                  className="py-2.5 px-4 rounded-none cursor-pointer flex items-center justify-between"
                  onClick={() => setActiveListId(list._id)}
                >
                  <div className="flex items-center text-[14px]">
                    {list._id === activeListId ? (
                      <Check
                        className="w-[18px] h-[18px] mr-3 text-blue-600"
                        strokeWidth={2.5}
                      />
                    ) : (
                      <div className="w-[18px] mr-3" />
                    )}
                    <span
                      className={
                        list._id === activeListId
                          ? "text-blue-600 font-medium"
                          : ""
                      }
                    >
                      {list.name}
                    </span>
                  </div>
                  {/* Shows active tasks count optionally */}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                className="py-2.5 px-4 rounded-none cursor-pointer"
                onClick={() => setIsCreatingList(true)}
              >
                <ListPlus
                  className="w-[18px] h-[18px] mr-3 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <span className="text-[14px]">Create new list</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isCreatingList && (
          <NewListInput
            onSubmit={handleCreateList}
            onCancel={() => setIsCreatingList(false)}
          />
        )}
      </div>

      <ScrollArea className="flex-1 bg-background">
        <div className="p-0">
          {/* Add a task button */}
          <div className="border-b border-border/40 bg-background sticky top-0 z-10 p-1">
            {!isAdding ? (
              <Button
                variant="ghost"
                className="w-full justify-start py-5 px-3 rounded-full hover:bg-muted/40 text-blue-600 font-medium text-[14px]"
                onClick={() => setIsAdding(true)}
              >
                <Plus
                  className="w-[18px] h-[18px] mr-3 border border-current rounded-full p-0.5"
                  strokeWidth={2}
                />
                Add a task
                <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center text-muted-foreground">
                  <MoreVertical className="w-[18px] h-[18px]" />
                </div>
              </Button>
            ) : (
              <div className="flex flex-col gap-2 p-3 pb-4">
                <input
                  autoFocus
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="Title"
                  className="text-[14px] font-medium outline-none bg-transparent placeholder:text-muted-foreground/50"
                />
                <textarea
                  value={addContent}
                  onChange={(e) => setAddContent(e.target.value)}
                  placeholder="Details"
                  className="text-[13px] outline-none bg-transparent resize-none h-12"
                />
                <div className="flex items-center justify-between border-t border-border/50 pt-2">
                  <input
                    type="datetime-local"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    className="text-xs bg-muted/40 rounded-full px-3 py-1 cursor-pointer outline-none border border-border"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsAdding(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 font-medium"
                      onClick={handleAddTask}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Tasks list */}
          <div className="flex flex-col">{activeTasks.map(renderTask)}</div>

          {/* Completed Section matching Google Tasks */}
          {completedTasks.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 w-full px-4 py-3 hover:bg-muted/30 text-[13px] font-medium text-foreground border-t border-border/40"
              >
                <ChevronRight
                  className={`w-4 h-4 text-muted-foreground transition-transform ${showCompleted ? "rotate-90" : ""}`}
                />
                Completed ({completedTasks.length})
              </button>
              {showCompleted && (
                <div className="flex flex-col ml-1">
                  {completedTasks.map(renderTask)}
                </div>
              )}
            </div>
          )}

          {activeTasks.length === 0 &&
            completedTasks.length === 0 &&
            !isAdding && (
              <div className="flex flex-col items-center justify-center pt-24 pb-12 px-6 text-center text-muted-foreground">
                <div className="w-32 h-32 mb-6 bg-muted/20 rounded-full flex items-center justify-center opacity-80 shrink-0">
                  <Check
                    className="w-12 h-12 text-muted-foreground opacity-30"
                    strokeWidth={1}
                  />
                </div>
                <h3 className="text-sm font-medium mb-1">A fresh start</h3>
                <p className="text-[13px]">Anything to add?</p>
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
        <DrawerContent className="h-[90vh] p-0 rounded-t-[20px] overflow-hidden bg-background">
          {renderContent()}
        </DrawerContent>
      </Drawer>
    );
  }

  // Right sidebar presentation styling
  return (
    <Card className="h-full w-full bg-background border-l border-y-0 border-r-0 border-border flex flex-col rounded-none shadow-[0_0_15px_rgba(0,0,0,0.02)] overflow-hidden">
      <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
        {renderContent()}
      </CardContent>
    </Card>
  );
};
