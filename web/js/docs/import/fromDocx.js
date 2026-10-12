import { readZip } from '../zip/readZip.js';
import { parseXml } from './parseXml.js';

const HEADING = /^(?:heading|t[ií]tulo|ttulo)\s*(\d)$/i;
const BULLET = /^[•·▪◦]\s+/;
const children = (node, name) => [...node.children].filter(child => child.nodeName === name);

function runsText(node) {
  let text = '';
  for (const child of node.childNodes) {
    if (child.nodeName === 'w:t') text += child.textContent;
    else if (child.nodeName === 'w:tab') text += '\t';
    else if (child.nodeName === 'w:br') text += '\n';
    else if (child.nodeType === 1) text += runsText(child);
  }
  return text;
}

function paragraph(node) {
  const text = runsText(node);
  if (!text.trim()) return '';
  const style = node.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val') ?? '';
  const level = style.match(HEADING)?.[1];
  if (level) return `${'#'.repeat(Number(level))} ${text}`;
  if (/^(title|t[ií]tulo|ttulo)$/i.test(style)) return `# ${text}`;
  if (BULLET.test(text)) return `- ${text.replace(BULLET, '')}`;
  if (/^\d+[.)]\t/.test(text)) return text.replace('\t', ' ');
  return node.getElementsByTagName('w:numPr').length ? `- ${text}` : text;
}

function table(node) {
  return children(node, 'w:tr').map(row => {
    const cells = children(row, 'w:tc').map(cell => children(cell, 'w:p').map(runsText).join(' ').trim());
    return `| ${cells.join(' | ')} |`;
  }).join('\n');
}

function block(node) {
  if (node.nodeName === 'w:p') return paragraph(node);
  if (node.nodeName === 'w:tbl') return table(node);
  if (node.nodeName === 'w:sdt') return [...(node.getElementsByTagName('w:sdtContent')[0]?.children ?? [])].map(block).filter(Boolean).join('\n\n');
  return '';
}

export async function fromDocx(file) {
  const zip = await readZip(await file.arrayBuffer());
  const xml = await zip.text('word/document.xml');
  if (!xml) throw new Error('el .docx no contiene word/document.xml');
  const body = parseXml(xml).getElementsByTagName('w:body')[0];
  return [...body.children].map(block).filter(Boolean).join('\n\n');
}
