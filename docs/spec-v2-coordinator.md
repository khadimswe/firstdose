# FirstDose v2: The Coordinator's Daily Queue

Sat Sep 26, 2026 · Deem · Supersedes the doctor-first spec. Final lead (coordinator-first or doctor-first) is decided at the 11 AM Impiricus workshop.

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
| **Access coordinator** (main user) | Every workday, first thing | Morning summary ("3 stuck, 2 waiting, 11 started this week"), then a queue sorted by who's slipping soonest, each with a reason | One fix per stuck patient (re-send copay card, request bridge sample, connect to access support); mark "Reached patient" / "Left message" |
| **Doctor** | A few alerts a week, plus before visits | Alert when a fix needs them; note before a follow-up: "James never started Humira. Consider this before escalating" | One tap: "Send to my coordinator" (first time: "Invite your coordinator"). Watch buzzes only when it matters |
| **Patient** | Once, when stuck | Copay card or support link on their phone | "Use at pharmacy" |
| **Market Access** (buyer) | Weekly | Patients recovered, time to first fill, stuck reasons, coordinators active. No names | Pays per patient recovered, never per prescription |

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

The core loop is unchanged: prescribe → stuck → alert → handoff → fix → re-run → started.

| | Item | Owner | Size |
|---|---|---|---|
| Keep | Simulated pharmacy events, reason codes, rule-based router, Medicare/Medicaid copay block | Vinh | none |
| Keep | Real RxNorm + verbatim DailyMed label card | Minh | none |
| Keep | Patient phone via QR, price drop, chime, Relay Board, Garmin buzz ("only when it matters") | Deem / Vinh | none |
| Keep | `/access`, who-sees-what | Deem | none |
| Change | `/coordinator` is the home screen and the first thing judges see. Summary strip; sort stuck by time stuck; "Reached patient / Left message" marks; header "FirstDose for DocUpdate · Access queue" | Deem | medium |
| Change | `/doctor` shrinks to an alerts inbox + before-visit card. Order panel labelled "Sent from DocUpdate (stand-in)". First handoff shows "Invite your coordinator" | Deem | small |
| Change | `/board` shows whose move it is: Doctor, Coordinator, Patient, Pharmacy | Deem | small |
| Add | `/access` tiles: coordinators active this week, fixes per coordinator | Deem + Minh | small |
| Add | `/sim` "Seed the week": pre-load 10–15 started and waiting patients so the queue looks like a real Monday | Vinh | small |
| Add | `coordinator_id` on cases; `coordinator_invited` event. Router unchanged | Vinh | small |
| Cut | "The doctor opens it every morning" | — | — |
| Cut first if behind | Grok voice handoff (keep the tap) | Vinh | — |

Not in scope for the weekend: real logins, multiple practices, a live DocUpdate integration. DocUpdate, Ascend, Wallet, QPharma, Medvantx and the pharmacy stay labelled stand-ins.

## The 4-minute demo

Judge 1 = coordinator. Judge 2 = doctor (wears the watch), then becomes Maria via QR. Vinh runs `/sim` and the pharmacy. One judge only: they play the coordinator, Vinh wears the watch, a spare phone plays Maria.

| Time | What happens | What we say |
|---|---|---|
| 0:00 | Big screen: coordinator queue, Monday morning. "3 stuck, 2 waiting, 11 started" | "Impiricus reaches the doctor who writes the prescription. This is the person who gets the patient on it. She opens this every morning." |
| 0:20 | Judge 2 prescribes Otezla for Maria, "sent from DocUpdate." Real DailyMed label | "DocUpdate sends the script. Today, that's where the story ends." |
| 0:40 | Pharmacy: declined at quoted price. Board turns red. Judge 2's watch buzzes | "A patient who never started looks exactly like a drug that doesn't work." |
| 0:55 | Judge 2 taps "Send to my coordinator." First time: "Invite your coordinator" | "One tap just brought the person who gets patients started into the Impiricus network." |
| 1:10 | Maria jumps to the top of Judge 1's queue with the reason and one fix: "Re-send copay card (commercial: eligible)." Judge 1 taps it | "One tap, not three phone calls." |
| 1:25 | Hand Judge 2 the QR: "Now you're Maria." Their phone gets the card | — |
| 1:35 | Judge 2 taps "Use at pharmacy." Price $410 → $0, chime, board green, watch: "Maria started" | "The doctor heard about it twice: when it broke, and when it was fixed." |
| 2:00 | James on Humira: 75 Prior Authorization Required, unable to reach after 3 calls. Judge 1 taps "Connect to access support" | "Different reason, different fix. The rule picks it, not AI." |
| 2:30 | Doctor's before-visit card: "James never started Humira. Consider this before escalating." Real boxed warning | "This is the only screen the doctor needs." |
| 2:50 | `/access`: recovered, time to first fill, coordinators active. Who-sees-what | "Market Access pays per patient recovered. Impiricus gets a daily user it never had." |
| 3:30 | Close | "FirstDose makes the coordinator a daily Impiricus user and makes every doctor alert worth reading." |

## Lines to say word for word

