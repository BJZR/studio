import { prompt } from './helpers/prompt.js';

export default {
  id: 'create',
  name: 'Crear',
  icon: '✦',
  summary: 'Genera contenido nuevo a partir de un tema o brief.',
  inputLabel: 'Tema o brief',
  inputPlaceholder: 'Describe qué necesitas, para quién y con qué objetivo…',
  output: 'markdown',
  fields: [
    { id: 'kind', label: 'Tipo', type: 'select', options: ['artículo', 'informe', 'carta formal', 'currículum', 'acta de reunión', 'propuesta comercial', 'email', 'guion de video', 'post para redes', 'lluvia de ideas', 'historia', 'descripción de producto', 'plan de trabajo'], default: 'artículo' },
    { id: 'tone', label: 'Tono', type: 'select', options: ['profesional', 'casual', 'persuasivo', 'técnico', 'creativo'], default: 'profesional' },
    { id: 'length', label: 'Extensión', type: 'select', options: ['corta', 'media', 'larga'], default: 'media' },
    { id: 'audience', label: 'Público objetivo', type: 'text', placeholder: 'Ej: desarrolladores junior' },
  ],
  build: ({ kind, tone, length, audience }, input) => ({
    system: prompt(
      'Eres un redactor y creador de contenido experto.',
      `Crea el siguiente tipo de contenido: ${kind}.`,
      `Tono: ${tone}. Extensión: ${length}.`,
      audience && `Público objetivo: ${audience}.`,
      'Usa Markdown (títulos con #, listas con -, tablas con |) para que el resultado se exporte bien a Word, PDF u ODT. Escribe en el idioma del brief.',
      'Entrega directamente el contenido, sin preámbulos.',
    ),
    user: input,
  }),
};
