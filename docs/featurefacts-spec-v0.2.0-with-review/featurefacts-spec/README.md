# FeatureFacts specification package

**What can this product do?**

FeatureFacts maintains a compact capability label backed by an inspectable feature register. Find the capabilities a product contains, where their evidence lives, and which documentation or test associations need review.

**Version: 0.2.0, revised draft.** This is a breaking revision of the supplied 0.1.0 specification, not a release of an implemented scanner. No application CLI, published package, deployed site, or production adapter is included.

```text
FEATURE_FACTS.md        Curated capability label, up to 12 rows
.featurefacts/         Maintained register, declared survey scope, evidence, and findings
```

The register is bounded by what was inspected. A scanner proposes capabilities and maintains their evidence. It does not establish an exhaustive product inventory, prove that a deployed feature works, or convert an unavailable assessment into a negative finding.

## What stays the same

FeatureFacts is a sibling of AppFacts, not a new AppFacts field. AppFacts concerns composition. FeatureFacts concerns capability. Keep local operation, no target runtime dependency, no default model calls, no default network, no early web interface, stable identities, and durable editorial choices.

| Contract | Value |
|---|---|
| Product | FeatureFacts |
| Family | xFacts, where x is a variable |
| Question | What can this product do? |
| Family layer | Terrain |
| Target label | `FEATURE_FACTS.md` |
| Target register | `.featurefacts/` |
| Planned CLI/package | `featurefacts` |
| Planned site | featurefacts.dev |
| Licensing intent | Specification and schemas CC0, tooling MIT |

Names and licensing intent are retained from the original package. This revision does not publish endpoints or perform legal/package registration work.

## Start here

Read [the change log](CHANGELOG.md), [the product specification](docs/GENESIS.md), and [the build plan](BUILD.md). The [decision log](docs/DECISIONS.md) records the choices made in this revision. The [migration guide](docs/MIGRATION.md) describes changes from 0.1.0.

For a coding agent, use [KICKOFF.md](KICKOFF.md), which preserves the brief-first implementation workflow.

| Location | Purpose |
|---|---|
| `docs/CONTRACT.md` | Evidence, fields, uncertainty, ownership, and validation |
| `docs/LABEL.md` | Map-backed and standalone labels, ordered curation, and projection |
| `docs/DETECTORS.md` | Versioned extraction boundary, scope, and provenance |
| `docs/MERGE_AND_CHECK.md` | Identity, retirement, two freshness checks, and safe writes |
| `docs/PUBLICATION_AND_SAFETY.md` | Public filtering and read-only scan boundaries |
| `schemas/` | Eleven locally resolvable JSON Schemas |
| `examples/` | Complete synthetic, partial-scan, empty, public, and standalone examples |
| `content/` | Target-repository skill and Lite protocol |
| `tools/` | Offline fixture builders, validators, and skill-bundle packager |
| `tests/` | Executable contract checks and production acceptance scenarios |
| `VALIDATION.md` | Actual validation results and their limits |

## Validate this package

The Python helpers are a specification development harness, not a choice of implementation language for FeatureFacts.

```sh
python -m pip install -r requirements-validation.txt
python tools/validate_package.py
```

Validation runs offline after dependencies are installed. It reads synthetic fixture files as data and executes no target application code. It checks schemas, example consistency, reference integrity, locators, publication projection, and regression mutations. It does not demonstrate a working production scanner.

## Build a self-contained skill bundle

```sh
python tools/package_skill.py --output /tmp/featurefacts-skill
```

The bundle contains instructions, schemas, reference documents, examples, and the validation harness. Copy the complete bundle, not just `SKILL.md`, into the target agent's supported skill directory.
