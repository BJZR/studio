import { fromText } from './fromText.js';
import { fromDocx } from './fromDocx.js';
import { fromOdt } from './fromOdt.js';
import { fromPptx } from './fromPptx.js';
import { fromXlsx } from './fromXlsx.js';
import { fromPdf } from './fromPdf.js';
import { fromRtf } from './fromRtf.js';
import { fromDoc } from './fromDoc.js';
import { fromHtml } from './fromHtml.js';

const READERS = {
  docx: fromDocx, odt: fromOdt, pptx: fromPptx, xlsx: fromXlsx,
  pdf: fromPdf, rtf: fromRtf, doc: fromDoc, html: fromHtml, htm: fromHtml,
};

const NOTES = {
  doc: 'El .doc antiguo se leyó de forma aproximada; para mejor resultado guárdalo como .docx.',
};

export const ACCEPT = '.txt,.md,.markdown,.csv,.tsv,.json,.xml,.yaml,.yml,.log,.html,.htm,.rtf,.doc,.docx,.odt,.pptx,.xlsx,.pdf,.js,.go,.css';

const extensionOf = name => name.split('.').pop().toLowerCase();

export async function readDocuments(files) {
  const list = [...files];
  const notes = new Set();
  const parts = [];

  for (const file of list) {
    const ext = extensionOf(file.name);
    let text;
    try {
      text = (await (READERS[ext] ?? fromText)(file)).trim();
    } catch (error) {
      throw new Error(`${file.name}: ${error.message}`);
    }
    if (NOTES[ext]) notes.add(NOTES[ext]);
    parts.push(list.length > 1 ? `# ${file.name}\n\n${text}` : text);
  }
  return { text: parts.join('\n\n'), notes: [...notes] };
}
