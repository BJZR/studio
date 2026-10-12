import { parseBlocks, parseInline, rowsToLines } from './blocks.js';

const PAGE = { width: 595.28, height: 841.89, margin: 56 };
const TEXT_WIDTH = PAGE.width - 2 * PAGE.margin;
const WIN_ANSI = { '€': 0x80, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '™': 0x99 };
const HEADING_SIZES = { 1: 20, 2: 16, 3: 13.5 };
const FONT_NAMES = ['Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Courier'];
const CSS_FONT = { F2: 'bold ', F3: 'italic ' };

let measurer;

function width(text, font, size) {
  if (font === 'F4') return text.length * size * 0.6;
  measurer ??= typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  if (!measurer) return text.length * size * 0.5;
  measurer.font = `${CSS_FONT[font] ?? ''}${size}px Arial`;
  return measurer.measureText(text).width;
}

function pdfString(text) {
  let out = '';
  for (const char of text) {
    let code = WIN_ANSI[char] ?? char.codePointAt(0);
    if (code > 255) code = 63;
    if (char === '(' || char === ')' || char === '\\') out += `\\${char}`;
    else if (code < 32 || code > 126) out += `\\${code.toString(8).padStart(3, '0')}`;
    else out += String.fromCharCode(code);
  }
  return out;
}

function tokens(text, base) {
  const out = [];
  for (const run of parseInline(text)) {
    const font = run.code ? 'F4' : run.bold || base === 'F2' ? 'F2' : run.italic ? 'F3' : base;
    run.text.split('\n').forEach((line, index) => {
      if (index) out.push({ lineBreak: true });
      for (const piece of line.split(/(\s+)/)) if (piece) out.push({ text: piece, font, space: /^\s+$/.test(piece) });
    });
  }
  return out;
}

function wrap(items, size, maxWidth) {
  const lines = [[]];
  let used = 0;

  for (const item of items) {
    if (item.lineBreak) {
      lines.push([]);
      used = 0;
      continue;
    }
    const w = width(item.text, item.font, size);
    if (used + w > maxWidth && !item.space && lines.at(-1).length) {
      lines.push([]);
      used = 0;
    }
    if (item.space && !lines.at(-1).length) continue;
    lines.at(-1).push({ ...item, w });
    used += w;
  }

  for (const line of lines) while (line.at(-1)?.space) line.pop();
  return lines;
}

function createLayout() {
  const pages = [[]];
  const bottom = PAGE.height - 2 * PAGE.margin;
  let top = 0;

  return {
    pages,
    gap: amount => { top += amount; },
    line(segments, { size, leading, x }) {
      top += leading;
      if (top > bottom) {
        pages.push([]);
        top = leading;
      }
      const y = PAGE.height - PAGE.margin - top;
      const groups = [];
      for (const segment of segments) {
        const last = groups.at(-1);
        if (last && last.font === segment.font && !last.fixed && !segment.fixed) {
          last.text += segment.text;
          last.w += segment.w;
        } else groups.push({ ...segment });
      }
      let cursor = x;
      for (const group of groups) {
        pages.at(-1).push(`BT /${group.font} ${size} Tf ${cursor.toFixed(2)} ${y.toFixed(2)} Td (${pdfString(group.text)}) Tj ET`);
        cursor += group.w;
      }
    },
  };
}

function paragraphLines(layout, text, { size, leading, base = 'F1', x = PAGE.margin, maxWidth = TEXT_WIDTH }) {
  for (const line of wrap(tokens(text, base), size, maxWidth)) layout.line(line, { size, leading, x });
}

const EMITTERS = {
  heading(layout, block) {
    const size = HEADING_SIZES[block.level] ?? 12;
    layout.gap(size * 0.6);
    paragraphLines(layout, block.text, { size, leading: size * 1.3, base: 'F2' });
    layout.gap(size * 0.25);
  },
  paragraph(layout, block) {
    paragraphLines(layout, block.text, { size: 11, leading: 15 });
    layout.gap(6);
  },
  bullet(layout, block) {
    const indent = 28;
    const lines = wrap(tokens(block.text, 'F1'), 11, TEXT_WIDTH - indent);
    lines.forEach((line, index) => {
      if (index === 0) {
        const marker = { text: block.marker, font: 'F1', w: indent - 10, fixed: true };
        layout.line([marker, ...line], { size: 11, leading: 15, x: PAGE.margin + 10 });
      } else layout.line(line, { size: 11, leading: 15, x: PAGE.margin + indent });
    });
    layout.gap(2);
  },
  code(layout, block) {
    const size = 9.5;
    const chars = Math.floor((TEXT_WIDTH - 12) / (size * 0.6));
    for (const source of block.text.split('\n')) {
      for (const text of source.match(new RegExp(`.{1,${chars}}`, 'g')) ?? ['']) {
        layout.line([{ text, font: 'F4', w: text.length * size * 0.6 }], { size, leading: 12.5, x: PAGE.margin + 6 });
      }
    }
    layout.gap(6);
  },
  table(layout, block) {
    EMITTERS.paragraph(layout, { text: rowsToLines(block.rows).join('\n') });
  },
};

function serialize(pages) {
  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pages.map((_, i) => `${7 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  FONT_NAMES.forEach((name, i) => {
    objects[3 + i] = `<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`;
  });

  pages.forEach((operations, i) => {
    const content = operations.join('\n');
    objects[7 + i * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ${8 + i * 2} 0 R >>`;
    objects[8 + i * 2] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });

  let out = '%PDF-1.4\n';
  const offsets = [];
  for (let n = 1; n < objects.length; n++) {
    offsets[n] = out.length;
    out += `${n} 0 obj\n${objects[n]}\nendobj\n`;
  }

  const xref = out.length;
  out += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  out += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return out;
}

export function toPdf(markdown) {
  const layout = createLayout();
  for (const block of parseBlocks(markdown)) EMITTERS[block.type](layout, block);
  return new Blob([serialize(layout.pages)], { type: 'application/pdf' });
}
