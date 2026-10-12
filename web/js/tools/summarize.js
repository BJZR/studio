import { prompt } from './helpers/prompt.js';

export default {
  id: 'summarize',
  name: 'Resumir',
  icon: '≡',
  summary: 'Condensa textos largos en lo esencial.',
  inputLabel: 'Texto a resumir',
  inputPlaceholder: 'Pega el documento, artículo o transcripción…',
  output: 'markdown',
  fields: [
    { id: 'format', label: 'Formato', type: 'select', options: ['Puntos clave', 'Párrafo', 'TL;DR', 'Resumen ejecutivo'], default: 'Puntos clave' },
    { id: 'length', label: 'Detalle', type: 'select', options: ['muy corto', 'medio', 'detallado'], default: 'medio' },
  ],
  build: ({ format, length }, input) => ({
    system: prompt(
      'Eres un analista que resume con precisión y sin inventar datos.',
      `Formato: ${format}. Nivel de detalle: ${length}.`,
      'Escribe en el idioma del texto original.',
    ),
    user: input,
  }),
};
