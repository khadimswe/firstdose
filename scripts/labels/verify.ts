// Offline gate: verify saved files, never rebuild the displayed artifact during verification.
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { labelContext } from '@/lib/server/labels/artifacts';
import { verifyLabel } from '@/lib/server/labels/verify';
import { receiptMatches } from '@/lib/server/labels/receipt';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
async function main() {
  const args = process.argv.slice(2);
  const SUPPORTED_DRUGS = ['drug_otezla', 'drug_humira'] as const;
  if (args.length !== 2 || args[0] !== '--drug' || !SUPPORTED_DRUGS.includes(args[1] as (typeof SUPPORTED_DRUGS)[number])) throw new Error('Usage: verify.ts --drug <drug_otezla|drug_humira>');
  const drugId = args[1];
  const dir = resolve(root, 'data/labels', drugId);
  const json = async (path: string) => JSON.parse(await readFile(path, 'utf8'));
  const [bytes, label, provenance, rxnorm, receipt] = await Promise.all([
    readFile(resolve(dir, 'source.xml')), json(resolve(dir, 'label.json')), json(resolve(dir, 'provenance.json')),
    json(resolve(dir, 'rxnorm.json')), json(resolve(dir, 'verification.json')),
  ]);
  const result = verifyLabel(label, bytes, provenance, labelContext(drugId, rxnorm));
  if (!result.ok) throw new Error(result.errors.join('; '));
  if (!receiptMatches(label, provenance, rxnorm, receipt)) throw new Error('Saved verification receipt does not match the artifacts');
  const [labels, catalog] = await Promise.all([json(resolve(root, 'mock/labels.json')), json(resolve(root, 'mock/patients.json'))]);
  const published = labels.labels.filter((row: { drug_id: string }) => row.drug_id === drugId);
  if (published.length !== 1 || !isDeepStrictEqual(published[0], label)) throw new Error('Published mock label differs from verified saved artifact');
  const drugs = catalog.drugs.filter((row: { id: string }) => row.id === drugId);
  if (drugs.length !== 1 || drugs[0].rxcui !== provenance.rxcui || drugs[0].dailymed_setid !== provenance.setid) throw new Error('Published catalog drug identity differs from verified provenance');
  console.log(`Offline verification OK: ${drugId}; source, identity, full sections, receipt and published fixtures match.`);
}
main().catch(error => { console.error(`Offline verification failed: ${error instanceof Error ? error.message : 'invalid artifacts'}`); process.exitCode = 1; });
