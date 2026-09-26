// RxNorm identity selection for the verified-label pipeline (task 1.10 / A1).
//
// Raw getDrugs responses are untrusted: they contain packs, other strengths,
// extended-release forms, ingredient-level rows and relabeler variants. The
// selector must prove that exactly one branded product concept matches the
// catalog presentation, never take the first search result, and never
// silently substitute an SCD (generic ingredient) concept for a branded one.

import { XMLParser, XMLValidator } from 'fast-xml-parser';

export type LabelIdentity = {
  drug_id: string;
  rxcui: string;
  rxnorm_name: string;
  rxnorm_tty: 'SBD' | 'SCD';
  setid: string;
  document_id: string;
  version: string;
  effective_time: string;
  source_url: string;
  fetched_at: string;
  source_sha256: string;
};

export type RxConcept = {
  rxcui: string;
  name: string;
  tty: 'SBD' | 'SCD';
};

export type RxNormExpectation = {
  brand: string;
  ingredient: string;
  strength: string;
  form: string;
};

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function isAlnum(char: string | undefined): boolean {
  if (char === undefined) return false;
  return /[a-z0-9]/i.test(char);
}

/** Case-insensitive, whitespace-normalized match of `needle` at a token boundary. */
function indexOfToken(haystack: string, needle: string, from: number): number {
  for (;;) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) return -1;
    const before = idx === 0 ? undefined : haystack[idx - 1];
    const after = idx + needle.length >= haystack.length ? undefined : haystack[idx + needle.length];
    // "30 mg" must not match inside "130 mg"; "apremilast" must not match inside
    // "oxycodapremilast". Letters/digits directly against the match are word-internal.
    if (isAlnum(before) || isAlnum(after)) {
      from = idx + 1;
      continue;
    }
    return idx;
  }
}

function conceptRow(value: unknown, groupTty: string): { rxcui: string; name: string; tty: string } | null {
  if (typeof value !== 'object' || value === null) return null;
  const row = value as Record<string, unknown>;
  const rxcui = row.rxcui;
  const name = row.name;
  // tty on the row wins when present (RxNorm repeats the group tty); fall back
  // to the group tty for malformed-but-tolerable rows.
  const tty = typeof row.tty === 'string' && row.tty.length > 0 ? row.tty : groupTty;
  if (typeof rxcui !== 'string' || rxcui.length === 0) return null;
  if (typeof name !== 'string' || name.length === 0) return null;
  if (typeof tty !== 'string' || tty.length === 0) return null;
  return { rxcui, name, tty };
}

function extractBrandBracket(name: string): string | null {
  const match = /\[([^\[\]]+)\]/.exec(name);
  return match === null ? null : match[1];
}

function matchesExpectation(concept: { rxcui: string; name: string; tty: string }, expected: RxNormExpectation): boolean {
  const { name } = concept;
  // Pack rows are compound descriptions like "{4 (apremilast 30 MG Oral Tablet
  // [Otezla]) / ... } Pack"; braces identify them in every tty.
  if (name.includes('{') || name.includes('}')) return false;
  const brand = extractBrandBracket(name);
  if (brand === null) return false;
  if (normalize(brand) !== normalize(expected.brand)) return false;

  const norm = normalize(name);
  let cursor = 0;
  for (const part of [expected.ingredient, expected.strength, expected.form]) {
    const token = normalize(part);
    if (token.length === 0) return false;
    const idx = indexOfToken(norm, token, cursor);
    if (idx === -1) return false;
    cursor = idx + token.length;
  }
  return true;
}

/**
 * Select the single RxNorm branded drug product concept that matches the
 * catalog presentation. Throws when the response is malformed, when nothing
 * matches, when more than one concept matches (ambiguous), or when only an
 * SCD concept matches (a branded product must be proven, not substituted).
 */
