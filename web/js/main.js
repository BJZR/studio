import { $ } from './core/dom.js';
import { getState, subscribe } from './core/store.js';
import { createChat, getActiveChat } from './core/chats.js';
import { renderSidebar } from './ui/sidebar.js';
import { renderTopbar } from './ui/topbar.js';
import { renderView } from './ui/view.js';

let lastSignature = '';

function render() {
  const state = getState();
  document.documentElement.dataset.theme = state.theme;
  $('#app').classList.remove('nav-open');

  renderSidebar($('#sidebar'));
  renderTopbar($('#topbar'));

  const signature = `${state.view}:${state.activeChatId}`;
  if (signature === lastSignature) return;
  lastSignature = signature;
  renderView($('#view'));
}

function bindGlobalEvents() {
  const app = $('#app');
  app.addEventListener('click', event => {
    if (event.target === app) app.classList.remove('nav-open');
  });

  const settings = $('#settings');
  settings.addEventListener('click', event => {
    if (event.target === settings) settings.close();
  });
}

function boot() {
  if (!getActiveChat()) createChat();
  subscribe(render);
  bindGlobalEvents();
  render();
}

boot();
