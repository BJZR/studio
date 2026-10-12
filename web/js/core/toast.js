import { $, el } from './dom.js';

export function toast(message, type = 'info') {
  const node = el('div', { class: `toast ${type}` }, message);
  $('#toasts').append(node);
  setTimeout(() => node.remove(), 4000);
}
