import { prompt } from './helpers/prompt.js';
import { textMetrics } from './helpers/textMetrics.js';

const percent = value => `${Math.round(value * 100)}%`;

export default {
  id: 'detect',
  name: 'Detectar',
  icon: '◎',
  summary: 'Estima si un texto parece escrito por IA y explica por qué.',
  inputLabel: 'Texto a analizar',
  inputPlaceholder: 'Pega el texto que quieres revisar…',
  output: 'markdown',
  fields: [
    { id: 'depth', label: 'Profundidad', type: 'select', options: ['rápida', 'detallada'], default: 'detallada' },
  ],
  local(input) {
    const m = textMetrics(input);
    return [
      '**Métricas locales**',
      `- Palabras: ${m.words}; frases: ${m.sentences}`,
      `- Longitud media de frase: ${m.avgSentence.toFixed(1)} palabras`,
      `- Variación del ritmo: ${m.variation.toFixed(2)} (un ritmo muy uniforme sugiere texto generado)`,
      `- Diversidad léxica: ${percent(m.lexicalDiversity)}`,
    ].join('\n');
  },
  build: ({ depth }, input) => {
    const m = textMetrics(input);
    return {
      system: prompt(
        'Eres un analista de textos. Evalúas si un texto parece generado por IA.',
        'Responde en Markdown con estas secciones:',
        '## Veredicto — probabilidad estimada de IA en % y nivel (baja, media o alta).',
        '## Señales — evidencias concretas (estructura repetitiva, conectores genéricos, ritmo uniforme, falta de detalles específicos, etc.).',
        '## Fragmentos sospechosos — citas cortas del texto.',
        '## Cómo humanizarlo — tres recomendaciones.',
        '## Limitaciones — aclara que es una estimación y no una prueba.',
        depth === 'rápida' && 'Sé breve: máximo 120 palabras en total.',
        `Métricas calculadas: variación del ritmo ${m.variation.toFixed(2)}, diversidad léxica ${percent(m.lexicalDiversity)}.`,
      ),
      user: input,
    };
  },
};
