---
feature_facts_version: 0.2.0
mode: map-backed
audience: internal
name: Workshop Demo
type: synthetic fixture
status: experimental
selection_state: curated
features:
- id: resume-importer
  name: Resume import
  lifecycle: released
  availability: conditional
  conditions:
  - kind: plan
    value: Pro
  - kind: role
    value: member
  maturity: experimental
  documentation: linked-evidence
  tests: unknown
  evidence_state: current
basis:
  kind: registry
  summary: Curated capabilities within the declared survey and publication scope.
map: .featurefacts/FEATURES.md
counts:
  scope: eligible-confirmed-active
  registered: 2
  selected: 1
  unlabeled: 1
assessments:
  docs:
    eligible: 2
    assessed: 2
    with_links: 1
    without_links: 1
    partial: 0
    unassessed: 0
    not_applicable: 0
    undisclosed: 0
  tests:
    eligible: 2
    assessed: 0
    with_links: 0
    without_links: 0
    partial: 0
    unassessed: 2
    not_applicable: 0
    undisclosed: 0
generated:
  date: '2026-09-19'
  generator: featurefacts-spec-fixture
  generator_version: 0.2.0
  projection_fingerprint: 8466a61ed0ade50e80c26024bd1526ffab7b6d72a1a0f8d32b233132bc12aee5
---

# Feature Facts: Workshop Demo

What can this product do?

Synthetic format example, not a scan or audit of a real product.

| Feature | Lifecycle | Availability | Maturity | Documentation | Tests | Evidence |
|---|---|---|---|---|---|---|
| Resume import | released | conditional, Pro, member | experimental | linked-evidence | unknown | current |

Within the eligible confirmed scope: 2 registered, 1 selected, and 1 not selected.

Docs: 1 of 2 assessed capabilities have linked evidence. Of 2 eligible capabilities, 0 are partially assessed, 0 unassessed, 0 not applicable, and 0 undisclosed.

Tests: 0 of 0 assessed capabilities have linked evidence. Of 2 eligible capabilities, 0 are partially assessed, 2 unassessed, 0 not applicable, and 0 undisclosed.

Linked evidence is not a claim that tests pass or documentation is adequate.

[Open the feature register](.featurefacts/FEATURES.md)
