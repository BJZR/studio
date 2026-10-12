import { prompt } from './helpers/prompt.js';

export default {
  id: 'edit',
  name: 'Editar',
  icon: '✂',
  summary: 'Corrige, acorta, expande o reestructura un texto.',
  inputLabel: 'Texto a editar',
  inputPlaceholder: 'Pega el texto que quieres mejorar…',
  output: 'plain',
  fields: [
    { id: 'mode', label: 'Edición', type: 'select', options: ['Corregir ortografía y gramática', 'Mejorar claridad y estilo', 'Acortar', 'Expandir', 'Cambiar tono', 'Reestructurar', 'Personalizada'], default: 'Mejorar claridad y estilo' },
    { id: 'instructions', label: 'Instrucciones', type: 'text', placeholder: 'Ej: tono más formal, máximo 100 palabras' },
  ],
  build: ({ mode, instructions }, input) => ({
    system: prompt(
      'Eres un editor meticuloso. Aplica la edición pedida respetando la voz del autor y el idioma original.',
      `Edición: ${mode}.`,
      instructions && `Instrucciones: ${instructions}.`,
      'Devuelve solo el texto editado, sin comentarios.',
    ),
    user: input,
  }),
};
