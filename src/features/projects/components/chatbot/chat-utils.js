export function getChatUpdatedAt(chat) {
  // Try explicit updatedAt, then last message timestamp, then createdAt
  if (chat?.updatedAt) return new Date(chat.updatedAt).getTime();
  const msgs = Array.isArray(chat?.messages) ? chat.messages : [];
  const last = msgs.length ? msgs[msgs.length - 1] : null;
  if (last?.createdAt) return new Date(last.createdAt).getTime();
  if (chat?.createdAt) return new Date(chat.createdAt).getTime();
  return 0;
}

export function sortChatsByUpdatedAt(chats = []) {
  return [...chats].sort((a, b) => getChatUpdatedAt(b) - getChatUpdatedAt(a));
}
