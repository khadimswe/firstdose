// Fetch and verify label source artifacts for one drug (task 1.10 / A1).
//
// Usage: node --import tsx scripts/labels/fetch.ts --drug drug_otezla
//
// Downloads the raw RxNorm getDrugs response and the DailyMed SPL document,
// proves identity on both, and only then publishes the artifacts under
// data/labels/<drug_id>/. A failed or ambiguous fetch leaves any existing
// verified cache untouched. Never guesses an RxCUI or substitutes a product.

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CATALOG } from '@/components/data/catalog';
import {
  assertSplIdentity,
  parseSplEvidence,
  selectRxConcept,
  type LabelIdentity,
} from '@/lib/server/labels/identity';

const FETCH_TIMEOUT_MS = 15_000;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DATA_DIR = resolve(ROOT, 'data/labels');

type DrugCatalogEntry = {
  id: string;
  brand: string;
  generic: string;
  strength: string;
  qty_label: string;
  dailymed_setid: string;
  manufacturer: string;
};

function findDrug(drugId: string): DrugCatalogEntry {
  const drug = (CATALOG.drugs as DrugCatalogEntry[]).find((d) => d.id === drugId);
  if (drug === undefined) {
    console.error(`Unknown drug_id: ${drugId} (no such entry in mock/patients.json)`);
    process.exit(2);
  }
  return drug;
}

function parseArgv(): string {
  const argIndex = process.argv.indexOf('--drug');
  if (argIndex === -1 || argIndex + 1 >= process.argv.length) {
    console.error('Usage: node --import tsx scripts/labels/fetch.ts --drug <drug_id>');
    process.exit(2);
  }
  return process.argv[argIndex + 1];
}

async function fetchWithTimeout(url: string, accept: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept },
      redirect: 'follow',
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/** DailyMed rejects application/xml Accept values with 406; accept anything. */
async function fetchDailyMed(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: '*/*', 'user-agent': 'FirstDose label verification (hackathon demo)' },
      redirect: 'follow',
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRxnorm(drug: DrugCatalogEntry): Promise<{ raw: string; rxcui: string; name: string; tty: 'SBD' | 'SCD' }> {
  const url = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(drug.brand)}`;
  const response = await fetchWithTimeout(url, 'application/json');
  const raw = await response.text();
  if (raw.trim().length === 0 || raw.trimStart().startsWith('<')) {
    throw new Error(`RxNorm: non-JSON response for ${url}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`RxNorm: malformed JSON for ${url}`);
  }
  const expectation = {
    brand: drug.brand,
    ingredient: drug.generic,
    strength: extractStrengthNumber(drug.strength),
    form: extractForm(drug.strength),
    volume: extractVolume(drug.strength),
  };
  const selected = selectRxConcept(parsed, expectation);
  return { raw, rxcui: selected.rxcui, name: selected.name, tty: selected.tty };
}

/** "30 mg tablet" -> "30 MG"; "40 mg/0.4 mL pen" -> "40 MG". */
function extractStrengthNumber(strength: string): string {
  const match = /([0-9]+(?:\.[0-9]+)?)\s*mg/i.exec(strength);
  if (match === null) throw new Error(`Cannot derive an mg strength from catalog strength: ${strength}`);
  return `${match[1]} MG`;
}

/** "40 mg/0.4 mL pen" -> "0.4 mL"; undefined for presentations without a volume. */
function extractVolume(strength: string): string | undefined {
  const match = /([0-9]+(?:\.[0-9]+)?)\s*mL/i.exec(strength);
  return match === null ? undefined : `${match[1]} mL`;
}

/** "30 mg tablet" -> "Oral Tablet"; "40 mg/0.4 mL pen" -> "Auto-Injector". */
function extractForm(strength: string): string {
  const lowered = strength.toLowerCase();
  if (lowered.includes('tablet')) return 'Oral Tablet';
  // The catalog's "pen" is the RxNorm Auto-Injector presentation; prefilled
  // syringes share strength and volume, so the form token is the selector.
  if (lowered.includes('pen')) return 'Auto-Injector';
  throw new Error(`Cannot derive an RxNorm form from catalog strength: ${strength}`);
}

