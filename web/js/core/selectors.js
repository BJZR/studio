import { getState } from './store.js';

export function activeProvider() {
  const { providers, activeProviderId } = getState();
  return providers.find(provider => provider.id === activeProviderId) ?? null;
}
