# FeatureFacts specification (0.2.0)

**FeatureFacts** answers **What can this product do?** It is the Terrain layer of [xFacts](https://xfacts.dev). Write the name as one word with both capital Fs. Write the family as **xFacts**, lowercase x.

The full contract lives in `docs/` and `schemas/`. This file is the public entry.

## Two depths

| Artifact | Role |
|---|---|
| `FEATURE_FACTS.md` | Curated xFacts label. Zero to 12 rows. Empty is valid. |
| `.featurefacts/` | Evidence-backed register: config, features, surfaces, manifest, indexes, gaps. |

Map-backed labels are generated from the register. Standalone labels are attributed declarations and must not imply that an absent register verified them.

## Standing rules

- Candidates are not confirmed features and do not occupy public counts.
- Unknown is not undisclosed. A skipped adapter is not evidence of absence.
- Confirmation, public permission, and label selection require attributed maintainer decisions.
- Default scan does not execute target code, use the network, or call a model.
- Never add FeatureFacts to a target app’s runtime dependencies.
- First production ecosystem: TypeScript/Node.

## Commands

`featurefacts init` · `scan` · `report` · `show` · `check`

`check` is read-only. Default check includes source freshness. `check --projection` compares generated artifacts only.

## Normative docs

- `docs/GENESIS.md` — product boundary
- `docs/CONTRACT.md` — fields and evidence
- `docs/LABEL.md` — label projection
- `docs/DETECTORS.md` — adapters
- `docs/MERGE_AND_CHECK.md` — identity and checks
- `docs/PUBLICATION_AND_SAFETY.md` — disclosure and scan safety
- `docs/PHASE_1_BRIEF.md` — locked implementation brief

Schemas are CC0. Tooling is MIT.
