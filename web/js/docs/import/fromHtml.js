export async function fromHtml(file) {
  const doc = new DOMParser().parseFromString(await file.text(), 'text/html');
  doc.querySelectorAll('script, style, noscript').forEach(node => node.remove());

  doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
    heading.prepend(`\n\n${'#'.repeat(Number(heading.tagName[1]))} `);
    heading.append('\n\n');
  });
  doc.querySelectorAll('li').forEach(item => item.prepend('\n- '));
  doc.querySelectorAll('td, th').forEach(cell => cell.append(' | '));
  doc.querySelectorAll('p, div, tr, br, section, article, pre, blockquote, ul, ol, table').forEach(node => node.append('\n'));

  return doc.body.textContent.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
