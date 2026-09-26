import patients from '@/mock/patients.json';
import type { VerificationContext } from './verify';

/** Fixed repository catalog, never expectations supplied by provenance or a request. */
export function labelContext(drugId: string, rxnorm: unknown): VerificationContext {
  const drug = patients.drugs.find(row => row.id === drugId);
  if (!drug || drugId !== 'drug_otezla') throw new Error('Unsupported label artifact');
  const strength = /^(\d+(?:\.\d+)?)\s*mg tablet$/i.exec(drug.strength);
  if (!strength) throw new Error('Unsupported product presentation');
  return { rxnorm, expected: { drug_id: drug.id, setid: drug.dailymed_setid, brand: drug.brand,
    ingredient: drug.generic, strength: `${strength[1]} mg`, form: 'TABLET, FILM COATED',
    labeler: drug.manufacturer, rxnorm_form: 'Oral Tablet' } };
}