- **Opener:** "Impiricus reaches the doctor who writes the prescription. FirstDose reaches the person who gets the patient on it, every day."
- **The gap:** "DocUpdate sends the script. After that, nobody can see whether the patient started."
- **Why doctors care:** "A patient who never started looks exactly like a drug that doesn't work."
- **Why they'll trust it:** "The doctor hears about it twice: when it broke, and when it was fixed."
- **The buyer:** "Market Access pays per patient recovered, never per prescription."

## Judge questions

| A judge might ask | Answer |
|---|---|
| Is a coordinator really an HCP? | They decide whether a patient gets on therapy, and many are nurses or MAs. Even if you count only prescribers, the doctor stays the HCP you engage; the coordinator is how that engagement becomes a started patient |
| Would a coordinator use this daily? | Chasing new starts by phone is already their whole job. This replaces guessing with a list of who's stuck and why. (Keomaria's quote here, if we get it) |
| Won't doctors ignore more alerts? | The doctor gets only alerts that need them, plus one note before the visit. Silence means it worked |
| Doesn't DocUpdate already track this? | It sends the script. We found nothing that tells the practice the patient never started, or why. (Confirm at 11 AM) |
| Doesn't Surescripts flag abandonment? | It says a script wasn't picked up. We say why, route the one fix that matches, and prove recovery to Market Access |
| Why not just build this into DocUpdate yourselves? | That's the idea: FirstDose is the missing step inside DocUpdate, after the script is sent. We built it against a stand-in so you can see it working today |
| Does pharma see my patients? | No. Names, chart and fill status stay in the practice. Pharma sees counts only |
| Won't this push doctors toward drugs? | It acts only after the doctor chose the drug and never suggests one. Nobody is paid per prescription |
| Medicare patients? | The router blocks manufacturer copay cards for Medicare and Medicaid and routes to access support |

## Questions to ask

**Impiricus workshop, 11 AM, in this order:**
1. "Do you count practice staff, like access coordinators and medical assistants, as HCPs you'd want to reach?" Yes → lead with the coordinator. No → lead with the doctor; the coordinator is the practice user.
2. "Does DocUpdate tell the prescriber whether a script was filled, or why not?" No → confirms the gap. Partly → pitch the reason and the fix, not the status.
3. "If you built this, would it live inside DocUpdate, or in Ascend as a skill?" DocUpdate → header "FirstDose for DocUpdate · Access queue." Ascend → "An Ascend skill for the practice." Demo and code unchanged either way.
4. "What do doctors open DocUpdate for today, and what makes them stop?"
5. "For Market Access, which matters more: patients recovered, or time to first fill?"

**Keomaria (10 minutes, with permission):**
1. "Who in your office finds out when a patient never starts a new medicine, and how?"
2. "If that person had a list every morning of who's stuck and why, would they use it?"
3. "As the prescriber, would you want an alert, or just a note before the visit?"
4. "Can we quote you by name in the demo?"

## Timeline

| When (Sat unless noted) | What | Who |
|---|---|---|
| Now → 11 AM | Keep finishing the core loop and live wiring. `/sim` "Seed the week." Message Keomaria. No screen changes yet | Vinh, Minh, Deem |
| 11 AM → 12 PM | Workshop: ask the five questions. Decide coordinator-first or doctor-first | Deem + one more |
| 12 → 2 PM | `/coordinator` home + summary strip, `/doctor` invite step, `/access` coordinator tiles | Deem, Minh |
| 2 PM | Cut check | All |
| 2:30 PM | Impiricus mini event: test the new opener on them | Deem |
| 3 → 6 PM | Polish; dry-run twice with strangers as coordinator and doctor | All |
| 6 PM | Footage: queue, watch close-up, judge's phone as Maria | Deem |
| 9 PM | Claims frozen; writeup and poster rewritten around the coordinator | Deem |
| Sun 6:30 AM | Submit to Devpost and expo.hexlabs.org | Deem |

**Cut in this order:** 1. Grok voice handoff (keep the tap) · 2. `/access` coordinator tiles (say it out loud) · 3. "Invite your coordinator" step (slide) · 4. Board "whose move" labels.

**Never cut:** the coordinator queue with a one-tap fix, the doctor's alert, the pharmacy re-run, the real DailyMed label, who-sees-what.

## Sources

- [DocUpdate](https://www.docupdate.io/) · [App Store](https://apps.apple.com/us/app/docupdate/id6478404244) · [Google Play](https://play.google.com/store/apps/details?id=com.impericus.prescriber&hl=en_US)
- [Impiricus solutions](https://impiricus.com/our-solutions/), products, homepage; Wallet launch; Ascend launch (Nov 2025); QPharma (Aug 2026) and Medvantx (Sep 2026) integrations
- [Impiricus homepage](https://impiricus.com/) ("Trusted by 1M+ Opted-In HCPs")
- [AAMC 2025 Key Findings](https://www.aamc.org/data-reports/data/2025-key-findings) (866,460 direct patient care physicians, 2024)
- [AMA prior authorization survey](https://www.ama-assn.org/practice-management/prior-authorization/fixing-prior-auth-nearly-40-prior-authorizations-week-way) (39 PAs and 13 hours per physician per week; 40% with dedicated staff)
- [BLS Occupational Outlook: Medical Assistants](https://www.bls.gov/ooh/healthcare/medical-assistants.htm) (833,900 jobs in 2025; 56% in offices of physicians)
- FirstDose repo `khadimswe/firstdose`, v1 spec, one-pager, build plan
