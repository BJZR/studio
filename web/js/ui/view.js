import { clear } from '../core/dom.js';
import { getState } from '../core/store.js';
import { getTool } from '../tools/registry.js';
import { renderChat } from './chat.js';
import { renderTool } from './toolPanel.js';

export function renderView(root) {
  const tool = getTool(getState().view);
  clear(root);
  if (tool) renderTool(root, tool);
  else renderChat(root);
}
