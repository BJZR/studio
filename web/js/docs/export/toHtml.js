import { escapeXml } from '../xml.js';
import { parseBlocks, parseInline } from './blocks.js';

const STYLE = 'body{font:17px/1.65 Georgia,serif;max-width:720px;margin:48px auto;padding:0 20px;color:#1b1b1b}'
  + 'h1,h2,h3,h4{font-family:system-ui,sans-serif;line-height:1.25}'
  + 'pre{background:#f3f3f1;padding:12px 14px;overflow:auto;border-radius:6px}code{font-family:ui-monospace,Consolas,monospace}'
  + 'table{border-collapse:collapse}td,th{border:1px solid #bbb;padding:6px 10px}';

function inline(text) {
  return parseInline(text).map(({ text: value, bold, italic, code }) => {
    const safe = escapeXml(value).replace(/\n/g, '<br>');
    if (code) return `<code>${safe}</code>`;
    if (bold) return `<strong>${safe}</strong>`;
    return italic ? `<em>${safe}</em>` : safe;
  }).join('');
}

const table = rows => `<table>${rows.map((row, i) => `<tr>${row.map(cell => `<${i ? 'td' : 'th'}>${inline(cell)}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</table>`;

const BLOCKS = {
  heading: block => `<h${block.level}>${inline(block.text)}</h${block.level}>`,
  paragraph: block => `<p>${inline(block.text)}</p>`,
  code: block => `<pre><code>${escapeXml(block.text)}</code></pre>`,
  table: block => table(block.rows),
};

export function toHtml(markdown) {
  const html = [];
  let list = null;
  const closeList = () => {
    if (list) html.push(`</${list}>`);
    list = null;
  };

  for (const block of parseBlocks(markdown)) {
    if (block.type === 'bullet') {
      const tag = block.ordered ? 'ol' : 'ul';
      if (list !== tag) {
        closeList();
        html.push(`<${tag}>`);
        list = tag;
      }
      html.push(`<li>${inline(block.text)}</li>`);
    } else {
      closeList();
      html.push(BLOCKS[block.type](block));
    }
  }
  closeList();

  const page = `<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><title>Documento</title><style>${STYLE}</style></head><body>\n${html.join('\n')}\n</body></html>`;
  return new Blob([page], { type: 'text/html;charset=utf-8' });
}
