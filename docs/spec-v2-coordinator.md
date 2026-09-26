# FirstDose v2: The Coordinator's Daily Queue

Sat Sep 26, 2026 · Deem · Supersedes the doctor-first spec. The lead is locked (PLAN D7): an Ascend skill that shows up in DocUpdate; the coordinator's queue opens the demo and the doctor stays the accountable HCP.

## Where this fits in the repo (read this first)

- **This spec changes the story and the screens, not the engine.** The loop, router, mock contract and who-sees-what are unchanged.
- **Read with it:** `PLAN.md` (v2 tasks are rows 6.x), `docs/architecture.md`, `docs/frontend-plan.md`, `mock/*.json`.
- **Supersedes:** the doctor-first framing in `docs/presentation/pitch-and-qa.md` (rewritten in 6.9), the v1 spec's "Who it's for" section, and the v1 `/doctor` (iPad EHR + Ascend thread), which becomes the DocUpdate phone view below. The 4-minute demo in this spec is the demo script.
- **Gate: answered.** The workshop questions are answered from public sources in `docs/research/public-sources-briefing.md` (PLAN W1–W7). Product home: an Ascend skill that shows up in DocUpdate. HCP: staff operate, the prescriber stays accountable. First staff account: works the queue, the doctor approves. Built in PRs #11–#14.
- **Status updates:** tick the 6.x rows in `PLAN.md` with `status:` commits, same as every other task.
- **Screen copy (PLAN D8):** screens use the templates' fill wording, "first fill pending" and "pharmacy fill confirmed". Nothing on screen claims a patient started or recovered. "A patient who never started looks exactly like a drug that doesn't work" stays as the spoken problem statement. The demo and lines below follow this.

## The idea

FirstDose becomes the access coordinator's daily work queue, and the doctor only hears about it when it matters.

- **One line:** "Impiricus reaches the doctor who writes the prescription. FirstDose reaches the person who gets the patient on it, every day."
- **Doctor line (kept):** "A patient who never started looks exactly like a drug that doesn't work."
- **The gap:** DocUpdate, Impiricus's free e-prescribing app, sends the script to "95% of US pharmacies." After that, nobody in the office can see whether the patient started, or why not. DocUpdate is built for prescribers; office staff aren't addressed anywhere in Impiricus's products.

## Why this answers what the Impiricus rep asked for

| They asked for | What we found | FirstDose v2 |
|---|---|---|
| A hole in the product | DocUpdate sends the script, then nothing reports whether the patient started. Medvantx and QPharma act only when a doctor asks | Watches each new script, catches the ones that stall, says why, routes the one fix that matches |
| A reason to keep coming back | Pulse, Spark and Ascend start when pharma wants something (push). Daily-habit apps belong to others | The coordinator's queue is their real job, so they open it every workday. The doctor gets fewer, higher-value alerts ("trust, not noise") |
| New HCPs to reach | DocUpdate covers MDs, DOs, NPs, PAs, dentists, podiatrists, optometrists. Practice staff: none | Every "Send to my coordinator" invites the person who actually moves patients from prescribed to started |

DocUpdate already promises "direct access to reps, samples and patient support." FirstDose tells the practice **which one** each stuck patient needs.

**Tact rule:** we're pitching to the team that builds DocUpdate. Frame the gap as a missing step ("after the script is sent, nobody can see whether the patient started"), never as a bug. No app-review quotes on slides. The DocUpdate retention job post stays our private context, not a pitch line.

## Who uses it

| Person | How often | What they see | What they do |
|---|---|---|---|
| **Access coordinator** (main user) | Every workday, first thing | Morning summary ("3 stuck, 2 waiting, 11 fills confirmed this week"), then a queue sorted by who's slipping soonest, each with a reason | One fix per stuck patient (re-send copay card, request bridge sample, connect to access support); mark "Reached patient" / "Left message" |
| **Doctor** | A few alerts a week, plus before visits | Alert when a fix needs them; note before a follow-up: "James Carter: Humira first fill confirmation is still pending. Review fill status before the visit." | One tap: "Send to my coordinator" (first time: "Invite your coordinator"). Watch buzzes only when it matters |
| **Patient** | Once, when stuck | Copay card or support link on their phone | "Use at pharmacy" |
| **Market Access** (buyer) | Weekly | First fills confirmed, time to first fill, stuck reasons, coordinators active. No names | Pays per confirmed first fill, never per prescription |

## Market size: the people Impiricus doesn't reach yet

