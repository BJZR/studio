import { detectAI } from './helpers/detectAI.js';
import { humanizePass } from './helpers/humanizePass.js';

const LEVELS = ['media', 'fuerte', 'fuerte'];

function summary({ history, target, best, rounds }) {
  const reached = best.score <= target;
  return [
    `**${reached ? 'Objetivo cumplido' : 'Objetivo no alcanzado'}:** de ${history[0].score}% a ${best.score}% de IA estimada (meta: ${target}% o menos) en ${rounds} ${rounds === 1 ? 'ronda' : 'rondas'}.`,
    ...history.map(step => `- ${step.label}: ${step.score}%`),
    'La puntuación es una estimación del modelo configurado; no garantiza el resultado ante detectores externos.',
  ].join('\n');
}

export default {
  id: 'flow',
  name: 'Detectar y humanizar',
  icon: '⟲',
  summary: 'Detecta, humaniza y vuelve a comprobar hasta cumplir el objetivo.',
  inputLabel: 'Texto a procesar',
  inputPlaceholder: 'Pega el texto o importa un documento. El flujo se repite hasta llegar a la meta.',
  output: 'plain',
  fields: [
    { id: 'target', label: 'IA máxima aceptable (%)', type: 'select', options: ['10', '20', '30', '40'], default: '20' },
    { id: 'rounds', label: 'Rondas máximas', type: 'select', options: ['1', '2', '3', '4', '5'], default: '3' },
    { id: 'tone', label: 'Tono', type: 'select', options: ['natural', 'casual', 'profesional', 'académico', 'cercano'], default: 'natural' },
  ],

  async run(input, values, ctx) {
    const target = Number(values.target);
    const maxRounds = Number(values.rounds);
    const { provider, signal } = ctx;

    const detecting = ctx.step('Detectando el texto original');
    let current = await detectAI(provider, input, signal);
    detecting(`Original: ${current.score}% de probabilidad de IA`);

    const history = [{ label: 'Original', score: current.score }];
    let best = { text: input, score: current.score };
    let text = input;
    let rounds = 0;

    if (current.score <= target) {
      ctx.step('El texto ya cumple la meta, no hace falta humanizar')('El texto ya cumple la meta: no hace falta humanizar');
      ctx.setOutput(input);
      ctx.report(summary({ history, target, best, rounds }));
      return;
    }

    while (rounds < maxRounds && current.score > target) {
      rounds++;
      const level = LEVELS[Math.min(rounds - 1, LEVELS.length - 1)];

      const humanizing = ctx.step(`Ronda ${rounds}: humanizando (intensidad ${level})`);
      text = await humanizePass(provider, text, { tone: values.tone, level, signals: current.signals }, { signal, onText: ctx.setOutput });
      humanizing(`Ronda ${rounds}: texto reescrito`);

      const checking = ctx.step(`Ronda ${rounds}: comprobando`);
      current = await detectAI(provider, text, signal);
      checking(`Ronda ${rounds}: ${current.score}% de probabilidad de IA`);

      history.push({ label: `Ronda ${rounds}`, score: current.score });
      if (current.score < best.score) best = { text, score: current.score };
    }

    ctx.setOutput(best.text);
    ctx.step('Flujo terminado')(best.score <= target ? 'Flujo terminado: meta alcanzada' : 'Flujo terminado: se entrega la mejor versión obtenida');
    ctx.report(summary({ history, target, best, rounds }));
  },
};