async function fetchSpl(drug: DrugCatalogEntry): Promise<{ bytes: Buffer; evidence: ReturnType<typeof parseSplEvidence> }> {
  const url = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${drug.dailymed_setid}.xml`;
  const response = await fetchDailyMed(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  const text = buffer.toString('utf8');
  if (text.trim().length === 0 || /<html/i.test(text.slice(0, 512))) {
    throw new Error(`DailyMed: HTML or empty response for ${url}`);
  }
  const evidence = parseSplEvidence(text);
  assertSplIdentity(evidence, {
    setid: drug.dailymed_setid,
    brand: drug.brand,
    ingredient: drug.generic,
    strength: extractSplStrength(drug.strength),
    form: extractSplForm(drug.strength),
    labeler: drug.manufacturer,
    volume: extractVolume(drug.strength),
  });
  return { bytes: buffer, evidence };
}

/** Catalog strength -> SPL ingredient quantity, e.g. "30 mg tablet" -> "30 mg". */
function extractSplStrength(strength: string): string {
  const match = /([0-9]+(?:\.[0-9]+)?)\s*mg/i.exec(strength);
  if (match === null) throw new Error(`Cannot derive an SPL strength from catalog strength: ${strength}`);
  return `${match[1]} mg`;
}

/** Catalog strength -> SPL product form, e.g. "30 mg tablet" -> "TABLET, FILM COATED". */
function extractSplForm(strength: string): string {
  const lowered = strength.toLowerCase();
  if (lowered.includes('tablet')) return 'TABLET, FILM COATED';
  // Humira's SPL is a KIT whose nested presentations carry no useful
  // container form; the identity proof is the ACTIB quantity (40 mg/0.4 mL),
  // so accept the INJECTION-level form for pens.
  if (lowered.includes('pen')) return 'INJECTION';
  throw new Error(`Cannot derive an SPL form expectation from catalog strength: ${strength}`);
}

async function main(): Promise<void> {
  const drugId = parseArgv();
  const drug = findDrug(drugId);
  const outDir = resolve(DATA_DIR, drugId);

  console.log(`Fetching identity for ${drug.brand} (${drugId})...`);

  const rxnorm = await fetchRxnorm(drug);
  console.log(`RxNorm: selected ${rxnorm.tty} ${rxnorm.rxcui} — ${rxnorm.name}`);

  const spl = await fetchSpl(drug);
  console.log(
    `DailyMed: setid ${spl.evidence.setid}, document ${spl.evidence.document_id}, ` +
      `version ${spl.evidence.version}, effective ${spl.evidence.effective_time}, labeler ${spl.evidence.labeler}`,
  );

  const identity: LabelIdentity = {
    drug_id: drugId,
    rxcui: rxnorm.rxcui,
    rxnorm_name: rxnorm.name,
    rxnorm_tty: rxnorm.tty,
    setid: spl.evidence.setid,
    document_id: spl.evidence.document_id,
    version: spl.evidence.version,
    effective_time: spl.evidence.effective_time,
    source_url: `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${drug.dailymed_setid}.xml`,
    fetched_at: new Date().toISOString(),
    source_sha256: createHash('sha256').update(spl.bytes).digest('hex'),
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(resolve(outDir, 'source.xml'), spl.bytes);
  await writeFile(resolve(outDir, 'rxnorm.json'), `${JSON.stringify(JSON.parse(rxnorm.raw), null, 2)}\n`);
  await writeFile(resolve(outDir, 'provenance.json'), `${JSON.stringify(identity, null, 2)}\n`);

  console.log(`Published artifacts to data/labels/${drugId}/`);
  console.log(`source_sha256: ${identity.source_sha256}`);
}

main().catch((error: unknown) => {
  console.error(`Fetch failed; existing verified cache (if any) is preserved. ${String(error)}`);
  process.exit(1);
});