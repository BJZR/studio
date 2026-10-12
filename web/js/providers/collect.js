import { streamChat } from './registry.js';

// Ejecuta una petición en streaming y devuelve el texto completo.
// onToken recibe (token, textoAcumulado).
export async function collect(provider, { onToken, ...request }) {
  let text = '';
  await streamChat(provider, {
    ...request,
    onToken: token => {
      text += token;
      onToken?.(token, text);
    },
  });
  return text;
}
