import { $, el, clear } from '../core/dom.js';
import { getState, setState } from '../core/store.js';
import { getTool } from '../tools/registry.js';
import { openSettings } from './settings.js';

export function renderTopbar(root) {
  const { view, providers, activeProviderId } = getState();
  const tool = getTool(view);
  const title = tool ? tool.name : 'Chat';
  const subtitle = tool ? tool.summary : 'Conversa con cualquier modelo configurado.';

  clear(root).append(
    el('button', { class: 'btn ghost sm menu-btn', onClick: () => $('#app').classList.toggle('nav-open') }, '☰'),
    el('div', {}, el('h1', { class: 'view-title' }, title), el('div', { class: 'view-sub' }, subtitle)),
    el('span', { class: 'spacer' }),
    providers.length
      ? providerSelect(providers, activeProviderId)
      : el('button', { class: 'btn primary sm', onClick: () => openSettings() }, 'Configurar IA'),
  );
}

function providerSelect(providers, activeId) {
  return el('select', {
    title: 'Proveedor activo',
    onChange: event => setState({ activeProviderId: event.target.value }),
  }, providers.map(provider =>
    el('option', { value: provider.id, selected: provider.id === activeId }, `${provider.name} (${provider.model})`)));
}
