"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Clock,
  ChevronDown,
  ChevronRight,
  Archive,
  Clock3,
  BrainCircuit,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
// Header functionality moved to consolidated header
import ChatPane from "./ChatPanel";
import SearchModal from "./SearchModal";
import { useGetProjectTasks } from "../../api/use-get-project-tasks";
import { useCreateProjectTask } from "../../api/use-create-project-task";
import { ProjectTaskDetailModal } from "../project-task-detail-modal";
import { useGetProjectChats } from "../../api/use-get-project-chats";
import { useGetProjectChatMessages } from "../../api/use-get-project-chat-messages";
import { useCreateProjectChat } from "../../api/use-create-project-chat";
import { useAppendProjectMessage } from "../../api/use-append-project-message";
import { useRenameProjectChat } from "../../api/use-rename-project-chat";
import { useTogglePinProjectChat } from "../../api/use-toggle-pin-project-chat";
import { useDeleteProjectChat } from "../../api/use-delete-project-chat";
import { useDeleteMessagesFrom } from "../../api/use-delete-project-messages-from";
import { useGetProjectHooks } from "../../api/use-get-project-hooks";
import {
  useToggleProjectHook,
  useSetProjectHookSelected,
} from "../../api/use-toggle-project-hook";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { sortChatsByUpdatedAt } from "./utils";
import type {
  ChatPaneHandle,
  UIConversation,
  UIMessage,
  // TaskAttachment,
  ChatSendPayload,
} from "./types";

type Props = {
  workspaceId: Id<"workspaces">;
  boardId: Id<"projectBoards">;
  currentUserId: Id<"users">;
  currentUser?: { name?: string; email?: string; image?: string };
  className?: string;
  projectDetails?: any[];
  lists?: Array<{
    _id: Id<"projectLists">;
    name: string;
    position: number;
    boardId: Id<"projectBoards">;
    memberId: Id<"members">;
    workspaceId: Id<"workspaces">;
    isArchived?: boolean;
    createdAt: number;
    updatedAt: number;
  }>;
  selectedMemberIds?: Id<"members">[];
};

