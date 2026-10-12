import { getState, setState } from './store.js';

export function getDraft(tool) {
  const saved = getState().drafts[tool.id] ?? {};
  const defaults = Object.fromEntries(tool.fields.map(field => [field.id, field.default ?? '']));
  return { input: '', output: '', report: '', log: [], ...saved, values: { ...defaults, ...saved.values } };
}

export function saveDraft(toolId, patch) {
  setState(state => ({
    drafts: { ...state.drafts, [toolId]: { ...state.drafts[toolId], ...patch } },
  }), { silent: true });
}
