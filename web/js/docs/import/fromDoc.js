// .doc binario (Word 97-2003): extracción aproximada de los bloques de texto legible.
const READABLE = /[\p{L}\p{N}\p{P}\p{Zs}\r\n\t]{25,}/gu;

function readableRuns(text) {
  return (text.match(READABLE) ?? []).join('\n');
}

export async function fromDoc(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const candidates = [
    readableRuns(new TextDecoder('windows-1252').decode(bytes)),
    readableRuns(new TextDecoder('utf-16le').decode(bytes)),
    readableRuns(new TextDecoder('utf-16le').decode(bytes.subarray(1))),
  ];
  const best = candidates.reduce((a, b) => (b.length > a.length ? b : a));
  if (!best) throw new Error('no se encontró texto legible en el .doc');
  return best.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
