import { parseBlocks, parseInline, rowsToLines } from './blocks.js';

function escapeRtf(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = text.charCodeAt(i);
    if (char === '\\' || char === '{' || char === '}') out += `\\${char}`;
    else if (char === '\n') out += '\\line ';
    else if (char === '\t') out += '\\tab ';
    else if (code > 126) out += `\\u${code > 32767 ? code - 65536 : code}?`;
    else out += char;
  }
  return out;
}

const inline = text => parseInline(text).map(({ text: value, bold, italic, code }) => {
  const safe = escapeRtf(value);
  if (code) return `{\\f1 ${safe}}`;
  if (bold) return `{\\b ${safe}}`;
  return italic ? `{\\i ${safe}}` : safe;
}).join('');

const SIZES = { 1: 40, 2: 32, 3: 27 };

function blockRtf(block) {
  switch (block.type) {
    case 'heading': return `\\pard\\sb240\\sa120\\b\\fs${SIZES[block.level] ?? 24} ${inline(block.text)}\\b0\\fs22\\par`;
    case 'bullet': return `\\pard\\sa60\\li720\\fi-360 ${escapeRtf(block.marker)}\\tab ${inline(block.text)}\\par`;
    case 'code': return `\\pard\\sa160\\f1\\fs20 ${escapeRtf(block.text)}\\f0\\fs22\\par`;
    case 'table': return `\\pard\\sa160 ${escapeRtf(rowsToLines(block.rows).join('\n'))}\\par`;
    default: return `\\pard\\sa160 ${inline(block.text)}\\par`;
  }
}

export function toRtf(markdown) {
  const body = parseBlocks(markdown).map(blockRtf).join('\n');
  const rtf = `{\\rtf1\\ansi\\ansicpg1252\\deff0{\\fonttbl{\\f0 Calibri;}{\\f1 Consolas;}}\\f0\\fs22\n${body}\n}`;
  return new Blob([rtf], { type: 'application/rtf' });
}
