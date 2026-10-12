const SKIP_GROUPS = new Set(['fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'header', 'footer']);
const TOKEN = /\\([a-z]+)(-?\d+)? ?|\\'([0-9a-f]{2})|\\([\\{}])|(\\\*)|([{}])|([^\\{}]+)/gi;

export async function fromRtf(file) {
  const source = await file.text();
  let out = '';
  let depth = 0;
  let skipFrom = null;
  let fallback = 0;

  for (const [, word, number, hex, escaped, star, brace, text] of source.matchAll(TOKEN)) {
    if (brace === '{') depth++;
    else if (brace === '}') {
      if (skipFrom === depth) skipFrom = null;
      depth--;
    } else if (skipFrom !== null) continue;
    else if (star) skipFrom = depth;
    else if (escaped) out += escaped;
    else if (hex) {
      if (fallback) fallback = 0;
      else out += String.fromCharCode(parseInt(hex, 16));
    } else if (word) {
      if (SKIP_GROUPS.has(word)) skipFrom = depth;
      else if (word === 'par' || word === 'line') out += '\n';
      else if (word === 'tab') out += '\t';
      else if (word === 'u') {
        const code = Number(number);
        out += String.fromCharCode(code < 0 ? code + 65536 : code);
        fallback = 1;
      }
    } else if (text) {
      const clean = text.replace(/[\r\n]/g, '');
      out += fallback ? clean.slice(1) : clean;
      fallback = 0;
    }
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}
