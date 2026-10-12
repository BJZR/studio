import { collect } from '../../providers/collect.js';
import { prompt } from './prompt.js';

const SYSTEM = prompt(
  'Eres un analista de textos. Estima qué probabilidad hay de que el texto haya sido generado por IA.',
  'Responde SOLO con JSON válido, sin Markdown, con esta forma exacta:',
  '{"ai_probability": <número de 0 a 100>, "signals": ["señal concreta 1", "señal concreta 2", "señal concreta 3"]}',
  'Las señales deben ser patrones concretos del texto: conectores genéricos, ritmo uniforme, estructura repetitiva, falta de detalles específicos, tono neutro excesivo.',
);

const clamp = value => Math.min(100, Math.max(0, Math.round(value)));

function parse(raw) {
  try {
    const data = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '');
    const score = Number(data.ai_probability);
    if (Number.isFinite(score)) return { score: clamp(score), signals: (data.signals ?? []).map(String).slice(0, 5) };
  } catch {
    /* se intenta el respaldo numérico */
  }
  const number = raw.match(/\d{1,3}/)?.[0];
  if (number === undefined) throw new Error('El detector no devolvió un resultado interpretable.');
  return { score: clamp(Number(number)), signals: [] };
}

export async function detectAI(provider, text, signal) {
  const raw = await collect(provider, { system: SYSTEM, messages: [{ role: 'user', content: text }], signal });
  return parse(raw);
}
