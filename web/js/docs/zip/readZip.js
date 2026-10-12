import { inflateRaw } from './inflate.js';

const decoder = new TextDecoder();

export async function readZip(buffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  let eocd = bytes.length - 22;
  while (eocd >= 0 && view.getUint32(eocd, true) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error('No es un archivo ZIP/Office válido.');

  const count = view.getUint16(eocd + 10, true);
  let pointer = view.getUint32(eocd + 16, true);
  const entries = new Map();

  for (let i = 0; i < count; i++) {
    const nameLength = view.getUint16(pointer + 28, true);
    const extraLength = view.getUint16(pointer + 30, true);
    const commentLength = view.getUint16(pointer + 32, true);
    const name = decoder.decode(bytes.subarray(pointer + 46, pointer + 46 + nameLength));
    entries.set(name, {
      method: view.getUint16(pointer + 10, true),
      size: view.getUint32(pointer + 20, true),
      offset: view.getUint32(pointer + 42, true),
    });
    pointer += 46 + nameLength + extraLength + commentLength;
  }

  async function read(name) {
    const entry = entries.get(name);
    if (!entry) return null;
    const start = entry.offset + 30 + view.getUint16(entry.offset + 26, true) + view.getUint16(entry.offset + 28, true);
    const data = bytes.subarray(start, start + entry.size);
    if (entry.method === 0) return data;
    if (entry.method === 8) return inflateRaw(data);
    throw new Error(`Compresión ZIP no soportada (${entry.method}).`);
  }

  return {
    names: () => [...entries.keys()],
    bytes: read,
    async text(name) {
      const data = await read(name);
      return data ? decoder.decode(data) : null;
    },
  };
}
