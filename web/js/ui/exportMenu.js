import { el } from '../core/dom.js';
import { downloadBlob } from '../core/text.js';
import { toast } from '../core/toast.js';
import { FORMATS, exportDocument } from '../docs/export/exportDocument.js';

// Selector «Exportar como…» que genera y descarga el documento en el formato elegido.
export function exportMenu(getText, getName) {
  const onChange = event => {
    const format = event.target.value;
    event.target.value = '';
    if (!format) return;
    try {
      const { blob, filename } = exportDocument(format, getText(), getName());
      downloadBlob(filename, blob);
      toast(`Documento creado: ${filename}`, 'ok');
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  return el('select', { title: 'Crear documento', onChange }, [
    el('option', { value: '' }, 'Exportar como…'),
    ...Object.entries(FORMATS).map(([value, { label }]) => el('option', { value }, label)),
  ]);
}
