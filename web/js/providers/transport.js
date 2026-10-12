export const joinUrl = (base, path) => base.replace(/\/+$/, '') + path;

export function request(provider, url, init = {}) {
  if (!provider.useProxy) return fetch(url, init);
  return fetch('/proxy', { ...init, headers: { ...init.headers, 'X-Target-URL': url } });
}

export async function assertOk(response) {
  if (response.ok) return response;
  const body = await response.text().catch(() => '');
  throw new Error(`HTTP ${response.status}: ${body.slice(0, 300)}`);
}
