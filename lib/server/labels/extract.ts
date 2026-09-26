// Literal SPL section extraction (task 1.10 / A2).
//
// The extractor walks the parsed SPL document in document order and renders the
// narrative <text> of each target section with deterministic whitespace rules.
// It never reorders words, never decodes entities twice, never adds headings,
// bullets, explanations or advice, and never silently drops content: any
// narrative element it does not know how to render is a rejection.

import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { LabelSection } from '@/components/data/types';

export type SectionResult =
  | { status: 'present'; section: LabelSection & { text: string } }
  | { status: 'absent'; loinc: string }
  | { status: 'invalid'; loinc: string; detail: string };

export const SECTION_CODES = ['34066-1', '34067-9', '43685-7', '34068-7'] as const;

export type SectionTitle = (typeof SECTION_CODES)[number];

export const SECTION_TITLES: Record<SectionTitle, string> = {
  '34066-1': 'BOXED WARNING',
  '34067-9': 'INDICATIONS AND USAGE',
  '43685-7': 'WARNINGS AND PRECAUTIONS',
  '34068-7': 'DOSAGE AND ADMINISTRATION',
};

// Narrative elements the renderer knows how to render. Anything else inside a
// section's <text> tree is treated as unsupported content and rejected, because
// dropping it would hide meaningful label content.
const KNOWN_TEXT_TAGS = new Set([
  'text',
  'paragraph',
  'list',
  'item',
  'table',
  'caption',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'content',
  'linkHtml',
  'sup',
  'sub',
  'br',
  'footnote',
  'footnoteRef',
  'highlight',
  'excerpt',
]);

const TARGET_SET = new Set<string>(SECTION_CODES);

type OrderedNode = Record<string, unknown> & {
  ':@'?: Record<string, string>;
};

function newOrderedParser(): XMLParser {
  return new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    attributeNamePrefix: '',
    trimValues: false,
    parseTagValue: false,
    parseAttributeValue: false,
    allowDTD: false,
    processEntities: true,
  });
}

function tagName(node: OrderedNode): string | null {
  for (const key of Object.keys(node)) {
    if (key !== ':@') return key;
  }
  return null;
}

function children(node: OrderedNode): OrderedNode[] {
  const out: OrderedNode[] = [];
  for (const [key, value] of Object.entries(node)) {
    if (key === ':@') continue;
    if (Array.isArray(value)) {
      for (const child of value) {
        if (typeof child === 'object' && child !== null) out.push(child as OrderedNode);
      }
    }
  }
  return out;
}

function attributes(node: OrderedNode): Record<string, string> {
  return node[':@'] ?? {};
}

function textValue(node: OrderedNode): string {
  const out: string[] = [];
  for (const [key, value] of Object.entries(node)) {
    if (key === ':@') continue;
    if (typeof value === 'string') out.push(value);
  }
  return out.join('');
}

function findSections(node: OrderedNode, out: OrderedNode[]): void {
  const name = tagName(node);
  if (name === 'section') {
    out.push(node);
    // Keep walking: nested sections are matched by their own code too.
  }
  for (const child of children(node)) findSections(child, out);
}

/** A section's own code is its first <code> child; codes nested deeper do not count. */
function sectionOwnCode(sectionNode: OrderedNode): string | null {
  for (const child of children(sectionNode)) {
    if (tagName(child) === 'code') {
      const code = attributes(child)['code'];
      if (typeof code === 'string') return code;
      return null;
    }
  }
  return null;
}

function directTextChild(sectionNode: OrderedNode): OrderedNode | null {
  for (const child of children(sectionNode)) {
    if (tagName(child) === 'text') return child;
  }
  // Sections like the highlights excerpt wrap text in excerpt/highlight.
  for (const child of children(sectionNode)) {
    const name = tagName(child);
    if (name === 'excerpt' || name === 'highlight') {
      const nested = directTextChild(child);
      if (nested !== null) return nested;
    }
  }
  return null;
}

