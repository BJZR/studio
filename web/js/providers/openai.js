import { assertOk, joinUrl, request } from './transport.js';
import { readSSE } from './sse.js';

export async function streamOpenAI(provider, { messages, system, signal, onToken }) {
  const headers = { 'Content-Type': 'application/json' };
  if (provider.apiKey) headers.Authorization = `Bearer ${provider.apiKey}`;

  const body = {
    model: provider.model,
    stream: true,
    temperature: provider.temperature,
    messages: system ? [{ role: 'system', content: system }, ...messages] : messages,
  };

  const response = await assertOk(await request(provider, joinUrl(provider.baseUrl, '/chat/completions'), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  }));

  await readSSE(response, event => {
    const token = event.choices?.[0]?.delta?.content;
    if (token) onToken(token);
  });
}
