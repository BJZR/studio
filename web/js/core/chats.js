import { getState, setState } from './store.js';
import { uid } from './id.js';

export function createChat() {
  const chat = { id: uid(), title: 'Nuevo chat', system: '', messages: [], createdAt: Date.now() };
  setState(state => ({ chats: [chat, ...state.chats], activeChatId: chat.id }));
  return chat;
}

export function getActiveChat() {
  const { chats, activeChatId } = getState();
  return chats.find(chat => chat.id === activeChatId) ?? null;
}

export function updateChat(id, patch, options) {
  setState(state => ({
    chats: state.chats.map(chat => (chat.id === id ? { ...chat, ...patch } : chat)),
  }), options);
}

export function deleteChat(id) {
  setState(state => {
    const chats = state.chats.filter(chat => chat.id !== id);
    const activeChatId = state.activeChatId === id ? (chats[0]?.id ?? null) : state.activeChatId;
    return { chats, activeChatId };
  });
}