type Rendered = { ok: true; text: string } | { ok: false; detail: string };

function isKnown(name: string): boolean {
  return KNOWN_TEXT_TAGS.has(name);
}

/**
 * Render narrative children in document order.
 * - '#text' nodes emit their raw text in place
 * - block tags (paragraph/item/caption/tr) always emit a leading newline
 * - table cells (th/td) emit a tab before their text (except the first cell)
 * - inline tags (content/sup/sub/linkHtml/footnote) are transparent
 * - <br> emits a newline
 * Multiple newlines collapse to one at the end of the section.
 */
function renderChildren(nodes: OrderedNode[]): Rendered {
  let out = '';
  for (const node of nodes) {
    const name = tagName(node);
    if (name === null) continue;
    if (name === '#text') {
      const raw = textValue(node);
      // Whitespace-only text between elements is indentation, not content.
      if (raw.trim().length === 0) continue;
      out += raw;
      continue;
    }
    if (!isKnown(name)) return { ok: false, detail: `unsupported element <${name}> in narrative text` };
    const inner = renderChildren(children(node));
    if (!inner.ok) return inner;
    const body = inner.text;
    if (name === 'br') {
      out += '\n';
    } else if (name === 'paragraph' || name === 'item' || name === 'caption' || name === 'tr') {
      out += '\n' + collapseInline(body);
    } else if (name === 'th' || name === 'td') {
      out += (out === '' ? '' : '\t') + collapseInline(body).replace(/^\n+/, '');
    } else {
      out += body; // transparent: text, list, table, thead/tbody/tfoot, content, sup, sub, linkHtml, excerpt, highlight, footnote*
    }
  }
  return { ok: true, text: out };
}

function collapseInline(value: string): string {
  // Preserve \t (table cell separator); collapse spaces only.
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/ +/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

export function extractSections(xml: string): SectionResult[] {
  let parsed: OrderedNode[] | null = null;
  try {
    const validation = XMLValidator.validate(xml, { allowDTD: false });
    if (validation === false || typeof validation === 'object') throw new Error('bad xml');
    parsed = newOrderedParser().parse(xml) as OrderedNode[];
  } catch {
    return SECTION_CODES.map((loinc) => ({ status: 'invalid', loinc, detail: 'malformed XML' }));
  }

  const sections: OrderedNode[] = [];
  for (const node of parsed) findSections(node, sections);

  const byCode = new Map<string, OrderedNode[]>();
  for (const section of sections) {
    const code = sectionOwnCode(section);
    if (code === null || !TARGET_SET.has(code)) continue;
    const existing = byCode.get(code);
    if (existing === undefined) byCode.set(code, [section]);
    else existing.push(section);
  }

  const results: SectionResult[] = [];
  for (const loinc of SECTION_CODES) {
    const matches = byCode.get(loinc);
    if (matches === undefined || matches.length === 0) {
      results.push({ status: 'absent', loinc });
      continue;
    }
    if (matches.length > 1) {
      results.push({ status: 'invalid', loinc, detail: `ambiguous: ${matches.length} sections carry code ${loinc}` });
      continue;
    }
    const textNode = directTextChild(matches[0]);
    if (textNode === null) {
      results.push({ status: 'invalid', loinc, detail: 'no narrative <text> element in section' });
      continue;
    }
    const rendered = renderChildren(children(textNode));
    if (!rendered.ok) {
      results.push({ status: 'invalid', loinc, detail: rendered.detail });
      continue;
    }
    const text = rendered.text
      .replace(/^\n+/, '')
      .replace(/\n+$/, '')
      .replace(/\n{2,}/g, '\n');
    if (text.length === 0) {
      results.push({ status: 'invalid', loinc, detail: 'empty mandatory section' });
      continue;
    }
    const title = SECTION_TITLES[loinc as SectionTitle];
    results.push({ status: 'present', section: { loinc, title, text } });
  }
  return results;
}