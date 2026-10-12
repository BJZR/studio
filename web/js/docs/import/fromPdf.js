// pdf.js se carga bajo demanda desde cdnjs solo al importar un PDF.
const BASE = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';

function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${BASE}/pdf.min.js`;
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${BASE}/pdf.worker.min.js`;
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error('no se pudo cargar pdf.js (¿sin conexión?)'));
    document.head.append(script);
  });
}

export async function fromPdf(file) {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];

  for (let number = 1; number <= pdf.numPages; number++) {
    const content = await (await pdf.getPage(number)).getTextContent();
    const text = content.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('');
    pages.push(text.replace(/ +\n/g, '\n').trim());
  }
  return pages.filter(Boolean).join('\n\n');
}