There's no government job code for "access coordinator," so we size it three ways: sourced facts, one calculation, and one clearly labelled estimate.

| Layer | Number | How we got it |
|---|---|---|
| Impiricus's reach today | **1M+ opted-in HCPs** | Impiricus homepage: "Trusted by 1M+ Opted-In HCPs." DocUpdate is built for licensed prescribers only |
| Doctors doing direct patient care | **866,460** | AAMC 2025 Key Findings (2024 data) |
| Access work per doctor | **13 hours a week**, 39 prior authorizations | AMA survey of 1,000 physicians, late 2024 ("physicians and their staff") |
| Practices with staff who do only prior auth | **40% of physicians** | Same AMA survey |
| **Access workload nationally** | **≈ 280,000 full-time jobs' worth, every week** | 866,460 doctors × 13 h ÷ 40 h. Our calculation; includes some doctor time |
| **Broad pool: medical assistants in doctors' offices** | **≈ 467,000** | BLS: 833,900 medical assistant jobs in 2025, 56% in offices of physicians |
| **Core users: dedicated access / prior-auth staff** | **≈ 70,000 to 115,000** | *Estimate.* 40% of 866,460 doctors ≈ 347,000 doctors with dedicated staff, at one dedicated person per 3 to 5 doctors. Ask Keomaria how many her office has |

**Say it like this:** "Behind Impiricus's million doctors are about 467,000 medical assistants in their offices, and roughly 280,000 full-time jobs' worth of prior-auth and access work every week. None of Impiricus's products are built for them. FirstDose is."

**Rules for these numbers on screen:**
- Say "about" or "roughly" for the two calculated numbers, and "our estimate" for the 70k–115k range. Never show the estimate as a sourced fact.
- The 280,000 counts hours, not people, and it includes some doctor time. Call it "full-time jobs' worth of work," not "280,000 coordinators."
- If a judge asks how many access coordinators exist: "There's no official count. The closest real numbers are 467,000 medical assistants in doctors' offices and 13 hours of access work per doctor per week. Our estimate for staff who do only this is 70 to 115 thousand."

**Is a coordinator an HCP?** They're often MAs, nurses or reimbursement specialists. Ask at 11 AM. If Impiricus counts only prescribers, the doctor stays the HCP they engage and the coordinator is the practice-level user who turns that engagement into a started patient. Until confirmed, say "the person who gets patients started," not "a new HCP."

## What changes

The core loop is unchanged: prescribe → stuck → alert → handoff → fix → acknowledgment → separate pharmacy confirmation → fill confirmed.

| | Item | Owner | Size |
|---|---|---|---|
| Keep | Simulated pharmacy events, reason codes, rule-based router, Medicare/Medicaid copay block | Vinh | none |
| Keep | Real RxNorm + verbatim DailyMed label card | Minh | none |
| Keep | Patient phone via QR, price drop, chime, Relay Board, Garmin buzz ("only when it matters") | Deem / Vinh | none |
| Keep | `/access`, who-sees-what | Deem | none |
| Change | `/coordinator` is the home screen and the first thing judges see (the desktop). Summary strip; sort stuck by time stuck; "Reached patient / Left message" marks; a "Waiting on" column (Doctor / Coordinator / Patient / Pharmacy); header per Q3 | Deem | medium |
| Change | `/doctor` becomes the DocUpdate phone view: the four surfaces below, at 390×844. It replaces the iPad EHR + Ascend thread | Deem | medium |
| Change | `/board` becomes optional at the table (the desktop queue owns the big screen). Its lanes show the same "Waiting on" label | Deem | small |
| Add | `/access` tiles: coordinators active this week, fixes per coordinator | Deem + Minh | small |
| Add | `/sim` "Seed the week": pre-load 10–15 fill-confirmed and waiting patients so the queue looks like a real Monday | Vinh | small |
| Add | `coordinator_id` on cases; `coordinator_invited` event. Router unchanged | Vinh | small |
| Cut | "The doctor opens it every morning" | — | — |
| Cut first if behind | Grok voice handoff (keep the tap) | Vinh | — |

Not in scope for the weekend: real logins, multiple practices, a live DocUpdate integration. DocUpdate, Ascend, Wallet, QPharma, Medvantx and the pharmacy stay labelled stand-ins.

## Integration and sponsor tech

**Their own roadmap asks for this.** DocUpdate's FAQ: *"Staff accounts and practice-level profiles aren't live yet, but they're on our roadmap."* Line to say: "Your FAQ says staff accounts are on the roadmap. FirstDose is what the first staff account does."

