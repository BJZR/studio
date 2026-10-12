import { readZip } from '../zip/readZip.js';
import { parseXml } from './parseXml.js';

const sheetNumber = name => Number(name.match(/sheet(\d+)\.xml$/)[1]);
const columnIndex = ref => [...ref.replace(/\d+/g, '')].reduce((n, char) => n * 26 + char.charCodeAt(0) - 64, 0) - 1;
const joinText = node => [...node.getElementsByTagName('t')].map(t => t.textContent).join('');

function cellValue(cell, shared) {
  const type = cell.getAttribute('t');
  const value = cell.getElementsByTagName('v')[0]?.textContent ?? '';
  if (type === 's') return shared[Number(value)] ?? '';
  if (type === 'inlineStr') return joinText(cell);
  return value;
}

export async function fromXlsx(file) {
  const zip = await readZip(await file.arrayBuffer());
  const sharedXml = await zip.text('xl/sharedStrings.xml');
  const shared = sharedXml ? [...parseXml(sharedXml).getElementsByTagName('si')].map(joinText) : [];
  const sheets = zip.names().filter(name => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort((a, b) => sheetNumber(a) - sheetNumber(b));
  const parts = [];

  for (const name of sheets) {
    const rows = [...parseXml(await zip.text(name)).getElementsByTagName('row')].map(row => {
      const values = [];
      for (const cell of row.getElementsByTagName('c')) values[columnIndex(cell.getAttribute('r'))] = cellValue(cell, shared);
      return `| ${Array.from(values, value => value ?? '').join(' | ')} |`;
    });
    parts.push(`## Hoja ${sheetNumber(name)}\n\n${rows.join('\n')}`);
  }
  return parts.join('\n\n');
}
