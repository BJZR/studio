import { toDocx } from './toDocx.js';
import { toOdt } from './toOdt.js';
import { toPdf } from './toPdf.js';
import { toRtf } from './toRtf.js';
import { toHtml } from './toHtml.js';
import { toTxt } from './toTxt.js';

export const FORMATS = {
  docx: { label: 'Word (.docx)', build: toDocx },
  pdf: { label: 'PDF (.pdf)', build: toPdf },
  odt: { label: 'OpenDocument (.odt)', build: toOdt },
  rtf: { label: 'Rich Text (.rtf)', build: toRtf },
  html: { label: 'Página web (.html)', build: toHtml },
  md: { label: 'Markdown (.md)', build: markdown => new Blob([markdown], { type: 'text/markdown;charset=utf-8' }) },
  txt: { label: 'Texto plano (.txt)', build: toTxt },
};

export function exportDocument(format, text, baseName) {
  const entry = FORMATS[format];
  if (!entry) throw new Error(`Formato no soportado: ${format}`);
  const date = new Date().toISOString().slice(0, 10);
  return { blob: entry.build(text), filename: `${baseName}-${date}.${format}` };
}