**The pipe already exists.** DocUpdate's FAQ: *"Every prescription routes through Surescripts."* Surescripts carries the NCPDP **RxFill** message (Dispensed, Partially dispensed, Not dispensed, Transferred), switched on per script with `RxFillIndicator`. Line to say: "Turn on RxFill on the network you already use, and every 'Not dispensed' becomes a fix in the coordinator's queue."

**Quote with context.** The FAQ line "we currently don't receive confirmation on whether it's been filled" is about cancellation requests. Paraphrase it: "DocUpdate's FAQ says it doesn't currently receive fill confirmation." Don't present it as a quote about fills.

| Piece | Job in FirstDose v2 | Owner | Status |
|---|---|---|---|
| RxFill-shaped `/sim` events | Pharmacy events use RxFill statuses; a "raw message" toggle shows `NotDispensed` and `RxFillIndicator`. Labelled simulated | Vinh | Build first (mostly relabeling) |
| NPPES NPI Registry (free, no key) | Coordinator screen: "Likely colleagues at this practice → Invite." NPPES has no practice roster and no street-address search, so search by ZIP + taxonomy and match the address line. Show real records as "public NPPES record, not users," names hidden. Cache for the demo | Vinh or Minh (`/api/npi`), Deem (UI) | After the queue changes |
| ElevenLabs | Coordinator approves a templated patient message ("Your copay card is ready, show this at the pharmacy"), voiced in the patient's language (Spanish for Maria). Sent from the practice. Never medical advice. Pairs with DocUpdate's translator | Deem | After NPPES |
| Tiger Data | Fill history, time to first fill, plus a "coordinators active per day" rollup (retention proof) | Minh | Keep |
| Gemini | Messy pharmacy/hub note → reason code only | Minh | Keep |
| Grok | "Send Maria to my coordinator" | Vinh | Cut first if behind |
| Medicare Part D prescribers (CMS) | Future rollout targeting only ("practices that start biologics"). Not on the demo path | — | Mention only |
| Solana | Skip. Crypto reads badly to pharma judges and adds a money flow to explain | — | Skip |
| CMS Open Payments | Don't touch. Clashes with "never paid per prescription" | — | Never |

## FirstDose inside DocUpdate: the four surfaces

Full teardown: `docs/research/docupdate-teardown.md`. The judge wants proof we know the product end to end; this is that proof, on screen.

