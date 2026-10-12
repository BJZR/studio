// Modelo común de documento: Markdown -> bloques que usan todos los exportadores.

const TABLE_ROW = /^\s*\|.*\|\s*$/;
const SEPARATOR = /^[\s:|-]+$/;

export function parseBlocks(markdown) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', text: paragraph.join('\n') });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;

    if (line.startsWith('```')) {
      flush();
      const code = [];
      for (i++; i < lines.length && !lines[i].startsWith('```'); i++) code.push(lines[i]);
      blocks.push({ type: 'code', text: code.join('\n') });
    } else if ((match = line.match(/^(#{1,6})\s+(.*)$/))) {
      flush();
      blocks.push({ type: 'heading', level: match[1].length, text: match[2] });
    } else if ((match = line.match(/^\s*([-*•]|\d+[.)])\s+(.*)$/))) {
      flush();
      const ordered = /\d/.test(match[1]);
      blocks.push({ type: 'bullet', ordered, marker: ordered ? match[1] : '•', text: match[2] });
    } else if (TABLE_ROW.test(line)) {
      flush();
      const rows = [];
      for (; i < lines.length && TABLE_ROW.test(lines[i]); i++) {
        if (SEPARATOR.test(lines[i])) continue;
        rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim()));
      }
      i--;
      blocks.push({ type: 'table', rows });
    } else if (!line.trim()) {
      flush();
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

export function parseInline(text) {
  const runs = [];
  const pattern = /\*\*(.+?)\*\*|\*(?!\s)([^*]+?)\*|`([^`]+)`/g;
  let last = 0;
  let match;

  while ((match = pattern.exec(text))) {
    if (match.index > last) runs.push({ text: text.slice(last, match.index) });
    if (match[1] !== undefined) runs.push({ text: match[1], bold: true });
    else if (match[2] !== undefined) runs.push({ text: match[2], italic: true });
    else runs.push({ text: match[3], code: true });
    last = pattern.lastIndex;
  }
  if (last < text.length) runs.push({ text: text.slice(last) });
  return runs;
}

export const plainText = text => parseInline(text).map(run => run.text).join('');
export const rowsToLines = rows => rows.map(row => row.join(' | '));
