export function stripFence(text) {
  const match = text.trim().match(/^```[\w-]*\n([\s\S]*?)\n?```$/);
  return match ? match[1] : text;
}

export function copyText(text) {
  return navigator.clipboard.writeText(text);
}

export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(filename, text) {
  downloadBlob(filename, new Blob([text], { type: 'text/plain;charset=utf-8' }));
}
