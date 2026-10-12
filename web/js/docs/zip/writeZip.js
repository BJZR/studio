import { crc32 } from './crc32.js';

const encoder = new TextEncoder();
const u16 = n => [n & 255, (n >>> 8) & 255];
const u32 = n => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];

// ZIP sin compresión (método 0): suficiente para docx/odt y muy simple.
export function writeZip(entries, mimeType = 'application/zip') {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const { name, data } of entries) {
    const nameBytes = encoder.encode(name);
    const bytes = typeof data === 'string' ? encoder.encode(data) : data;
    const crc = crc32(bytes);
    const common = [...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(bytes.length), ...u32(bytes.length), ...u16(nameBytes.length), ...u16(0)];

    chunks.push(Uint8Array.from([...u32(0x04034b50), ...u16(20), ...common]), nameBytes, bytes);
    central.push(Uint8Array.from([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...common,
      ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset),
    ]), nameBytes);
    offset += 30 + nameBytes.length + bytes.length;
  }

  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = Uint8Array.from([
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(entries.length), ...u16(entries.length),
    ...u32(centralSize), ...u32(offset), ...u16(0),
  ]);

  return new Blob([...chunks, ...central, end], { type: mimeType });
}
