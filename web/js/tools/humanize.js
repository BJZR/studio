import { prompt } from './helpers/prompt.js';

export default {
  id: 'humanize',
  name: 'Humanizar',
  icon: '✎',
  summary: 'Reescribe un texto con voz natural y humana.',
  inputLabel: 'Texto a humanizar',
  inputPlaceholder: 'Pega aquí el texto que suena a máquina…',
  output: 'plain',
  fields: [
    { id: 'tone', label: 'Tono', type: 'select', options: ['natural', 'casual', 'profesional', 'académico', 'cercano'], default: 'natural' },
    { id: 'level', label: 'Intensidad', type: 'select', options: ['suave', 'media', 'fuerte'], default: 'media' },
    { id: 'notes', label: 'Indicaciones extra', type: 'text', placeholder: 'Ej: mantener términos técnicos' },
  ],
  build: ({ tone, level, notes }, input) => ({
    system: prompt(
      'Eres un editor profesional. Reescribe el texto para que suene escrito por una persona real.',
      'Reglas:',
      '- Conserva el significado, los datos, los nombres y las cifras.',
      '- Varía la longitud y la estructura de las frases; mezcla frases cortas y largas.',
      '- Elimina muletillas y fórmulas típicas de IA ("en conclusión", "cabe destacar", "en el mundo actual", listas simétricas, exceso de conectores).',
      '- Prefiere vocabulario concreto y directo; evita adjetivos vacíos.',
      '- Mantén el idioma original.',
      `Tono: ${tone}. Intensidad de reescritura: ${level}.`,
      notes && `Indicaciones extra: ${notes}`,
      'Devuelve únicamente el texto reescrito, sin comentarios ni encabezados.',
    ),
    user: input,
  }),
};
