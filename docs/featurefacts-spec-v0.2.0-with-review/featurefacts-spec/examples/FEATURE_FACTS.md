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
  tests: linked-evidence
  evidence_state: current
basis:
  kind: registry
  summary: Curated capabilities within the declared survey and publication scope.
map: demo-repository/.featurefacts/FEATURES.md
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
    assessed: 2
    with_links: 1
    without_links: 1
    partial: 0
    unassessed: 0
    not_applicable: 0
    undisclosed: 0
generated:
  date: '2026-09-19'
  generator: featurefacts-spec-fixture
  generator_version: 0.2.0
  projection_fingerprint: 9fd51dd0662cb06d4b7797dee5decbf29c17cd5cc72a702da1fa33414647807b
---

# Feature Facts: Workshop Demo

What can this product do?

Synthetic format example, not a scan or audit of a real product.

| Feature | Lifecycle | Availability | Maturity | Documentation | Tests | Evidence |
|---|---|---|---|---|---|---|
| Resume import | released | conditional, Pro, member | experimental | linked-evidence | linked-evidence | current |

Within the eligible confirmed scope: 2 registered, 1 selected, and 1 not selected.

Docs: 1 of 2 assessed capabilities have linked evidence. Of 2 eligible capabilities, 0 are partially assessed, 0 unassessed, 0 not applicable, and 0 undisclosed.

Tests: 1 of 2 assessed capabilities have linked evidence. Of 2 eligible capabilities, 0 are partially assessed, 0 unassessed, 0 not applicable, and 0 undisclosed.

Linked evidence is not a claim that tests pass or documentation is adequate.

[Open the feature register](demo-repository/.featurefacts/FEATURES.md)
