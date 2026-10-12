import { writeZip } from '../zip/writeZip.js';
import { escapeXml } from '../xml.js';
import { parseBlocks, parseInline } from './blocks.js';

const MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const HEADING_SIZES = [32, 28, 24, 22];

const heading = (size, index) => `<w:style w:type="paragraph" w:styleId="Heading${index + 1}"><w:name w:val="heading ${index + 1}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="120"/><w:outlineLvl w:val="${index}"/></w:pPr><w:rPr><w:b/><w:sz w:val="${size}"/></w:rPr></w:style>`;

const STYLES = `${XML}<w:styles ${NS}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:lang w:val="es-ES"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>${HEADING_SIZES.map(heading).join('')}</w:styles>`;

const CONTENT_TYPES = `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
const ROOT_RELS = `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="word/document.xml"/></Relationships>`;
const DOC_RELS = `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/styles" Target="styles.xml"/></Relationships>`;
const SECTION = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>';

function run(text, { bold, italic, code, size } = {}) {
  const props = [
    code && '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>',
    bold && '<w:b/>',
    italic && '<w:i/>',
    size && `<w:sz w:val="${size}"/>`,
  ].filter(Boolean).join('');
  const parts = text.split('\n').map(part => `<w:t xml:space="preserve">${escapeXml(part)}</w:t>`).join('<w:br/>');
  return `<w:r>${props && `<w:rPr>${props}</w:rPr>`}${parts}</w:r>`;
}

const runs = (text, base = {}) => parseInline(text).map(part => run(part.text, { ...base, ...part })).join('');
const paragraph = (content, props = '') => `<w:p>${props && `<w:pPr>${props}</w:pPr>`}${content}</w:p>`;

function table(rows) {
  const columns = Math.max(...rows.map(row => row.length));
  const width = Math.floor(9000 / columns);
  const border = side => `<w:${side} w:val="single" w:sz="4" w:space="0" w:color="999999"/>`;
  const borders = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(border).join('');
  const grid = `<w:tblGrid>${`<w:gridCol w:w="${width}"/>`.repeat(columns)}</w:tblGrid>`;

  const body = rows.map((row, r) => {
    const cells = Array.from({ length: columns }, (_, c) =>
      `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/></w:tcPr>${paragraph(runs(row[c] ?? '', { bold: r === 0 }), '<w:spacing w:after="60"/>')}</w:tc>`);
    return `<w:tr>${cells.join('')}</w:tr>`;
  }).join('');

  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>${borders}</w:tblBorders></w:tblPr>${grid}${body}</w:tbl>`;
}

const BLOCKS = {
  heading: block => paragraph(runs(block.text), `<w:pStyle w:val="Heading${Math.min(block.level, 4)}"/>`),
  paragraph: block => paragraph(runs(block.text)),
  bullet: block => paragraph(`${run(block.marker)}<w:r><w:tab/></w:r>${runs(block.text)}`, '<w:spacing w:after="60"/><w:ind w:left="720" w:hanging="360"/>'),
  code: block => paragraph(run(block.text, { code: true, size: 20 }), '<w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>'),
  table: block => table(block.rows),
};

export function toDocx(markdown) {
  const body = parseBlocks(markdown).map(block => BLOCKS[block.type](block)).join('');
  const document = `${XML}<w:document ${NS}><w:body>${body}<w:p/>${SECTION}</w:body></w:document>`;

  return writeZip([
    { name: '[Content_Types].xml', data: CONTENT_TYPES },
    { name: '_rels/.rels', data: ROOT_RELS },
    { name: 'word/_rels/document.xml.rels', data: DOC_RELS },
    { name: 'word/document.xml', data: document },
    { name: 'word/styles.xml', data: STYLES },
  ], MIME);
}
