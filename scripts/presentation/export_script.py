"""Export the shared script source to a reviewable Markdown handout."""
from pathlib import Path
import json

source=Path(__file__).resolve().parent
root=source.parents[1]
rows=json.loads((source/'pitch_script.json').read_text(encoding='utf-8'))
text='''# FirstDose live pitch and questioning guide

Revised September 26, 2026 against main `015c3429a12518ed67753a47db9eaae308e82b13`.
This is the current PDF rehearsal script. The earlier pitch/submission drafts contain superseded implementation claims.

Khadim opens and closes, and takes business questions. Vinh drives the demo and takes build, synchronization and watch questions. Minh delivers the short AI explanation and takes AI/label questions; Vinh supports him. Suggested timing is 3:15 plus interaction buffer, not a measured runtime. Cut optional voice/audio or prepared before-visit detail before cutting the acknowledgment-versus-fill proof.

## Walk-up · Khadim · about 10 seconds

“Sending a prescription does not finish the job. FirstDose connects a reported barrier to the coordinator who can act. Put this on.”

Hand the judge the watch if that device path is ready. The operator must observe actual receipt before claiming a buzz.

'''
for row in rows:
    text+=f"## {row['time']} · {row['title']} · {row['speaker']}\n\n"
    text+='> '+row['say'].replace('. ','.\n> ' if row['speaker']=='Minh' else '. ')+'\n\n'
    text+=f"**Show:** {row['show']}\n\n**Action:** {row['operator']}\n\n"
text+='''## What changed from the supplied script

| Claim | Revision and reason |
|---|---|
| Supabase Realtime | Authenticated HTTP polling around 1.5 seconds; Supabase persists shared state. |
| Gemini returns prior auth for James | His earlier pharmacy reject is 75; the classified later hub note is about failed contact, expected `UNABLE_TO_REACH`. The rule selects access support. |
| Humira placeholder | Both drugs now have verified cached label artifacts. Humira #43, owner sign-off #44 and source clips #47 are merged. |
| Every event goes to Tiger | Only allowlisted reduced prescription/reason/dispense metric events. HMAC pseudonymization is not anonymity. |
| New Ascend skill / first staff account | Proposed integration and staff workflow; no official partner release or commercial contract. |
| Nobody knows / Impiricus never reaches staff | Removed unsupported absolutes. Existing monitoring and engagement products exist; the proposed differentiation is the coordinator workflow. |
| Over a million doctors | Company-reported reach is more than a million opted-in **HCPs**, a broader population. |
| About 467,000 medical assistants in offices | Removed from timed pitch. Current BLS page reports 833,900 jobs in 2025; the 56% office share was not confirmed in this fetch. Workforce counts are not customer counts. |
| Before-visit alert | Optional prepared scripted card; no automatic live appointment trigger. |
| Spanish audio | Approved Otezla message after the eligible resend fix; pre-generated ElevenLabs audio. Not runtime generation or Humira audio. |
| Payment per fill / profitability | Proposed experiment, with attribution, qualifying evidence, integration costs and contract terms still to validate. No revenue or measured savings. |

## Evidence for the pitch

- [Surescripts First-Fill Abandonment](https://surescripts.com/products/first-fill-abandonment): 27% in its January 2026 analysis of new e-prescriptions sent to fill-reporting pharmacies. This is not our recovery rate or a population-wide pilot result.
- [DocUpdate article](https://www.docupdate.io/articles/prescription-abandonment-the-prescription-was-sent-the-patient-still-never-started-it/): verified headline; homepage dates it July 9, 2026, by Sana Khateeb, PharmD.
- [Impiricus company job posting](https://job-boards.greenhouse.io/impiricus/jobs/5434527008): company-reported network of more than a million opted-in HCPs, not FirstDose customers or DocUpdate active users.
- [Impiricus products](https://www.impiricus.com/our-products/): Spark has multiple trigger types; Ascend offers resources. Our integration is proposed.
- [BLS Medical Assistants](https://www.bls.gov/ooh/healthcare/medical-assistants.htm): fetched page reports 833,900 jobs in 2025. We do not use it as a count of access coordinators.
- [AMA prior authorization survey](https://www.ama-assn.org/system/files/prior-authorization-survey.pdf): December 2025 survey of 1,000 physicians; average 40 requests and 13 hours of physician/staff work per physician per week, with 40% reporting staff devoted exclusively to PA. It includes medical-service work, not only prescriptions.
- [Minh sign-off](../minh-signoff-5.1.md): label/classifier/Tiger owner evidence; Humira's pending-PR wording is superseded by merge #43. Recorded 728 tests in 54 files and branch-local endpoint/render checks, not new deployed or physical-device proof.
- [Source recordings](../../video/README.md): five original clips, not the final edited video. No new application tests or deployment runs were performed for this documentation update.

## Question ownership and short answers

**Khadim — business.** We propose a recurring coordinator workflow. Market Access or a platform access program is a potential buyer; payment per qualifying confirmed first fill is one model to test. The PDFs preserve alternative license scenarios and cost sensitivity, all labeled assumptions. The representative conversation is qualitative feedback, not a contract, formal endorsement or industry ranking.

**Vinh — build.** A screen requests a command, the server validates it, Supabase commits the permitted events atomically, and the other screens poll shared state. The patient tap acknowledges a resource. A later simulated pharmacy event confirms a fill. Notification acceptance is separate from a physical watch receiving it.

**Minh — AI and labels.** “AI reads the note. A rule picks the fix. A human taps send.” Gemini returns an allowed reason or null; it does not create patient prose or choose treatment. Cached Otezla and Humira label text is checked against saved source, identity evidence and verification receipts. The served app is not FDA-approved by that verification.

## Study the full guides

The [45-page master](FirstDose-Master-Guide.pdf) includes graphs, workflow/architecture diagrams, screenshots, all feature explanations, ELI5 analogies, evidence scope, economics and scripts. Each personal guide adds 16 pages including 42 detailed questions and keeps the entire master:

- [Vinh — 61 pages](FirstDose-Vinh-Full-Prep.pdf)
- [Minh — 61 pages](FirstDose-Minh-Full-Prep.pdf)
- [Khadim — 61 pages](FirstDose-Khadim-Full-Prep.pdf)
'''
(root/'docs/presentation/live-pitch-and-qa.md').write_text(text,encoding='utf-8')
print('Exported docs/presentation/live-pitch-and-qa.md')