export default function CompactAIAssistantUI({
  workspaceId,
  boardId,
  currentUserId,
  currentUser,
  className = "",
  projectDetails = [],
  lists = [],
  selectedMemberIds = [],
}: Props) {
  const [selectedId, setSelectedId] = useState<Id<"projectChats"> | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [collapsed, setCollapsed] = useState({ pinned: true, recent: true });
  const [kanbanCollapsed, setKanbanCollapsed] = useState({
    todo: true,
    inProgress: true,
  });
  const [model, setModel] = useState("gpt-4o");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const { mutate: createTask, isPending: isCreatingTask } =
    useCreateProjectTask();
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [addingTaskToList, setAddingTaskToList] =
    useState<Id<"projectLists"> | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleCreateQuickTask = async (listId: Id<"projectLists">) => {
    if (!newTaskTitle.trim()) return;
    try {
      await createTask({ title: newTaskTitle.trim(), listId });
      setNewTaskTitle("");
      setAddingTaskToList(null);
    } catch (e) {
      console.error(e);
    }
  };

  const { chats, isLoading: loadingChats } = useGetProjectChats(boardId);
  const { messages, isLoading: loadingMsgs } = useGetProjectChatMessages(
    selectedId as any,
  );
  const { createChat } = useCreateProjectChat();
  const { appendMessage } = useAppendProjectMessage();
  const { renameChat } = useRenameProjectChat();
  const { togglePin } = useTogglePinProjectChat();
  const { deleteChat } = useDeleteProjectChat();
  const { deleteFrom } = useDeleteMessagesFrom();
  const { hooks } = useGetProjectHooks(selectedId as any);
  const { toggleHook } = useToggleProjectHook();
  const { setHookSelected } = useSetProjectHookSelected();

  const [isThinking, setIsThinking] = useState(false);
  const [thinkingConvId, setThinkingConvId] = useState<string | null>(null);

  const composerRef = useRef<ChatPaneHandle | null>(null);

  // Get tasks for kanban elements
  const todoList = lists.find(
    (list) =>
      list.name.toLowerCase().includes("todo") ||
      list.name.toLowerCase().includes("to do"),
  );
  const inProgressList = lists.find(
    (list) =>
      list.name.toLowerCase().includes("progress") ||
      list.name.toLowerCase().includes("doing"),
  );

  const { data: todoTasks } = useGetProjectTasks({
    listId: todoList?._id!,
    assignedToIds: selectedMemberIds.length > 0 ? selectedMemberIds : undefined,
  });

  const { data: inProgressTasks } = useGetProjectTasks({
    listId: inProgressList?._id!,
    assignedToIds: selectedMemberIds.length > 0 ? selectedMemberIds : undefined,
  });

  useEffect(() => {
    if (!selectedId && chats.length > 0) {
      setSelectedId(chats[0].id);
    }
  }, [chats, selectedId]);

  useEffect(() => {
    function onTaskDragStart(ev: any) {
      const detail = ev?.detail;
      const candidate =
        detail?.task ??
        (detail?.type === "project-task" ? detail.task : detail);
      if (candidate) {
        (window as any).__lastDraggedTask = candidate;
      }
    }
    window.addEventListener("kanban:task-drag-start", onTaskDragStart);
    return () =>
      window.removeEventListener("kanban:task-drag-start", onTaskDragStart);
  }, []);

  // useEffect(() => {
  //   function onTaskDropToChat(e: any) {
  //     const incoming = (e?.detail?.task ??
  //       (e?.detail?.type === "project-task"
  //         ? e.detail.task
  //         : e.detail)) as TaskAttachment | null;

  //     if (incoming && composerRef.current) {
  //       // TODO: Implement task attachment when ChatPaneHandle supports it
  //       // composerRef.current.attachTask(incoming);
  //       console.log("Task dropped to chat:", incoming);
  //     }
  //   }
  //   window.addEventListener("kanban:task-drop-to-chat", onTaskDropToChat);
  //   return () =>
  //     window.removeEventListener("kanban:task-drop-to-chat", onTaskDropToChat);
  // }, []);

  const createNewChat = async () => {
    try {
      const newChatId = await createChat({
        workspaceId,
        boardId,
        title: "New chat",
        createdBy: currentUserId,
      });
      setSelectedId(newChatId);
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  const onSend = async (payload: ChatSendPayload) => {
    const content = payload.text || "";

    if (!selectedId) {
      const newChatId = await createChat({
        workspaceId,
        boardId,
        title: "New chat",
        createdBy: currentUserId,
      });
      setSelectedId(newChatId);

      setIsThinking(true);
      setThinkingConvId(newChatId as any);

      await appendMessage({
        chatId: newChatId,
        role: "user",
        content,
        userId: currentUserId,
      });

      setIsThinking(false);
      setThinkingConvId(null);
    } else {
      setIsThinking(true);
      setThinkingConvId(selectedId as any);

      await appendMessage({
        chatId: selectedId,
        role: "user",
        content,
        userId: currentUserId,
      });

      setIsThinking(false);
      setThinkingConvId(null);
    }
  };

  const onEditMessage = async (messageId: string, newContent: string) => {
    // Implementation for editing messages
    console.log("Edit message:", messageId, newContent);
  };

  const onDeleteFrom = async (messageId: string) => {
    if (!selectedId) return;
    await deleteFrom({
      chatId: selectedId,
      fromMessageId: messageId as any,
    });
  };

  const onRegenerateMessage = async (message: UIMessage) => {
    console.log("Regenerate message:", message);
  };

  const pauseThinking = () => {
    setIsThinking(false);
    setThinkingConvId(null);
  };

  const onRename = async (id: string, title: string) => {
    await renameChat(id as any, title);
  };

  const onDelete = async (id: string) => {
    await deleteChat(id as any);
    if (selectedId === id) {
      setSelectedId(chats.length > 1 ? chats[0].id : null);
    }
  };

  const mappedChats: UIConversation[] = useMemo(() => {
    return chats.map((c: any) => ({
      id: c.id,
      title: c.title ?? "Chat",
      updatedAt: new Date(c.updatedAt ?? Date.now()).toISOString(),
      preview: c.preview ?? "Ask anything...",
      pinned: c.pinned ?? false,
      messages: c.messages ?? [],
    }));
  }, [chats]);

  const pinned = sortChatsByUpdatedAt(mappedChats.filter((c) => c.pinned));
  const recent = sortChatsByUpdatedAt(mappedChats.filter((c) => !c.pinned));

  const selectedHookMessageIds = useMemo(() => {
    const set = new Set<string>();
    for (const h of hooks || []) {
      if (h.selected && h.messageId) set.add(h.messageId as any);
    }
    return set;
  }, [hooks]);

  const selectedChatId = selectedId as any;
  const selected: UIConversation | null = selectedChatId
    ? {
        id: selectedChatId as any,
        title:
          mappedChats.find((c: any) => c.id === selectedId)?.title ?? "Chat",
        updatedAt:
          mappedChats.find((c: any) => c.id === selectedId)?.updatedAt ??
          new Date().toISOString(),
        messages: messages as any,
        preview:
          ((messages &&
            (messages as any[])[(messages as any[]).length - 1]
              ?.content) as string) ?? "Ask anything…",
        pinned:
          mappedChats.find((c: any) => c.id === selectedId)?.pinned ?? false,
      }
    : null;

  const missingIds = !workspaceId || !boardId || !currentUserId;

  return (
    <div className={"h-full w-full bg-background text-foreground " + className}>
      <div className="flex h-full w-full overflow-hidden">
        {missingIds ? (
          <div className="grid flex-1 place-items-center text-sm text-zinc-500">
            Preparing your board chat…
          </div>
        ) : (
          <main className="relative flex min-w-0 flex-1 flex-col">
            {/* Consolidated Header with Chat Controls and Kanban Elements */}
            <div className="border-b border-border bg-card px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                {/* Left side - Chat Controls */}
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={createNewChat}
                          className="h-8 w-8 p-0 hover:bg-muted rounded-lg transition-all"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>New chat</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSearchModal(true)}
                          className="h-8 w-8 p-0 hover:bg-muted rounded-lg transition-all"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Search chats</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs hover:bg-muted rounded-lg transition-all"
                          onClick={() =>
                            setCollapsed((prev) => ({
                              ...prev,
                              recent: !prev.recent,
                            }))
                          }
                        >
                          <Clock className="h-3 w-3 mr-1.5" />
                          Recent
                          {collapsed.recent ? (
                            <ChevronRight className="h-3 w-3 ml-1.5" />
                          ) : (
                            <ChevronDown className="h-3 w-3 ml-1.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Recent chats</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Center - GPT Model Dropdown */}
                <div className="flex items-center">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                      className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted hover:border-primary/20 focus:outline-none transition-all shadow-sm"
                    >
                      <BrainCircuit className="h-3.5 w-3.5 text-foreground" />
                      <span className="text-foreground">
                        {model === "gpt-4o"
                          ? "GPT-4o"
                          : model === "gpt-4o-mini"
                            ? "GPT-4o mini"
                            : "GPT-4.1"}
                      </span>
                      <ChevronDown className="h-3 w-3 text-slate-500" />
                    </button>
                    {modelDropdownOpen && (
                      <>
                        <div className="absolute z-[90] mt-2 w-36 overflow-hidden rounded-lg border border-border bg-popover p-1.5 shadow-xl">
                          {[
                            { id: "gpt-4o", name: "GPT-4o" },
                            { id: "gpt-4o-mini", name: "GPT-4o mini" },
                            { id: "gpt-4.1", name: "GPT-4.1" },
                          ].map((m) => (
                            <button
                              key={m.id}
                              onClick={() => {
                                setModel(m.id);
                                setModelDropdownOpen(false);
                              }}
                              className="block w-full rounded-md px-3 py-1.5 text-left text-xs font-medium hover:bg-accent transition-colors"
                            >
                              {m.name}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setModelDropdownOpen(false)}
                          className="fixed inset-0 z-[80] cursor-default"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Right - Kanban Elements */}
                <div className="flex items-center gap-2">
                  {/* To Do List */}
                  {todoList && (
                    <Collapsible
                      open={!kanbanCollapsed.todo}
                      onOpenChange={(open) =>
                        setKanbanCollapsed((prev) => ({ ...prev, todo: !open }))
                      }
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs font-medium border-2 hover:bg-muted rounded-lg transition-all shadow-sm"
                        >
                          <Archive className="h-3.5 w-3.5 mr-1.5" />
                          To Do ({todoTasks?.length || 0})
                          {kanbanCollapsed.todo ? (
                            <ChevronRight className="h-3 w-3 ml-1.5" />
                          ) : (
                            <ChevronDown className="h-3 w-3 ml-1.5" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="absolute z-[80] mt-1 w-64 bg-background border border-border rounded-lg shadow-xl p-2 right-0">
                        <div className="min-h-20 max-h-64 overflow-y-auto space-y-1">
                          {/* Add Task Form */}
                          {addingTaskToList === todoList._id ? (
                            <div className="space-y-2 p-2 bg-muted/30 rounded-md border border-border">
                              <Input
                                value={newTaskTitle}
                                onChange={(e) =>
                                  setNewTaskTitle(e.target.value)
                                }
                                placeholder="Enter task title..."
                                className="h-8 text-xs"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleCreateQuickTask(todoList!._id);
                                  } else if (e.key === "Escape") {
                                    setAddingTaskToList(null);
                                    setNewTaskTitle("");
                                  }
                                }}
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleCreateQuickTask(todoList!._id)
                                  }
                                  disabled={
                                    isCreatingTask || !newTaskTitle.trim()
                                  }
                                  className="h-6 text-xs flex-1"
                                >
                                  Add
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setAddingTaskToList(null);
                                    setNewTaskTitle("");
                                  }}
                                  className="h-6 text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAddingTaskToList(todoList!._id)}
                              className="w-full justify-start h-8 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-dashed border border-gray-300 rounded-md transition-colors"
                            >
                              <Plus className="h-3 w-3 mr-2" />
                              Add task to To Do
                            </Button>
                          )}

                          {todoTasks?.slice(0, 10).map((task) => (
                            <div
                              key={task._id}
                              className="p-2 text-xs bg-muted/30 rounded-md border border-border cursor-pointer hover:bg-muted/50 transition-all"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsTaskModalOpen(true);
                              }}
                              draggable
                              onDragStart={(e) => {
                                const taskData = {
                                  taskId: task._id,
                                  title: task.title,
                                  description: task.description,
                                  priority: task.priority,
                                  dueDate: task.dueDate,
                                };
                                e.dataTransfer.setData(
                                  "application/json",
                                  JSON.stringify({
                                    type: "project-task",
                                    task: taskData,
                                  }),
                                );
                                (window as any).__lastDraggedTask = taskData;
                                window.dispatchEvent(
                                  new CustomEvent("kanban:task-drag-start", {
                                    detail: {
                                      type: "project-task",
                                      task: taskData,
                                    },
                                  }),
                                );
                              }}
                            >
                              <div className="font-medium truncate">
                                {task.title}
                              </div>
                              <div className="text-gray-500 truncate">
                                {task.taskCode}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* In Progress List */}
                  {inProgressList && (
                    <Collapsible
                      open={!kanbanCollapsed.inProgress}
                      onOpenChange={(open) =>
                        setKanbanCollapsed((prev) => ({
                          ...prev,
                          inProgress: !open,
                        }))
                      }
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs font-medium border-2 hover:bg-slate-50 rounded-lg transition-all shadow-sm"
                        >
                          <Clock3 className="h-3.5 w-3.5 mr-1.5" />
                          In Progress ({inProgressTasks?.length || 0})
                          {kanbanCollapsed.inProgress ? (
                            <ChevronRight className="h-3 w-3 ml-1.5" />
                          ) : (
                            <ChevronDown className="h-3 w-3 ml-1.5" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="absolute z-[80] mt-1 w-64 bg-background border border-border rounded-lg shadow-xl p-2 right-0">
                        <div className="min-h-20 max-h-64 overflow-y-auto space-y-1">
                          {/* Add Task Form */}
                          {addingTaskToList === inProgressList._id ? (
                            <div className="space-y-2 p-2 bg-blue-500/10 rounded-md border border-blue-500/20">
                              <Input
                                value={newTaskTitle}
                                onChange={(e) =>
                                  setNewTaskTitle(e.target.value)
                                }
                                placeholder="Enter task title..."
                                className="h-8 text-xs"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleCreateQuickTask(inProgressList!._id);
                                  } else if (e.key === "Escape") {
                                    setAddingTaskToList(null);
                                    setNewTaskTitle("");
                                  }
                                }}
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleCreateQuickTask(inProgressList!._id)
                                  }
                                  disabled={
                                    isCreatingTask || !newTaskTitle.trim()
                                  }
                                  className="h-6 text-xs flex-1"
                                >
                                  Add
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setAddingTaskToList(null);
                                    setNewTaskTitle("");
                                  }}
                                  className="h-6 text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setAddingTaskToList(inProgressList!._id)
                              }
                              className="w-full justify-start h-8 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-blue-500/10 border-dashed border border-blue-500/20 rounded-md transition-colors"
                            >
                              <Plus className="h-3 w-3 mr-2" />
                              Add task to In Progress
                            </Button>
                          )}

                          {inProgressTasks?.slice(0, 10).map((task) => (
                            <div
                              key={task._id}
                              className="p-2 text-xs bg-blue-500/10 rounded-md border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 hover:border-blue-500/30 transition-all"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsTaskModalOpen(true);
                              }}
                              draggable
                              onDragStart={(e) => {
                                const taskData = {
                                  taskId: task._id,
                                  title: task.title,
                                  description: task.description,
                                  priority: task.priority,
                                  dueDate: task.dueDate,
                                };
                                e.dataTransfer.setData(
                                  "application/json",
                                  JSON.stringify({
                                    type: "project-task",
                                    task: taskData,
                                  }),
                                );
                                (window as any).__lastDraggedTask = taskData;
                                window.dispatchEvent(
                                  new CustomEvent("kanban:task-drag-start", {
                                    detail: {
                                      type: "project-task",
                                      task: taskData,
                                    },
                                  }),
                                );
                              }}
                            >
                              <div className="font-medium truncate">
                                {task.title}
                              </div>
                              <div className="text-gray-500 truncate">
                                {task.taskCode}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </div>

              {/* Recent chats list - positioned below */}
              {!collapsed.recent && (
                <div className="mt-3 border-t border-border pt-3 px-1">
                  <div className="max-h-32 overflow-y-auto space-y-1.5">
                    {recent.slice(0, 5).map((chat) => (
                      <Button
                        key={chat.id}
                        variant={
                          selectedChatId === chat.id ? "secondary" : "ghost"
                        }
                        size="sm"
                        onClick={() => setSelectedId(chat.id as any)}
                        className="w-full justify-start h-8 px-3 text-xs truncate hover:bg-muted rounded-lg transition-all"
                      >
                        {chat.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Header removed - functionality moved to consolidated header above */}
            <ChatPane
              ref={composerRef}
              conversation={selected}
              onSend={(payload: ChatSendPayload) => onSend(payload)}
              onEditMessage={(messageId: string, newContent: string) =>
                onEditMessage(messageId, newContent)
              }
              isThinking={
                isThinking && (thinkingConvId as any) === selected?.id
              }
              onPauseThinking={pauseThinking}
              onDeleteFrom={(messageId: string) => onDeleteFrom(messageId)}
              onRegenerate={(m) => onRegenerateMessage(m)}
              currentUser={currentUser}
              // selectedHookMessageIds={selectedHookMessageIds}
              // onHook={async (m) => {
              //   if (!selectedId) return;
              //   await toggleHook({
              //     chatId: selectedId as any,
              //     messageId: m.id as any,
              //     content: m.content,
              //   });
              // }}
            />

            {/* Search Modal */}
            <SearchModal
              isOpen={showSearchModal}
              onClose={() => setShowSearchModal(false)}
              conversations={mappedChats}
              selectedId={selectedChatId}
              onSelect={(id: string) => setSelectedId(id as any)}
              togglePin={(id: string) => togglePin(id as any)}
              createNewChat={createNewChat}
            />
            <ProjectTaskDetailModal
              task={selectedTask}
              open={isTaskModalOpen}
              onOpenChange={setIsTaskModalOpen}
              lists={lists || []}
            />
          </main>
        )}
      </div>
    </div>
  );
}
