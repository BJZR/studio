import { assertOk, joinUrl, request } from './transport.js';
import { readSSE } from './sse.js';

export async function streamAnthropic(provider, { messages, system, signal, onToken }) {
  if (!provider.apiKey) throw new Error('Falta la API key del proveedor.');

  const response = await assertOk(await request(provider, joinUrl(provider.baseUrl, '/v1/messages'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 4096,
      stream: true,
      temperature: Math.min(provider.temperature ?? 1, 1),
      system: system || undefined,
      messages,
    }),
    signal,
  }));

  await readSSE(response, event => {
    if (event.type === 'content_block_delta' && event.delta?.text) onToken(event.delta.text);
  });
}