export function selectRxConcept(response: unknown, expected: RxNormExpectation): RxConcept {
  if (typeof response !== 'object' || response === null) {
    throw new Error('RxNorm response: no concept groups (malformed response)');
  }
  const drugGroup = (response as Record<string, unknown>).drugGroup;
  if (typeof drugGroup !== 'object' || drugGroup === null) {
    throw new Error('RxNorm response: no concept groups (missing drugGroup)');
  }
  const groups = (drugGroup as Record<string, unknown>).conceptGroup;
  if (!Array.isArray(groups)) {
    throw new Error('RxNorm response: no concept groups');
  }

  const sbdMatches: Array<{ rxcui: string; name: string; tty: 'SBD' }> = [];
  const scdMatches: Array<{ rxcui: string; name: string; tty: 'SCD' }> = [];

  for (const group of groups) {
    if (typeof group !== 'object' || group === null) continue;
    const groupTty = (group as Record<string, unknown>).tty;
    if (typeof groupTty !== 'string') continue;
    const properties = (group as Record<string, unknown>).conceptProperties;
    if (!Array.isArray(properties)) continue;
    for (const raw of properties) {
      const row = conceptRow(raw, groupTty);
      if (row === null) continue;
      if (!matchesExpectation(row, expected)) continue;
      if (row.tty === 'SBD') sbdMatches.push({ rxcui: row.rxcui, name: row.name, tty: 'SBD' });
      else if (row.tty === 'SCD') scdMatches.push({ rxcui: row.rxcui, name: row.name, tty: 'SCD' });
    }
  }

  if (sbdMatches.length === 1) {
    const only = sbdMatches[0];
    return { rxcui: only.rxcui, name: only.name, tty: 'SBD' };
  }
  if (sbdMatches.length > 1) {
    const list = sbdMatches.map((c) => `${c.rxcui} ${c.name}`).join('; ');
    throw new Error(`RxNorm response: ambiguous branded product concepts (${list})`);
  }
  if (scdMatches.length > 0) {
    const list = scdMatches.map((c) => `${c.rxcui} ${c.name}`).join('; ');
    throw new Error(
      `RxNorm response: no matching SBD; SCD candidate requires explicit identity review (${list})`,
    );
  }
  throw new Error('RxNorm response: no matching concept for the catalog presentation');
}

// ---------------------------------------------------------------------------
// SPL document evidence
// ---------------------------------------------------------------------------

export type SplProduct = {
  brand: string;
  generic: string;
  form: string;
  active_ingredient: string;
  strength_value: string;
  strength_unit: string;
};

export type SplEvidence = {
  document_id: string;
  setid: string;
  version: string;
  effective_time: string;
  labeler: string;
  products: SplProduct[];
};

export type SplExpectation = {
  setid: string;
  brand: string;
  ingredient: string;
  strength: string;
  form: string;
  labeler: string;
};

const HL7_V3_NS = 'urn:hl7-org:v3';

function newSplParser(): XMLParser {
  return new XMLParser({
    // SPL narrative text matters; the value tree is only used for evidence.
    ignoreAttributes: false,
    attributeNamePrefix: '@',
    parseTagValue: false,
    trimValues: false,
    allowDTD: false,
  });
}

function firstNode(node: unknown): Record<string, unknown> | null {
  if (typeof node === 'string') return { '#text': node };
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = firstNode(child);
      if (found !== null) return found;
    }
    return null;
  }
  if (typeof node === 'object' && node !== null) return node as Record<string, unknown>;
  return null;
}

/** Attribute of a parsed element, e.g. attr(node.setId, 'root'). */
function attr(node: unknown, name: string): string | null {
  const found = firstNode(node);
  if (found === null) return null;
  const value = found[`@${name}`];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function findValues(node: unknown, tag: string, out: string[]): void {
  if (Array.isArray(node)) {
    for (const child of node) findValues(child, tag, out);
    return;
  }
  if (typeof node !== 'object' || node === null) return;
  const record = node as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (key === tag) {
      if (typeof value === 'string') out.push(value);
      else if (typeof value === 'object' && value !== null) {
        const valueRecord = value as Record<string, unknown>;
        // Self-closing elements may arrive as { '#text': '', '@root': ... }.
        const text = valueRecord['#text'];
        if (typeof text === 'string') out.push(text);
      }
    }
    findValues(value, tag, out);
  }
}

function collectProducts(node: unknown, out: SplProduct[]): void {
  if (Array.isArray(node)) {
    for (const child of node) collectProducts(child, out);
    return;
  }
  if (typeof node !== 'object' || node === null) return;
  const record = node as Record<string, unknown>;
  if ('manufacturedProduct' in record) {
    // The wrapper element has a nested element of the same name; walk into it.
    const nested = firstNode(record.manufacturedProduct);
    if (nested !== null && 'name' in nested && !('manufacturedProduct' in nested)) {
      const brand = asString(nested.name);
      const genericNode = firstNodeAtPath(nested, ['asEntityWithGeneric', 'genericMedicine', 'name']);
      const generic = genericNode !== null ? asString(genericNode) : '';
      const formNode = firstNodeAtPath(nested, ['formCode']);
      const form =
        formNode !== null && typeof formNode['@displayName'] === 'string'
          ? (formNode['@displayName'] as string)
          : '';
      const actibNode = findIngredientWithClass(nested, 'ACTIB');
      const activeNode =
        actibNode !== null
          ? firstNodeAtPath(actibNode, ['ingredientSubstance', 'name'])
          : firstNodeAtPath(nested, ['ingredientSubstance', 'name']);
      const active = activeNode !== null ? asString(activeNode) : '';
      const strengthValue = actibNode !== null ? attr(firstNodeAtPath(actibNode, ['quantity', 'numerator']), 'value') : '';
      const strengthUnit = actibNode !== null ? attr(firstNodeAtPath(actibNode, ['quantity', 'numerator']), 'unit') : '';
      out.push({
        brand,
        generic,
        form,
        active_ingredient: active,
        strength_value: strengthValue === null ? '' : strengthValue,
        strength_unit: strengthUnit === null ? '' : strengthUnit,
      });
    }
  }
  for (const value of Object.values(record)) collectProducts(value, out);
}

