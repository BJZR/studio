import { el, clear } from '../core/dom.js';
import { getState, setState } from '../core/store.js';
import { createChat, deleteChat, getActiveChat } from '../core/chats.js';
import { TOOLS } from '../tools/registry.js';
import { openSettings } from './settings.js';

export function renderSidebar(root) {
  const { view, chats, activeChatId, theme } = getState();

  clear(root).append(
    el('div', { class: 'brand' }, el('span', { class: 'brand-mark' }, '◐'), 'Studio'),
    el('div', { class: 'nav-label' }, 'Espacio'),
    navItem('chat', '❝', 'Chat', view === 'chat'),
    el('div', { class: 'nav-label' }, 'Herramientas'),
    ...TOOLS.map(tool => navItem(tool.id, tool.icon, tool.name, view === tool.id)),
    view === 'chat' ? chatList(chats, activeChatId) : el('div', { class: 'spacer' }),
    footer(theme),
  );
}

function navItem(id, glyph, label, active) {
  const open = () => {
    setState({ view: id });
    if (id === 'chat' && !getActiveChat()) createChat();
  };
  return el('button', { class: `nav-item${active ? ' active' : ''}`, onClick: open },
    el('span', { class: 'nav-glyph' }, glyph), label);
}

function chatList(chats, activeId) {
  return el('div', { class: 'chat-list' },
    el('div', { class: 'chat-list-head' },
      el('div', { class: 'nav-label' }, 'Conversaciones'),
      el('button', { class: 'btn ghost sm', title: 'Nuevo chat', onClick: createChat }, '＋')),
    ...chats.map(chat => el('div', { class: `chat-item${chat.id === activeId ? ' active' : ''}` },
      el('button', { class: 'open', onClick: () => setState({ activeChatId: chat.id }) }, chat.title),
      el('button', { class: 'del', title: 'Borrar chat', onClick: () => removeChat(chat.id) }, '×'))));
}

function removeChat(id) {
  deleteChat(id);
  if (!getActiveChat()) createChat();
}

function footer(theme) {
  const toggleTheme = () => setState({ theme: theme === 'dark' ? 'light' : 'dark' });
  return el('div', { class: 'sidebar-foot' },
    el('button', { class: 'btn sm', onClick: () => openSettings() }, '⚙ Proveedores'),
    el('button', { class: 'btn sm', title: 'Cambiar tema', onClick: toggleTheme }, theme === 'dark' ? '☀' : '☾'));
}
