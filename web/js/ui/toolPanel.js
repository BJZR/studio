import { el } from '../core/dom.js';
import { getDraft, saveDraft } from '../core/drafts.js';
import { setState } from '../core/store.js';
import { activeProvider } from '../core/selectors.js';
import { renderMarkdown } from '../core/markdown.js';
import { copyText, stripFence } from '../core/text.js';
import { toast } from '../core/toast.js';
import { runTool } from '../tools/run.js';
import { TOOLS } from '../tools/registry.js';
import { ACCEPT, readDocuments } from '../docs/import/readDocument.js';
import { exportMenu } from './exportMenu.js';

const STEPS = ['Entrada', 'Opciones', 'Resultado'];
const GLYPHS = { run: '◌', ok: '✓', error: '✕' };

export function renderTool(root, tool) {
  const draft = getDraft(tool);
  const values = { ...draft.values };
  let input = draft.input;
  let output = draft.output;
  let report = draft.report;
  let log = draft.log.map(item => ({ ...item }));
  let controller = null;

  const steps = el('ol', { class: 'steps' }, STEPS.map((label, i) => el('li', {}, el('b', {}, i + 1), label)));
  const counter = el('div', { class: 'panel-foot' });
  const logBox = el('ol', { class: 'run-log' });
  const localBox = el('div', { class: 'local-report md' });
  const outputBox = el('div', { class: `output ${tool.output === 'plain' ? 'plain' : 'md'}` });

  const inputArea = el('textarea', {
    class: 'input-area',
    value: input,
    placeholder: tool.inputPlaceholder,
    onInput: () => syncInput(inputArea.value),
    onKeydown: event => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) run();
    },
    onDragover: event => event.preventDefault(),
    onDrop: event => {
      event.preventDefault();
      importFiles(event.dataTransfer.files);
    },
  });

  const runButton = el('button', { class: 'btn primary', onClick: () => (controller ? controller.abort() : run()) }, 'Ejecutar');

  const sendSelect = el('select', {
    title: 'Enviar el resultado a otra herramienta',
    onChange: event => {
      sendTo(event.target.value);
      event.target.value = '';
    },
  }, [
    el('option', { value: '' }, 'Enviar a…'),
    ...TOOLS.filter(other => other.id !== tool.id).map(other => el('option', { value: other.id }, other.name)),
  ]);

  const actions = el('div', { class: 'row' },
    el('button', { class: 'btn sm', onClick: () => copyText(stripFence(output)).then(() => toast('Copiado', 'ok')) }, 'Copiar'),
    exportMenu(() => output, () => tool.id),
    el('button', { class: 'btn sm', onClick: reuseAsInput }, 'Usar como entrada'),
    sendSelect);

  const fileInput = el('input', {
    type: 'file',
    hidden: true,
    multiple: true,
    accept: ACCEPT,
    onChange: event => {
      importFiles(event.target.files);
      event.target.value = '';
    },
  });

  const stage = () => (controller || output ? 3 : input.trim() ? 2 : 1);

  function paintSteps() {
    [...steps.children].forEach((item, i) => {
      const number = i + 1;
      item.className = number < stage() ? 'done' : number === stage() ? 'active' : '';
    });
  }

  function paintCounter() {
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    counter.textContent = `${words} palabras, ${input.length} caracteres`;
  }

  function paintLog() {
    logBox.hidden = !log.length;
    logBox.replaceChildren(...log.map(item =>
      el('li', { class: item.state }, el('span', { class: 'glyph' }, GLYPHS[item.state]), item.label)));
  }

  function paintLocal() {
    localBox.innerHTML = report ? renderMarkdown(report) : '';
  }

  function showOutput() {
    outputBox.toggleAttribute('data-empty', !output);
    if (tool.output === 'plain') outputBox.textContent = output;
    else outputBox.innerHTML = renderMarkdown(output);
  }

  function paintAll() {
    paintSteps();
    paintCounter();
    paintLog();
    paintLocal();
    showOutput();
    actions.querySelectorAll('button, select').forEach(control => (control.disabled = !output || !!controller));
  }

  function syncInput(text) {
    input = text;
    saveDraft(tool.id, { input });
    paintSteps();
    paintCounter();
  }

  function setInput(text) {
    inputArea.value = text;
    syncInput(text);
  }

  async function importFiles(files) {
    if (!files.length) return;
    try {
      const { text, notes } = await readDocuments(files);
      setInput(inputArea.value.trim() ? `${inputArea.value.trim()}\n\n${text}` : text);
      notes.forEach(note => toast(note));
      toast(`${files.length} documento(s) importado(s)`, 'ok');
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  function reuseAsInput() {
    setInput(stripFence(output));
    output = '';
    report = '';
    log = [];
    saveDraft(tool.id, { output, report, log });
    paintAll();
  }

  function sendTo(targetId) {
    if (!targetId) return;
    saveDraft(targetId, { input: stripFence(output), output: '', report: '', log: [] });
    setState({ view: targetId });
  }

  function setBusy(busy) {
    if (!busy) controller = null;
    runButton.textContent = busy ? 'Detener' : 'Ejecutar';
    paintAll();
  }

  function createContext(provider) {
    return {
      provider,
      signal: controller.signal,
      onToken: token => {
        output += token;
        showOutput();
      },
      setOutput: text => {
        output = text;
        showOutput();
      },
      report: markdown => {
        report = markdown;
        paintLocal();
      },
      step: label => {
        const item = { label, state: 'run' };
        log.push(item);
        paintLog();
        return (doneLabel = label, state = 'ok') => {
          item.label = doneLabel;
          item.state = state;
          paintLog();
        };
      },
    };
  }

  async function run() {
    const provider = activeProvider();
    if (!provider) return toast('Configura un proveedor con ⚙ antes de ejecutar.', 'error');
    if (!input.trim()) return toast('Falta el contenido de entrada.', 'error');

    output = '';
    log = [];
    report = tool.local ? tool.local(input) : '';
    controller = new AbortController();
    setBusy(true);

    try {
      await runTool(tool, values, input, createContext(provider));
    } catch (error) {
      log.filter(item => item.state === 'run').forEach(item => (item.state = 'error'));
      if (error.name !== 'AbortError') toast(error.message, 'error');
    } finally {
      saveDraft(tool.id, { output, report, log });
      setBusy(false);
    }
  }

  function fieldControl(field) {
    const onChange = event => {
      values[field.id] = event.target.value;
      saveDraft(tool.id, { values });
    };

    if (field.type === 'select') {
      return el('select', { onChange }, field.options.map(option =>
        el('option', { value: option, selected: option === values[field.id] }, option)));
    }
    return el('input', { type: 'text', value: values[field.id], placeholder: field.placeholder ?? '', onInput: onChange });
  }

  root.append(el('section', { class: 'tool' },
    steps,
    el('div', { class: 'tool-grid' },
      el('div', { class: 'panel' },
        el('div', { class: 'panel-head' },
          el('h3', {}, tool.inputLabel),
          el('div', { class: 'row' },
            el('button', { class: 'btn sm', onClick: () => fileInput.click() }, 'Importar documentos'),
            el('button', { class: 'btn sm', onClick: () => setInput('') }, 'Limpiar'),
            fileInput)),
        inputArea,
        counter,
        el('div', { class: 'panel-foot' }, 'Arrastra archivos o usa «Importar»: docx, odt, pdf, pptx, xlsx, rtf, doc, html, txt, md, csv, json…'),
        el('div', { class: 'options' }, tool.fields.map(field =>
          el('label', { class: 'field' }, el('span', {}, field.label), fieldControl(field)))),
        runButton),
      el('div', { class: 'panel' },
        el('div', { class: 'panel-head' }, el('h3', {}, 'Resultado'), actions),
        logBox,
        localBox,
        outputBox))));

  paintAll();
}
