---
feature_facts_version: 0.2.0
mode: map-backed
audience: public
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
counts:
  scope: eligible-confirmed-active
  registered: 1
  selected: 1
  unlabeled: 0
assessments:
  docs:
    eligible: 1
    assessed: 1
    with_links: 1
    without_links: 0
    partial: 0
    unassessed: 0
    not_applicable: 0
    undisclosed: 0
  tests:
    eligible: 1
    assessed: 1
    with_links: 1
    without_links: 0
    partial: 0
    unassessed: 0
    not_applicable: 0
    undisclosed: 0
generated:
  date: '2026-09-19'
  generator: featurefacts-spec-fixture
  generator_version: 0.2.0
  projection_fingerprint: fa87dc92597c1bd84faecd637b5bf19901704b79d34691f481b1e787eea6e5e0
---

# Feature Facts: Workshop Demo

What can this product do?

Synthetic format example, not a scan or audit of a real product.

| Feature | Lifecycle | Availability | Maturity | Documentation | Tests | Evidence |
|---|---|---|---|---|---|---|
| Resume import | released | conditional, Pro, member | experimental | linked-evidence | linked-evidence | current |

Within the eligible confirmed scope: 1 registered, 1 selected, and 0 not selected.

Docs: 1 of 1 assessed capabilities have linked evidence. Of 1 eligible capabilities, 0 are partially assessed, 0 unassessed, 0 not applicable, and 0 undisclosed.

Tests: 1 of 1 assessed capabilities have linked evidence. Of 1 eligible capabilities, 0 are partially assessed, 0 unassessed, 0 not applicable, and 0 undisclosed.

Linked evidence is not a claim that tests pass or documentation is adequate.
