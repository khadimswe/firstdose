# Who sees what

This is the architecture slide. Every event in `mock/events.json` carries a `side` field, and the UI colours it by this table.

| | **Practice side** (the doctor's office) | **Impiricus Ascend side** (drug company) |
|---|---|---|
| **Holds** | The chart, patient names, insurance detail, fill status, the coordinator's queue, the doctor's DocUpdate view (Rx Alerts, past prescriptions with fill status, the before-visit card) | Copay and sample program options, the Wallet link, the FDA's label text, aggregate first-fill counts |
| **Sends out** | Drug, insurance *type* (commercial / government), state, and "first fill confirmed" counts with no names | Program options and links, label text |
| **Never sends** | The chart, names, dates of birth, prescription counts per doctor | — |
| **Never receives** | — | Anything that identifies a patient, or how much any doctor prescribes |

**Where DocUpdate sits.** DocUpdate is ImpiricusHealth's e-prescribing app. It is the prescriber's own tool and already holds the patient details a prescriber sends, so in FirstDose the DocUpdate view is on the **practice side**. Names and fill status stay inside the doctor's view and the coordinator's queue; nothing from them flows to Ascend or pharma except aggregate counts. A real build needs a BAA and data-use review (see `research/docupdate-teardown.md`, "Where FirstDose Fits", the Proof row).

## The three rules on screen

1. The doctor picks the drug. FirstDose never suggests one. It only acts after the order is signed.
2. The FDA's words are shown exactly as written. No AI-written drug claims.
3. Nobody is paid per prescription. Market Access pays per confirmed first fill, measured in aggregate.

We mention Practice Fusion ($145M settlement, 2020, paid EHR pop-ups that pushed opioids) as exactly what this design prevents.

## Medicare / Medicaid

Manufacturer copay programs cannot be used by patients with federal or state coverage (OIG guidance). The router checks insurance type first and routes those patients to access support, never to a copay card. This check is deterministic and runs on the practice side.
