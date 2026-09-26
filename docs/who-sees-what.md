# Who sees what

This is the architecture slide. Every event in `mock/events.json` carries a `side` field, and the UI colours it by this table.

| | **Practice side** (the doctor's office) | **Impiricus Ascend side** (drug company) |
|---|---|---|
| **Holds** | The chart, patient names, insurance detail, fill status, the coordinator's queue, the before-visit card, the doctor's alerts | The Ascend channel the doctor already uses (the alert carries no chart), copay and sample program options, the Wallet link, the FDA's label text, aggregate recovery stats |
| **Sends out** | Drug, insurance *type* (commercial / government), state, and "started / recovered" counts with no names | Program options and links, label text |
| **Never sends** | The chart, names, dates of birth, prescription counts per doctor | — |
| **Never receives** | — | Anything that identifies a patient, or how much any doctor prescribes |

## The three rules on screen

1. The doctor picks the drug. FirstDose never suggests one. It only acts after the order is signed.
2. The FDA's words are shown exactly as written. No AI-written drug claims.
3. Nobody is paid per prescription. Market Access pays per patient recovered, measured in aggregate.

We mention Practice Fusion ($145M settlement, 2020, paid EHR pop-ups that pushed opioids) as exactly what this design prevents.

## Medicare / Medicaid

Manufacturer copay programs cannot be used by patients with federal or state coverage (OIG guidance). The router checks insurance type first and routes those patients to access support, never to a copay card. This check is deterministic and runs on the practice side.
