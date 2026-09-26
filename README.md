# StreamProof

**Live demo:** https://stream-proof.vercel.app/

**Citizens measure stream water. StreamProof turns the trustworthy measurements into standards-ready health data - and stops everything else at the gate.**

Built for the **OneAquaHealth IEEE Global Hackathon 2026, Track 7 (Digital Health Standards)**.

---

## The problem, in plain words

Cities ask citizens to help watch over urban streams: measure the pH, the temperature, the conductivity. It is a lovely idea with a trust problem. Some of what comes back is solid measurement. Some of it is a typo ("87 °C"), a number with no unit, the same reading typed twice - or a photo of green water with a guess attached.

Health and environment agencies can't use any of it until someone answers: **which of these records can we actually trust, and can we prove why?**

StreamProof is that someone.

## What it does (4 steps, all visible in the app)

1. **Collect.** A citizen adds a measurement by hand (site, date, parameter, value, unit, who measured) or imports a CSV of many records at once.
2. **Check.** Fixed, published rules examine every record:
   - impossible values (pH 15, water at 87 °C) are **blocked**;
   - unusual-but-possible values are **flagged for a human**;
   - missing units, unknown units, missing observer, unreadable dates are **blocked**;
   - duplicates (same site, same parameter, same minute) are flagged;
   - **photo-only claims are refused outright** - "it looked green in a photo" is not a measurement, and StreamProof will never dress it up as one.
3. **Review.** A human sees every flag, can correct typos, and explicitly approves or rejects each record. Nothing is auto-approved. Only approved records continue.
4. **Export.** Approved records become a **FHIR R4 Bundle** - Location + Observation resources with standard UCUM units - the same data standard hospitals and public-health systems use. One click downloads the JSON.

The mapping from citizen input to standards field is shown openly in the app (step 3 tab): nothing is added, guessed, or hidden.

## Why this fits OneAquaHealth

OneAquaHealth already has dashboards and maps. What it needs next is a way for citizen observations to *enter* the standards world without polluting it. StreamProof is the evidence gate in front of the One Health data flow: **reviewed, attributable measurements in; draft-IG-aligned FHIR out; unsupported leaps (photo -> disease, photo -> pathogen) refused.**

- **Impact & mission fit:** trustworthy citizen data is the missing ingredient for urban One Health monitoring.
- **Innovation:** the product is the *refusal* as much as the conversion - a gate, not another dashboard.
- **Technical:** deterministic, test-covered rule engine; no black box deciding what is trustworthy.
- **Usability:** a citizen understands the whole flow in one sitting; a reviewer needs no training.
- **Feasibility:** plain web app, CSV in, standard JSON out. No exotic infrastructure.

## Honesty notes (read us, judges)

- **Sample data is labelled.** The app ships with (a) one *real, historical* record published in the OneAquaHealth draft FHIR guide (Almyros conductivity, 18.4 mS/cm, 2024-11-21, OneAquaHealth Crete Lab) shown as a reference, and (b) an *invented, deliberately flawed* synthetic set so you can watch the gate work. Neither is passed off as fresh citizen data.
- **Draft standard, no conformance claim.** The OneAquaHealth FHIR Implementation Guide is a draft that can change. The export is *aligned with the current draft* and says so inside the file itself. We do not claim formal standards conformance.
- **Humans stay in charge.** The app never auto-approves, never certifies ownership or accuracy, and never publishes anything. It prepares; people decide.

## Try the demo in 3 minutes

1. `npm install && npm run dev`, open the shown URL.
2. Step 1: click **Load the flawed synthetic set**.
3. Step 2 (Review): watch 87 °C, the missing unit, and the photo-only claim get blocked. Fix nothing yet. Approve the clean pH record and the real Almyros reference record.
4. Step 3: see the exact field-by-field mapping to FHIR.
5. Step 4: download the Bundle. Notice who is in it (approved only) and who is not.

## Tech

- React 18 + TypeScript + Vite. No backend needed; everything runs in the browser.
- The rule engine, unit canonicalisation, CSV parser and FHIR builders are plain, deterministic TypeScript modules with **40 unit tests** (`npm test`).
- Deploy: `npm run build`, then host `dist/` anywhere static (Vercel works out of the box).

## Repo map

```
src/lib/validate.ts   the gate: plausibility ranges, required fields, duplicates, photo-only refusal
src/lib/units.ts      messy citizen units -> one canonical UCUM unit per parameter
src/lib/fhir.ts       approved records -> FHIR R4 Location + Observation + Bundle
src/lib/csv.ts        CSV import with row-level error reporting
src/lib/samples.ts    the labelled reference and synthetic demo data
src/components/       the 4-step UI
src/test/             40 tests
```

## Built with

React, TypeScript, Vite, Vitest. AI coding assistance (Claude) was used during development and is disclosed here per the hackathon rules. All validation logic is deterministic and covered by tests - no AI output reaches the data unchecked.

---

*Built fresh in September 2026 for the OneAquaHealth IEEE Global Hackathon 2026 by Navin Venkatesan (team: Maverick).*
