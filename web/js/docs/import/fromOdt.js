import { readZip } from '../zip/readZip.js';
import { parseXml } from './parseXml.js';

function inline(node) {
  let text = '';
  for (const child of node.childNodes) {
    if (child.nodeType === 3) text += child.nodeValue;
    else if (child.nodeName === 'text:s') text += ' '.repeat(Number(child.getAttribute('text:c') ?? 1));
    else if (child.nodeName === 'text:tab') text += '\t';
    else if (child.nodeName === 'text:line-break') text += '\n';
    else text += inline(child);
  }
  return text;
}

function block(node) {
  switch (node.nodeName) {
    case 'text:h': return `${'#'.repeat(Number(node.getAttribute('text:outline-level') ?? 1))} ${inline(node)}`;
    case 'text:p': return inline(node).replace(/^[•·▪◦]\s+/, '- ');
    case 'text:list': return [...node.getElementsByTagName('text:p')].map(p => `- ${inline(p)}`).join('\n');
    case 'table:table':
      return [...node.getElementsByTagName('table:table-row')].map(row => {
        const cells = [...row.getElementsByTagName('table:table-cell')].map(cell => inline(cell).replace(/\n/g, ' '));
        return `| ${cells.join(' | ')} |`;
      }).join('\n');
    default: return '';
  }
}

export async function fromOdt(file) {
  const zip = await readZip(await file.arrayBuffer());
  const xml = await zip.text('content.xml');
  if (!xml) throw new Error('el .odt no contiene content.xml');
  const office = parseXml(xml).getElementsByTagName('office:text')[0];
  return [...office.children].map(block).filter(text => text.trim()).join('\n\n');
}
