const KEY = 'studio:v1';

const defaults = {
  view: 'chat',
  theme: 'dark',
  providers: [],
  activeProviderId: null,
  chats: [],
  activeChatId: null,
  drafts: {},
};

const listeners = new Set();
let state = load();

function load() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return { ...defaults };
  }
}

export const getState = () => state;

export function setState(patch, { silent = false } = {}) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* cuota llena: se sigue en memoria */
  }
  if (!silent) listeners.forEach(listener => listener(state));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
