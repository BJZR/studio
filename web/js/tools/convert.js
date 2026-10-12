import { prompt } from './helpers/prompt.js';

export default {
  id: 'convert',
  name: 'Convertir',
  icon: '⇄',
  summary: 'Cambia el contenido de formato o de idioma sin perder información.',
  inputLabel: 'Contenido a convertir',
  inputPlaceholder: 'Pega texto, tabla, JSON, HTML…',
  output: 'markdown',
  fields: [
    { id: 'target', label: 'Convertir a', type: 'select', options: ['Markdown', 'HTML', 'JSON', 'CSV', 'YAML', 'XML', 'Tabla Markdown', 'SQL (INSERT)', 'Texto plano', 'Traducción'], default: 'JSON' },
    { id: 'extra', label: 'Idioma o detalles', type: 'text', placeholder: 'Ej: inglés, o claves en camelCase' },
  ],
  build: ({ target, extra }, input) => ({
    system: prompt(
      'Eres un conversor de formatos. Convierte el contenido del usuario sin perder información.',
      `Formato destino: ${target}.`,
      extra && `Detalles: ${extra}.`,
      'Si el destino es un formato de datos o de código, responde solo con un bloque de código.',
      'Si el destino es Traducción, traduce con fidelidad al idioma indicado y conserva el formato original.',
      'No añadas comentarios.',
    ),
    user: input,
  }),
};
