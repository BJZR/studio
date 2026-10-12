import { readZip } from '../zip/readZip.js';
import { parseXml } from './parseXml.js';

const slideNumber = name => Number(name.match(/slide(\d+)\.xml$/)[1]);

export async function fromPptx(file) {
  const zip = await readZip(await file.arrayBuffer());
  const slides = zip.names().filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort((a, b) => slideNumber(a) - slideNumber(b));
  const parts = [];

  for (const name of slides) {
    const doc = parseXml(await zip.text(name));
    const lines = [...doc.getElementsByTagName('a:p')]
      .map(p => [...p.getElementsByTagName('a:t')].map(t => t.textContent).join(''))
      .filter(line => line.trim());
    parts.push(`## Diapositiva ${slideNumber(name)}\n\n${lines.join('\n')}`);
  }
  return parts.join('\n\n');
}
