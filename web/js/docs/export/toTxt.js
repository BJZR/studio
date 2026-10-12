import { parseBlocks, plainText, rowsToLines } from './blocks.js';

function blockText(block) {
  switch (block.type) {
    case 'bullet': return `${block.marker} ${plainText(block.text)}`;
    case 'table': return rowsToLines(block.rows).join('\n');
    case 'code': return block.text;
    default: return plainText(block.text);
  }
}

export function toTxt(markdown) {
  const text = parseBlocks(markdown).reduce((out, block, index, blocks) => {
    const separator = index === 0 ? '' : block.type === 'bullet' && blocks[index - 1].type === 'bullet' ? '\n' : '\n\n';
    return out + separator + blockText(block);
  }, '');
  return new Blob([text], { type: 'text/plain;charset=utf-8' });
}
