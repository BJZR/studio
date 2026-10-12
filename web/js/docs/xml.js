const INVALID = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

export const escapeXml = text => text.replace(INVALID, '').replace(/[&<>"']/g, char => ENTITIES[char]);
