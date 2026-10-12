import { writeZip } from '../zip/writeZip.js';
import { escapeXml } from '../xml.js';
import { parseBlocks, parseInline, rowsToLines } from './blocks.js';

const MIME = 'application/vnd.oasis.opendocument.text';
const XML = '<?xml version="1.0" encoding="UTF-8"?>';
const NS = 'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"';

const HEADING_SIZES = [20, 16, 13.5, 12];

const paragraphStyle = (name, paragraph, text = '') =>
  `<style:style style:name="${name}" style:family="paragraph"><style:paragraph-properties ${paragraph}/>${text && `<style:text-properties ${text}/>`}</style:style>`;
const textStyle = (name, text) => `<style:style style:name="${name}" style:family="text"><style:text-properties ${text}/></style:style>`;

const STYLES = `<office:automatic-styles>${[
  ...HEADING_SIZES.map((size, i) => paragraphStyle(`H${i + 1}`, 'fo:margin-top="0.4cm" fo:margin-bottom="0.2cm"', `fo:font-size="${size}pt" fo:font-weight="bold"`)),
  paragraphStyle('P', 'fo:margin-bottom="0.25cm"'),
  paragraphStyle('Item', 'fo:margin-left="1cm" fo:text-indent="-0.6cm" fo:margin-bottom="0.1cm"'),
  paragraphStyle('Code', 'fo:background-color="#f2f2f2" fo:margin-bottom="0.25cm"', 'fo:font-family="Courier New" fo:font-size="10pt"'),
  textStyle('B', 'fo:font-weight="bold"'),
  textStyle('I', 'fo:font-style="italic"'),
  textStyle('C', 'fo:font-family="Courier New"'),
].join('')}</office:automatic-styles>`;

const MANIFEST = `${XML}<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="/" manifest:media-type="${MIME}"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/></manifest:manifest>`;

function odfText(text) {
  return escapeXml(text)
    .replace(/ {2,}/g, spaces => ` <text:s text:c="${spaces.length - 1}"/>`)
    .replace(/\n/g, '<text:line-break/>')
    .replace(/\t/g, '<text:tab/>');
}

function inline(text) {
  return parseInline(text).map(({ text: value, bold, italic, code }) => {
    const style = code ? 'C' : bold ? 'B' : italic ? 'I' : '';
    return style ? `<text:span text:style-name="${style}">${odfText(value)}</text:span>` : odfText(value);
  }).join('');
}

const BLOCKS = {
  heading: block => `<text:h text:style-name="H${Math.min(block.level, 4)}" text:outline-level="${block.level}">${inline(block.text)}</text:h>`,
  paragraph: block => `<text:p text:style-name="P">${inline(block.text)}</text:p>`,
  bullet: block => `<text:p text:style-name="Item">${odfText(block.marker)}<text:tab/>${inline(block.text)}</text:p>`,
  code: block => `<text:p text:style-name="Code">${odfText(block.text)}</text:p>`,
  table: block => `<text:p text:style-name="P">${odfText(rowsToLines(block.rows).join('\n'))}</text:p>`,
};

export function toOdt(markdown) {
  const body = parseBlocks(markdown).map(block => BLOCKS[block.type](block)).join('');
  const content = `${XML}<office:document-content ${NS} office:version="1.2">${STYLES}<office:body><office:text>${body}</office:text></office:body></office:document-content>`;

  return writeZip([
    { name: 'mimetype', data: MIME },
    { name: 'META-INF/manifest.xml', data: MANIFEST },
    { name: 'content.xml', data: content },
  ], MIME);
}
