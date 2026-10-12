const escapeHtml = text => text.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);

export function renderMarkdown(source) {
  const blocks = [];

  let text = escapeHtml(source).replace(/```([\w-]*)\n([\s\S]*?)(```|$)/g, (_, lang, code) => {
    blocks.push(`<pre data-lang="${lang}"><code>${code.replace(/\n$/, '')}</code></pre>`);
    return `\u0000${blocks.length - 1}\u0000`;
  });

  text = text
    .replace(/^### (.*)$/gm, '<h4>$1</h4>')
    .replace(/^## (.*)$/gm, '<h3>$1</h3>')
    .replace(/^# (.*)$/gm, '<h2>$1</h2>')
    .replace(/^(?:- |\* )(.*)$/gm, '<li>$1</li>')
    .replace(/(?:<li>.*<\/li>\n?)+/g, list => `<ul>${list}</ul>`)
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*/g, '$1<em>$2</em>');

  const html = text
    .split(/\n{2,}/)
    .map(part => (/^\s*(<(h\d|ul|pre)|\u0000)/.test(part) ? part : `<p>${part.replace(/\n/g, '<br>')}</p>`))
    .join('');

  return html.replace(/\u0000(\d+)\u0000/g, (_, index) => blocks[index]);
}
