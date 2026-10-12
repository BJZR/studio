import { assertOk, joinUrl, request } from './transport.js';
import { readSSE } from './sse.js';

export async function streamGemini(provider, { messages, system, signal, onToken }) {
  if (!provider.apiKey) throw new Error('Falta la API key del proveedor.');

  const url = joinUrl(provider.baseUrl, `/v1beta/models/${provider.model}:streamGenerateContent?alt=sse`);
  const body = {
    contents: messages.map(({ role, content }) => ({
      role: role === 'assistant' ? 'model' : 'user',
      parts: [{ text: content }],
    })),
    generationConfig: { temperature: provider.temperature },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const response = await assertOk(await request(provider, url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': provider.apiKey },
    body: JSON.stringify(body),
    signal,
  }));

  await readSSE(response, event => {
    const text = event.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('');
    if (text) onToken(text);
  });
}
