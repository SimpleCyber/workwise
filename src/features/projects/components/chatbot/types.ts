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
}

export type ChatSendPayload = {
  text: string;
};