**New evidence to lead with (stronger than the FAQ line):**
- DocUpdate published its own article, **"Prescription Abandonment: The Prescription Was Sent. The Patient Still Never Started It."** (Jul 9, 2026). They named our problem themselves. Open with it.
- The rails already exist in the app: an **Alerts Center** (v4.0.0, "real-time pharmacy and renewal alerts"), **savings-card attachment** on eligible scripts (v6.3.0, Jul 2026), and **Concierge** for samples and reps. FirstDose adds one alert type, one status line, one checkbox and one profile row — not a new app.
- Two named signal paths: per-script **RxFill** (`RxFillIndicator`; needs certification and pharmacy participation) or licensing **Surescripts First-Fill Abandonment** (launched Oct 15, 2025; **Oracle announced it's exploring it Sept 24, 2026** — two days ago, so the window is now). Neither gives the *reason*; the reason + one-tap fix is FirstDose's own layer.
- Coordinator login has an industry model to copy: **CoverMyMeds delegation** — staff identity, approved by a verified NPI-1 prescriber, under the practice's NPI-2. One slide line: "Staff accounts, the way CoverMyMeds already does them."
- Competitors (Doximity/Photon, iPrescribe, MDToolbox) fight abandonment **before** pickup with price transparency. None closes the loop **after** a non-fill with a reason and a routed fix. That's the uncrowded claim, verified.

**The four surfaces (phone = the doctor's DocUpdate view):**

| # | DocUpdate today | FirstDose adds | Build size |
|---|---|---|---|
| 1 | Home → Rx Alerts card: "Generic Substitution · John Smith · Oxytocin · Resolve" | New alert type, same card anatomy: **"Not dispensed · Maria Lopez · Otezla · Declined at price ($410 demo) → Send to my coordinator."** The whole pitch in one screenshot | Priority 1 |
| 2 | Patient Details → Past Prescriptions list | One status line per script: **Sent → At pharmacy → Fill confirmed**, or **⚠ Stuck + reason** (the fill status their FAQ says they don't have) | Priority 2 |
| 3 | Concierge checkboxes: Request Free Samples · Speak with a Rep · Custom | Add **"Help my patient start"** — routes to the same Wallet / QPharma / Medvantx rails via the existing fix flow | Cosmetic; deep-link the handoff |
| 4 | Profile | **"My coordinator"**: the coordinator's link request, with **Approve**. That's the staff account their FAQ says "isn't live yet", verified the CoverMyMeds way: the prescriber approves the delegate | Small (6.12) |

**Copy on these surfaces (D1, D2, D8).** "Not started" is the word we *say*; the screen shows data. The alert chip is the pharmacy status as it arrived (`status_text`, e.g. "Not dispensed / returned to stock", shortened with CSS only). The reason is `templates.reason_short`, the title and button are `templates.doctor_alert`, and the last step is "Fill confirmed" (`templates.board.stops`). Nothing is hand-written about a patient.

**Where each surface comes from in our code.** Surface 1 reuses `buildThread()`'s alert logic from the v1 Ascend thread. Surface 2 reuses `boardStop()`. Surface 3 calls the existing `handoff` action; surface 4 is the "Invite your coordinator" step (persisted once 6.4 lands). The New Rx screen ("Sign and send") keeps `LabelCard` in order mode, so the verbatim DailyMed label stays on the demo path.

**Privacy.** The DocUpdate view is the prescriber's own e-prescribing tool, so it sits on the **practice side** of who-sees-what: patient names and fill status appear only there and in the coordinator's queue. The Ascend / pharma side still gets aggregate counts only. A real build needs the BAA and data-use review the teardown lists.

**The split that frames the demo:** DocUpdate is iPhone-only with no staff accounts. So the **phone is the doctor's DocUpdate view** (surfaces 1–4) and the **desktop is the coordinator's queue** — the thing DocUpdate cannot do today. Phone beside desktop *is* the pitch picture, and the before/after slide (their real App Store home screenshot next to ours) is the one-glance version.

**Brand rules (also the trademark line):** copy structure, never brand — dark navy, purple primary, bottom tab bar, card anatomy are fine; our own name and logo; every DocUpdate-styled screen carries **"Concept: FirstDose inside DocUpdate · Not affiliated."** Their real screenshots appear only on the comparison slide, credited to the App Store. Never their logo or wordmark inside our UI.

**Repo consistency:** judges may find this public repo. The README now opens with the coordinator line, but the GitHub repo description (About) still says "A skill for Impiricus Ascend…". Change it to match the Q3 answer after the workshop (6.9); Deem does it by hand.

## The 4-minute demo

**The table.** Laptop or big screen = the coordinator's desktop queue (`/coordinator`). An iPhone = the doctor's DocUpdate view (`/doctor`, surfaces 1–4, opened from the home screen; a TestFlight build later). An Apple Watch paired to that iPhone gets the ntfy alerts, and iOS sends them to the watch only while the phone is locked. The judge's own phone = Maria (`/patient/rx_001` via QR). Vinh runs `/sim` and the pharmacy from his laptop. `/board` goes on a second monitor only if one is free. Setup: `/demo`.

**Casting** (matches the demo record "Dr. Demo (judge 1)"). Judge 1 = doctor (iPhone + Apple Watch), then becomes Maria via QR on their own phone. Judge 2 = coordinator at the laptop. With one judge: they play the coordinator, Vinh plays the doctor and wears the watch, and a spare phone plays Maria.

| Time | What happens | What we say |
|---|---|---|
| 0:00 | Desktop: the coordinator queue, Monday morning. "3 stuck, 2 waiting, 11 fills confirmed" | "Impiricus reaches the doctor who writes the prescription. This is the person who gets the patient on it. She opens this every morning." |
| 0:20 | Judge 1, on the DocUpdate phone view: New Rx → Maria → Otezla → Sign and send. Real DailyMed label on the order. Then they lock the phone and set it down, as a doctor would between patients | "DocUpdate sends the script. Today, that's where the story ends." |
| 0:40 | Pharmacy: declined at the quoted price. The Apple Watch buzzes. Judge 1 unlocks the phone: Rx Alerts shows **Not dispensed / returned to stock · Maria Lopez · Otezla** | "A patient who never started looks exactly like a drug that doesn't work." |
| 0:55 | Judge 1 taps "Send to my coordinator." First time only, a sheet: "Your access coordinator asked to work on your patients' access. Approve?" One tap approves the delegate and hands Maria off. On the desktop, Prescribers flips from Pending to Linked | "One tap just brought the person who gets patients started into the Impiricus network. Staff accounts, the way CoverMyMeds does them, except the doctor approves inside the app they already verified with." |
| 1:10 | Maria jumps to the top of Judge 2's queue with the reason and one fix: "Re-send copay card (commercial: eligible)." Judge 2 taps it | "One tap, not three phone calls." |
| 1:25 | Hand Judge 1 the QR: "Now you're Maria." Their own phone gets the card | — |
| 1:35 | Judge 1 taps "Use at pharmacy": acknowledged, fill still pending. Vinh fires the separate pharmacy confirmation: price $410 → $0 (demo), chime, the phone's Past Rx line reads **Fill confirmed**, watch: "Maria: Otezla pharmacy fill confirmed" | "The doctor heard about it twice: when it broke, and when it was fixed." |
| 2:00 | James on Humira: 75 Prior Authorization Required, unable to reach after 3 calls. Judge 2 taps "Connect to access support" | "Different reason, different fix. The rule picks it, not AI." |
| 2:30 | The phone's Home shows the before-visit card: "James Carter: Humira first fill confirmation is still pending. Review fill status before the visit." Boxed warning shown verbatim once Humira's label is verified | "This is the only thing the doctor needs to read." |
| 2:50 | `/access`: first fills confirmed, time to first fill, stuck reasons. Who-sees-what (coordinator tiles cut, 6.7) | "Market Access pays per confirmed first fill. Impiricus gets a daily user it never had." |
| 3:15 | The before/after slide (6.10): DocUpdate's App Store home screen beside ours | "One alert type, one status line, one checkbox, one profile row. Not a new app." |
| 3:30 | Close | "FirstDose makes the coordinator a daily Impiricus user and makes every doctor alert worth reading." |

## Lines to say word for word

- **Opener:** "Impiricus reaches the doctor who writes the prescription. FirstDose reaches the person who gets the patient on it, every day."
- **The gap:** "DocUpdate sends the script. After that, nobody can see whether the patient started."
- **Why doctors care:** "A patient who never started looks exactly like a drug that doesn't work."
- **Why they'll trust it:** "The doctor hears about it twice: when it broke, and when it was fixed."
- **The buyer:** "Market Access pays per confirmed first fill, never per prescription."

## Judge questions

| A judge might ask | Answer |
|---|---|
| Is a coordinator really an HCP? | They decide whether a patient gets on therapy, and many are nurses or MAs. Even if you count only prescribers, the doctor stays the HCP you engage; the coordinator is how that engagement becomes a started patient |
| Would a coordinator use this daily? | Chasing new starts by phone is already their whole job. This replaces guessing with a list of who's stuck and why. (Keomaria's quote here, if we get it) |
| Won't doctors ignore more alerts? | The doctor gets only alerts that need them, plus one note before the visit. Silence means it worked |
| Doesn't DocUpdate already track this? | DocUpdate's FAQ says it doesn't currently receive fill confirmation, and your July article names the problem. We add the missing step after the script is sent: the reason and the one fix |
| Doesn't Surescripts flag abandonment? | RxFill and First-Fill Abandonment (Oct 2025) say a script wasn't picked up. Neither says why. We say why, route the one fix that matches, and show Market Access the confirmed first fills |
| Is that DocUpdate on the phone? | No. It's a concept built on DocUpdate's structure, labelled "Concept: FirstDose inside DocUpdate · Not affiliated". Their real screen is only on the comparison slide, credited to the App Store |
| Who sees Maria's name? | Only the practice: the doctor's DocUpdate view and the coordinator's queue. Pharma sees counts |
| How would a coordinator log in? | Staff accounts the way CoverMyMeds does them: the coordinator links to a prescriber by NPI, and the prescriber approves them. CoverMyMeds faxes a code to the prescriber; we ask the prescriber inside DocUpdate, where their NPI and identity are already verified. The coordinator never signs a prescription |
| Why not just build this into DocUpdate yourselves? | That's the idea: FirstDose is the missing step inside DocUpdate, after the script is sent. We built it against a stand-in so you can see it working today |
| Does pharma see my patients? | No. Names, chart and fill status stay in the practice. Pharma sees counts only |
| Won't this push doctors toward drugs? | It acts only after the doctor chose the drug and never suggests one. Nobody is paid per prescription |
| Medicare patients? | The router blocks manufacturer copay cards for Medicare and Medicaid and routes to access support |

## Questions to ask

**Impiricus workshop, 11 AM, in this order:**
1. "Your FAQ says staff accounts are on the roadmap. What should a staff account do first?"
2. "You published *'The Prescription Was Sent. The Patient Still Never Started It.'* in July. What's the product plan behind that article?"
3. "If you built this, would it live inside DocUpdate, or in Ascend as a skill?" DocUpdate → header "FirstDose for DocUpdate", and `/doctor` becomes the DocUpdate phone view (6.3). Ascend → header "An Ascend skill for the practice"; the doctor surface stays the v1 Ascend thread on a phone, and the four surfaces move to a "where it could live" slide. The coordinator queue is the same either way.
4. "Is DocUpdate certified for RxFill (`RxFillIndicator`) today, or is licensing Surescripts First-Fill Abandonment the likelier path?"
5. "The v6.3.0 savings cards — structured secondary coverage or a pharmacy note? Are they Wallet programs?"
6. "Do you count practice staff, like access coordinators and MAs, as HCPs you'd want to reach?" Yes → lead with the coordinator. No → lead with the doctor; the coordinator is the practice user.
7. "For Market Access, which matters more: patients recovered, or time to first fill?"

**Keomaria (10 minutes, with permission):**
1. "Who in your office finds out when a patient never starts a new medicine, and how?"
2. "If that person had a list every morning of who's stuck and why, would they use it?"
3. "As the prescriber, would you want an alert, or just a note before the visit?"
4. "Can we quote you by name in the demo?"

## Timeline

| When (Sat unless noted) | What | Who |
|---|---|---|
| Now → 11 AM | Keep finishing the core loop and live wiring. `/sim` "Seed the week." Message Keomaria. No screen changes yet | Vinh, Minh, Deem |
| 11 AM → 12 PM | Workshop: ask the seven questions. Decide coordinator-first or doctor-first | Deem + one more |
| 12 → 2 PM | `/coordinator` home (6.2), `/doctor` DocUpdate phone view (6.3), before/after slide (6.10), `/access` coordinator tiles (6.7) | Deem, Minh |
| 2 PM | Cut check | All |
| 2:30 PM | Impiricus mini event: test the new opener on them | Deem |
| 3 → 6 PM | Polish; dry-run twice with strangers as coordinator and doctor | All |
| 6 PM | Footage: queue, watch close-up, judge's phone as Maria | Deem |
| 9 PM | Claims frozen; writeup and poster rewritten around the coordinator | Deem |
| Sun 6:30 AM | Submit to Devpost and expo.hexlabs.org | Deem |

**Cut in this order (PLAN.md Phase 6 is the source):** 1. Grok voice handoff (keep the tap) · 2. NPPES colleague invite (6.6) · 3. `/access` coordinator tiles (6.7, say it out loud) · 4. Spanish voice message (6.8) · 5. "Waiting on" labels (6.11) · 6. Surfaces 3–4, the Concierge checkbox and the Profile row (show them on the slide instead).

**Never cut:** the coordinator queue with a one-tap fix, the phone's Rx Alerts card (surface 1), the pharmacy re-run, the real DailyMed label, who-sees-what.

## Sources

- [DocUpdate](https://www.docupdate.io/) · [FAQ](https://www.docupdate.io/faq/) · [App Store](https://apps.apple.com/us/app/docupdate/id6478404244) · [Google Play](https://play.google.com/store/apps/details?id=com.impericus.prescriber&hl=en_US)
- [Impiricus solutions](https://impiricus.com/our-solutions/), products, homepage; Wallet launch; Ascend launch (Nov 2025); QPharma (Aug 2026) and Medvantx (Sep 2026) integrations
- [Impiricus homepage](https://impiricus.com/) ("Trusted by 1M+ Opted-In HCPs")
- [AAMC 2025 Key Findings](https://www.aamc.org/data-reports/data/2025-key-findings) (866,460 direct patient care physicians, 2024)
- [AMA prior authorization survey](https://www.ama-assn.org/practice-management/prior-authorization/fixing-prior-auth-nearly-40-prior-authorizations-week-way) (39 PAs and 13 hours per physician per week; 40% with dedicated staff)
- [BLS Occupational Outlook: Medical Assistants](https://www.bls.gov/ooh/healthcare/medical-assistants.htm) (833,900 jobs in 2025; 56% in offices of physicians)
- [NPPES NPI Registry API](https://npiregistry.cms.hhs.gov/api-page) · [NCPDP SCRIPT and RxFill guide](https://intuitionlabs.ai/articles/ncpdp-script-standard-guide)
- FirstDose repo `khadimswe/firstdose`, v1 spec, one-pager, build plan
