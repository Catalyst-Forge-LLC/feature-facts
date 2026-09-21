# BUILD: phased delivery

The product boundary is technology-agnostic. This package specifies a draft contract, not an implementation. A smaller feature set does not justify weaker evidence or publication rules.

## Phase 0: approve the revised contract

Write `docs/PHASE_1_BRIEF.md`. Confirm the owner-selected production stack and first supported ecosystem, naming, artifact ownership, 0.2.0 field definitions, safe-scan defaults, and the two check modes. Run the package's contract tests and resolve any remaining contradictions before freezing an implementation baseline.

Approval must cover the breaking migration, the definition of a confirmed feature, the label's initial empty selection, and publication as an explicit decision. Draft schemas remain changeable through recorded decisions, corresponding fixtures, and versioning. Do not freeze a contradiction merely because a JSON Schema validates.

**Exit:** Owner-approved brief and agreed acceptance plan. No production scaffold before this gate.

## Phase 1: one useful vertical slice

Build deterministic extraction for one supported ecosystem, a conservative candidate register, reviewed naming/grouping, persistent curation, and safe rendering. Bring the full skill bundle into this phase so that the intended review loop can be exercised early.

The distributable synthetic fixture must include one feature spanning multiple entry points, a private operator feature, a shared implementation helper, exact doc/test annotations, unknown maturity or release state, conditional availability, and an unsupported input. A second fixture must exercise adapter failure without retiring known features.

Minimum conceptual commands are `init`, `scan`, `report`, `show`, and `check`. The default register consists of `config.yaml`, `features.yaml`, `features.json`, `surfaces.json`, `manifest.json`, `FEATURES.md`, `gaps.yaml`, `docs-index.json`, and `test-index.json`. A root label is rendered from approved selected IDs, or contains zero rows with a reason.

Documentation and test results are association assessments, not normalized quality scores. Tests are not run by the default scan. One source route does not establish release status. All public rows, aggregates, and metadata must be filtered before rendering.

**Before Phase 1 exits, dogfood on a developer-owned real repository.** Build a small maintainer-reviewed reference inventory, independently of the scanner's proposed list. Measure unsupported emitted assertions, missed reviewed capabilities, mistaken grouping, correction effort, and churn after a second unchanged scan. Preserve the private inventory locally. Do not publish it in fixtures.

**Minimum exit gates:** No unsupported strong claims in the reviewed sample, no unauthorized public disclosures, no silent ID merges, all approved curation retained, no semantic churn on an unchanged rescan, valid locators or explicit stale states, and all applicable Phase 1 acceptance cases passing. Record the sample size and agreed thresholds for recognition and correction effort in the brief. These measurements are local evaluation results, not general accuracy guarantees.

## Phase 2: strengthen maintenance and CI

Add `find`, reviewed identity migrations, snapshot-based `diff`, report-only regeneration, source-freshness checks, and configured policies. Exercise locked declarations, source moves, renamed features, duplicate names, partial scans, missing files, concurrent edits, crash recovery, and publication revocation.

A read-only `check` must distinguish an invalid contract, stale source inputs, unavailable assessments, policy findings, and operational failure. A disabled policy never turns a failed required parser into success.

**Exit:** An engineer can correct the inventory, scan repeatedly, and trust that neither the corrections nor their uncertainty vanish.

## Phase 3: deepen only where measurement supports it

Add more precise associations and one additional ecosystem only after the first is useful. Feature dependency edges must have evidence. Generate inbound edges from authoritative outgoing edges. Raw graph counts can be reported with scope, but are not architectural-health grades.

Implement incremental extraction only with full-scan equivalence tests. Compare full snapshots, not only manifests. Do not add automatic retirement in this revision. Retirement remains an explicit reviewed decision.

**Exit:** Incremental and full scans agree for the same final inputs, with explainable diffs.

## Phase 4: shelf and distribution

Package the CLI and complete skill resources. Make installation, use, supported scope, privacy defaults, limitations, and validation accessible from the public README. The xFacts hub integration is a separate repository change. Publish schema endpoints only as part of an actual release.

**Exit:** A new user can install the tool or skill, produce a bounded register, review it, and run the documented checks without reading the entire specification.

## Explicitly deferred

Visual topology, a public map exporter/viewer, organization-wide multi-repo management, MCP, hosted integrations, external model inference, automatic retirement, calibrated health scoring, imported runtime coverage, and elaborate entitlement modeling are not first-release requirements. `coverage.json` is not a supported artifact in 0.2.0. Its former association role is fulfilled by `test-index.json`.

## What the package tests establish

The included helpers validate this specification's synthetic examples and selected contracts. The production scanner does not exist in this package. Completion of the scenarios in `tests/ACCEPTANCE.md` must be established by the implementation, not inferred from the package test report.
