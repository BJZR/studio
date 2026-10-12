import { el, clear } from '../core/dom.js';
import { getActiveChat, updateChat } from '../core/chats.js';
import { activeProvider } from '../core/selectors.js';
import { renderMarkdown } from '../core/markdown.js';
import { copyText } from '../core/text.js';
import { toast } from '../core/toast.js';
import { streamChat } from '../providers/registry.js';
import { ACCEPT, readDocuments } from '../docs/import/readDocument.js';
import { exportMenu } from './exportMenu.js';

export function renderChat(root) {
  const chat = getActiveChat();
  if (!chat) {
    root.append(el('div', { class: 'empty' }, el('h2', {}, 'Sin conversaciones'), 'Crea un chat desde la barra lateral.'));
    return;
  }

  let messages = [...chat.messages];
  let titled = chat.title !== 'Nuevo chat';
  let controller = null;

  const list = el('div', { class: 'messages' });
  const system = el('textarea', {
    rows: 3,
    value: chat.system,
    placeholder: 'Instrucciones del sistema para este chat (opcional)',
    onInput: event => updateChat(chat.id, { system: event.target.value }, { silent: true }),
  });
  const input = el('textarea', {
    class: 'composer-input',
    rows: 1,
    placeholder: 'Escribe un mensaje (Enter envía, Shift+Enter salta de línea)',
    onInput: autoGrow,
    onKeydown: onKey,
  });
  const sendButton = el('button', { class: 'btn primary', onClick: () => (controller ? controller.abort() : submit()) }, 'Enviar');

  const fileInput = el('input', { type: 'file', hidden: true, multiple: true, accept: ACCEPT, onChange: attach });
  const attachButton = el('button', { class: 'btn ghost', title: 'Adjuntar documentos', onClick: () => fileInput.click() }, 'Adjuntar');

  async function attach(event) {
    const files = [...event.target.files];
    event.target.value = '';
    try {
      const { text, notes } = await readDocuments(files);
      input.value = [input.value.trim(), text].filter(Boolean).join('\n\n');
      autoGrow();
      notes.forEach(note => toast(note));
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  function autoGrow() {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 200)}px`;
  }

  function onKey(event) {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    submit();
  }

  function paint(body, message) {
    if (message.role === 'assistant') body.innerHTML = renderMarkdown(message.content);
    else body.textContent = message.content;
  }

  function bubble(message, { regenerate = false } = {}) {
    const body = el('div', { class: 'msg-body md' });
    paint(body, message);

    const actions = message.role === 'assistant' && message.content
      ? el('div', { class: 'msg-actions' },
        el('button', { class: 'btn ghost sm', onClick: () => copyText(message.content).then(() => toast('Copiado')) }, 'Copiar'),
        exportMenu(() => message.content, () => 'chat'),
        regenerate ? el('button', { class: 'btn ghost sm', onClick: regenerateLast }, 'Regenerar') : null)
      : null;

    return { node: el('article', { class: `msg ${message.role}` }, body, actions), body };
  }

  function drawAll() {
    clear(list);
    if (!messages.length) {
      list.append(el('div', { class: 'empty' },
        el('h2', {}, '¿En qué trabajamos?'),
        'Escribe un mensaje o abre una herramienta desde el menú.'));
    }

    messages.forEach((message, index) => {
      const isLast = index === messages.length - 1;
      list.append(bubble(message, { regenerate: isLast && message.role === 'assistant' }).node);
    });

    const last = messages.at(-1);
    if (last?.role === 'user' && !controller) {
      list.append(el('div', { class: 'msg retry' }, el('button', { class: 'btn sm', onClick: run }, 'Reintentar')));
    }
    list.scrollTop = list.scrollHeight;
  }

  function setBusy(busy) {
    if (!busy) controller = null;
    sendButton.textContent = busy ? 'Detener' : 'Enviar';
  }

  const persist = () => updateChat(chat.id, { messages });

  async function run() {
    const provider = activeProvider();
    if (!provider) {
      toast('Configura un proveedor con ⚙ antes de chatear.', 'error');
      return;
    }

    const reply = { role: 'assistant', content: '' };
    const view = bubble(reply);
    list.querySelector('.retry')?.remove();
    list.append(view.node);

    controller = new AbortController();
    setBusy(true);

    try {
      await streamChat(provider, {
        system: system.value.trim() || undefined,
        messages: messages.map(({ role, content }) => ({ role, content })),
        signal: controller.signal,
        onToken: token => {
          reply.content += token;
          paint(view.body, reply);
          list.scrollTop = list.scrollHeight;
        },
      });
    } catch (error) {
      if (error.name !== 'AbortError') toast(error.message, 'error');
    } finally {
      setBusy(false);
      if (reply.content) messages.push(reply);
      persist();
      drawAll();
    }
  }

  function submit() {
    const text = input.value.trim();
    if (!text || controller) return;

    input.value = '';
    autoGrow();
    messages.push({ role: 'user', content: text });

    if (!titled) {
      titled = true;
      updateChat(chat.id, { title: text.slice(0, 40) });
    }
    drawAll();
    run();
  }

  function regenerateLast() {
    if (controller || messages.at(-1)?.role !== 'assistant') return;
    messages.pop();
    drawAll();
    run();
  }

  root.append(el('section', { class: 'chat' },
    el('details', { class: 'system-box' }, el('summary', {}, 'Instrucciones del sistema'), system),
    list,
    el('div', { class: 'composer' }, attachButton, input, sendButton, fileInput)));

  drawAll();
  input.focus();
}
