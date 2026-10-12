import { el, clear } from '../core/dom.js';
import { getState, setState } from '../core/store.js';
import { uid } from '../core/id.js';
import { toast } from '../core/toast.js';
import { PRESETS, TYPE_LABELS, streamChat } from '../providers/registry.js';

const dialog = () => document.getElementById('settings');

export function openSettings(editId = null) {
  renderSettings(editId);
  if (!dialog().open) dialog().showModal();
}

function renderSettings(editId) {
  const { providers, activeProviderId } = getState();
  const editing = providers.find(provider => provider.id === editId);

  clear(dialog()).append(
    el('div', { class: 'dialog-head' },
      el('h2', {}, 'Proveedores de IA'),
      el('button', { class: 'btn ghost sm', onClick: () => dialog().close() }, '✕')),
    el('div', { class: 'dialog-body' },
      providers.length
        ? providerList(providers, activeProviderId)
        : el('p', { class: 'muted' }, 'Aún no hay proveedores. Añade uno para empezar.'),
      presetPicker(),
      editing ? providerForm(editing) : null,
      el('p', { class: 'muted small' },
        'Las claves se guardan en este navegador (localStorage). Si una API bloquea CORS, activa «Usar proxy Go» y abre Studio desde el servidor Go.')));
}

function providerList(providers, activeId) {
  return el('ul', { class: 'provider-list' }, providers.map(provider =>
    el('li', { class: provider.id === activeId ? 'active' : '' },
      el('div', {}, el('strong', {}, provider.name), el('small', {}, `${TYPE_LABELS[provider.type]}, modelo ${provider.model || 'sin definir'}`)),
      el('div', { class: 'row' },
        provider.id === activeId
          ? el('span', { class: 'badge' }, 'Activo')
          : el('button', { class: 'btn sm', onClick: () => activate(provider.id) }, 'Usar'),
        el('button', { class: 'btn sm', onClick: () => renderSettings(provider.id) }, 'Editar'),
        el('button', { class: 'btn sm danger', onClick: () => removeProvider(provider.id) }, 'Borrar')))));
}

function activate(id) {
  setState({ activeProviderId: id });
  renderSettings(null);
}

function removeProvider(id) {
  setState(state => {
    const providers = state.providers.filter(provider => provider.id !== id);
    const activeProviderId = state.activeProviderId === id ? (providers[0]?.id ?? null) : state.activeProviderId;
    return { providers, activeProviderId };
  });
  renderSettings(null);
}

function presetPicker() {
  const select = el('select', {}, PRESETS.map((preset, index) => el('option', { value: index }, preset.label)));

  const add = () => {
    const { label, ...preset } = PRESETS[select.value];
    const provider = { id: uid(), name: label, apiKey: '', temperature: 0.7, useProxy: false, ...preset };
    setState(state => ({
      providers: [...state.providers, provider],
      activeProviderId: state.activeProviderId ?? provider.id,
    }));
    renderSettings(provider.id);
  };

  return el('div', { class: 'row preset' }, select, el('button', { class: 'btn primary', onClick: add }, 'Añadir proveedor'));
}

function providerForm(provider) {
  const draft = { ...provider };
  const field = (label, control, wide = false) => el('label', { class: `field${wide ? ' wide' : ''}` }, el('span', {}, label), control);
  const text = (key, type = 'text') => el('input', { type, value: draft[key] ?? '', onInput: event => (draft[key] = event.target.value) });

  const typeSelect = el('select', { onChange: event => (draft.type = event.target.value) },
    Object.entries(TYPE_LABELS).map(([value, label]) => el('option', { value, selected: value === draft.type }, label)));

  const temperature = el('input', {
    type: 'number', min: 0, max: 2, step: 0.1, value: draft.temperature,
    onInput: event => (draft.temperature = Number(event.target.value)),
  });

  const proxy = el('input', { type: 'checkbox', checked: draft.useProxy, onChange: event => (draft.useProxy = event.target.checked) });

  const save = () => {
    setState(state => ({ providers: state.providers.map(item => (item.id === draft.id ? draft : item)) }));
    toast('Proveedor guardado', 'ok');
    renderSettings(null);
  };

  return el('div', { class: 'provider-form' },
    field('Nombre', text('name')),
    field('Tipo de API', typeSelect),
    field('URL base', text('baseUrl'), true),
    field('API key (vacía para modelos locales)', text('apiKey', 'password'), true),
    field('Modelo', text('model')),
    field('Temperatura', temperature),
    el('label', { class: 'field inline wide' }, proxy, 'Usar proxy Go (evita errores de CORS)'),
    el('div', { class: 'row wide' },
      el('button', { class: 'btn primary', onClick: save }, 'Guardar'),
      el('button', { class: 'btn', onClick: () => testProvider(draft) }, 'Probar conexión'),
      el('button', { class: 'btn ghost', onClick: () => renderSettings(null) }, 'Cancelar')));
}

async function testProvider(provider) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  let reply = '';

  try {
    await streamChat(provider, {
      system: '',
      messages: [{ role: 'user', content: 'Responde solo con la palabra: ok' }],
      signal: controller.signal,
      onToken: token => (reply += token),
    });
    toast(`Conexión correcta. Respuesta: ${reply.trim().slice(0, 40)}`, 'ok');
  } catch (error) {
    toast(error.name === 'AbortError' ? 'Tiempo de espera agotado (20 s).' : error.message, 'error');
  } finally {
    clearTimeout(timer);
  }
}