function findIngredientWithClass(node: Record<string, unknown>, classCode: string): Record<string, unknown> | null {
  const ingredients = recordArray(node.ingredient);
  for (const ingredient of ingredients) {
    const candidate = firstNode(ingredient);
    if (candidate === null) continue;
    if (candidate['@classCode'] === classCode) return candidate;
  }
  return null;
}

function firstNodeAtPath(node: Record<string, unknown>, path: string[]): Record<string, unknown> | null {
  let current: Record<string, unknown> | null = node;
  for (const segment of path) {
    if (current === null) return null;
    const next = firstNode(current[segment]);
    if (next === null) return null;
    current = next;
  }
  return current;
}

function recordArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'object' && value !== null) return [value];
  return [];
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const text = (value as Record<string, unknown>)['#text'];
    if (typeof text === 'string') return text;
  }
  return '';
}

function assertNoDtdOrEntities(xml: string): void {
  if (/<!DOCTYPE/i.test(xml) || /<!ENTITY/i.test(xml)) {
    throw new Error('SPL document rejected: DTD or external entity declarations are not allowed');
  }
}

export function parseSplEvidence(xml: string): SplEvidence {
  assertNoDtdOrEntities(xml);
  const validation = XMLValidator.validate(xml, { allowDTD: false });
  if (validation === false || typeof validation === 'object') {
    throw new Error('SPL document rejected: malformed XML');
  }
  let parsed: unknown;
  try {
    parsed = newSplParser().parse(xml);
  } catch (error) {
    throw new Error(`SPL document rejected: malformed XML (${String(error)})`);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('SPL document rejected: malformed XML (no document root)');
  }
  const document = (parsed as Record<string, unknown>).document;
  const documentNode = firstNode(document);
  if (documentNode === null) {
    throw new Error('SPL document rejected: malformed XML (no document root)');
  }

  const documentId = attr(documentNode.id, 'root');
  if (documentId === null) throw new Error('SPL document rejected: missing document id');

  const setid = attr(documentNode.setId, 'root');
  if (setid === null) throw new Error('SPL document rejected: missing setId');

  const version = attr(documentNode.versionNumber, 'value');
  if (version === null) throw new Error('SPL document rejected: missing versionNumber');

  const documentEffectiveTime = attr(documentNode.effectiveTime, 'value');
  if (documentEffectiveTime === null) throw new Error('SPL document rejected: missing document effectiveTime');

  const labelerNodes = firstNodeAtPath(documentNode, ['author', 'assignedEntity', 'representedOrganization', 'name']);
  const labeler = labelerNodes !== null ? asString(labelerNodes) : '';
  if (labeler === '') throw new Error('SPL document rejected: missing labeler');

  const products: SplProduct[] = [];
  collectProducts(documentNode, products);

  return {
    document_id: documentId,
    setid,
    version,
    effective_time: documentEffectiveTime,
    labeler,
    products,
  };
}

/**
 * Prove that the fetched SPL document is the catalog's drug: same setId, the
 * labeler matches the manufacturer, and the document explicitly contains the
 * selected presentation (brand + ingredient + strength + form).
 */
export function assertSplIdentity(evidence: SplEvidence, expected: SplExpectation): void {
  if (evidence.setid !== expected.setid) {
    throw new Error(`SPL identity mismatch: setid ${evidence.setid} != catalog ${expected.setid}`);
  }
  if (!normalize(evidence.labeler).includes(normalize(expected.labeler))) {
    throw new Error(`SPL identity mismatch: labeler ${evidence.labeler} != catalog ${expected.labeler}`);
  }
  const strengthParts = expected.strength.trim().split(/\s+/);
  const strengthValue = strengthParts[0] ?? '';
  const strengthUnit = (strengthParts[1] ?? '').toLowerCase();
  const presentationMatch = evidence.products.some(
    (product) =>
      normalize(product.brand) === normalize(expected.brand) &&
      normalize(product.generic) === normalize(expected.ingredient) &&
      product.strength_value === strengthValue &&
      product.strength_unit.toLowerCase() === strengthUnit &&
      (product.form === '' || normalize(product.form) === normalize(expected.form)),
  );
  if (!presentationMatch) {
    throw new Error(
      `SPL identity mismatch: document does not explicitly contain the selected product presentation ` +
        `(${expected.brand} ${expected.strength} ${expected.form})`,
    );
  }
}