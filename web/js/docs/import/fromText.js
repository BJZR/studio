export async function fromText(file) {
  const text = await file.text();
  if (/\u0000|\uFFFD{3}/.test(text)) {
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'desconocido';
    throw new Error(`formato .${ext} no soportado`);
  }
  return text;
}
