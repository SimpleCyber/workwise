// You can import these types where helpful without changing runtime behavior now.

export type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number; // unix ms
}

export interface Chat {
  id: string;
  name: string;
  messages: ChatMessage[];
  starred?: boolean;
  updatedAt: number; // unix ms; use for sorting recents
}

export type ModelId = string;

export interface ModelOption {
  id: ModelId;
  label: string;
}

export interface SidebarHandlers {
  onSelectChat: (chatId: string) => void;
  onCreateChat: () => void;
  onRenameChat: (chatId: string, name: string) => void;
  onDeleteChat: (chatId: string) => void;
  onToggleStar: (chatId: string) => void;
}

export interface MessageActions {
  onEdit?: (messageId: string) => void;
  onCopy?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
  onSpeak?: (messageId: string) => void;
  onHook?: (messageId: string) => void;
}

export type UIRole = "user" | "assistant";

export interface UIMessage {
  id: string;
  role: UIRole;
  content: string;
}

export interface UIConversation {
  id: string;
  title: string;
  updatedAt: string; // ISO
  messages?: UIMessage[];
  preview: string;
  pinned: boolean;
}

// Exposed methods from ChatPane via forwardRef
export interface ChatPaneHandle {
  insertTemplate: (templateContent: string) => void;
  addAttachmentFromTask: (task: TaskAttachment) => void;
}

export type ChatSendPayload = {
  text: string;
  attachments?: TaskAttachment[];
};

export type TaskAttachment = {
  taskId: string;
  taskCode?: string;
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: number | null;
  labels?: string[];
  boardId?: string;
  listId?: string;
  assignedTo?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  assignedBy?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  createdBy?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  comments?: {
    content: string;
    authorName?: string | null;
    authorEmail?: string | null;
    createdAt?: number;
    imageUrl?: string | null;
  }[];
};
