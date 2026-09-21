# GENESIS: FeatureFacts

## The problem

A product's capabilities can outgrow its README, onboarding material, and landing page. Builders and agents repeatedly rediscover what the product does, where the relevant implementation lives, and which changes deserve follow-up. File trees and import graphs help with implementation structure, but a file is not the same thing as a product capability.

FeatureFacts uses the feature as its unit of meaning: a named capability a user, operator, developer, or agent can recognize. Source locations, entry points, documentation, tests, and dependencies provide evidence for that capability.

## The product

FeatureFacts maintains two reading depths.

**The label**, `FEATURE_FACTS.md`, answers “What can this product do?” It contains up to 12 approved capability rows, a compact evidence summary, and an optional usable link to deeper reading. Zero rows is a truthful outcome when nothing is confirmed or curation has not been approved.

**The register**, `.featurefacts/`, maintains the known capabilities within a declared survey scope. It records what was inspected, what was unsupported, who supplied declarations, which groupings remain candidates, and which evidence is stale. It is not an unqualified claim that every capability in the product has been discovered.

A map-backed label is generated from the register and persistent curation. A standalone label is a separate declaration mode and must not imply that an absent register verifies its contents. The register can exist without a label. See `LABEL.md` for precise ownership and projection rules.

## Preserve these boundaries

FeatureFacts is local-first and artifact-first. It requires no hosted service, no target runtime dependency, and no default network or model calls. It does not run target application code, test suites, or executable project configuration during a default scan.

It is not a test runner, source-code coverage certificate, architecture-quality grader, landing-page generator, entitlement engine, or replacement for AppFacts. Source presence is not a deployment check. A test association is not a passing test. A documentation mention is not proof that the documentation is sufficient.

The initial production implementation supports one chosen ecosystem. Its schema and public artifact boundary remain technology-agnostic.

## A feature is not a folder

“Import a resume,” “Sign in using an identity provider,” “Export audit records,” and “Generate a weekly digest” are possible capabilities. A utility file, button component, database client, or isolated HTTP path is not automatically a feature.

Extraction produces **surfaces** such as routes, commands, jobs, symbols, documents, and test cases. Grouping proposes **candidate capabilities**. Confirmation requires an attributed review declaration in this revision. A candidate can be useful evidence without being counted as a confirmed product capability or placed on a public label.

One feature may span several entry points. A shared entry point or service may support several features. Associations must be explicit and inspectable. Neither one-file-one-feature nor one-route-one-feature is a default product rule.

## Three stages

| Stage | Output | Boundary |
|---|---|---|
| Extract | Versioned surface inventory and adapter results | Deterministic, scoped, no product-meaning guarantee |
| Maintain | Candidate and confirmed feature register | Evidence-backed grouping, reviewed identity, preserved editorial decisions |
| Explain | Label, readable register, association indexes, and findings | No stronger claim than the supporting evidence permits |

A useful deterministic workflow can require human review for naming and grouping. It does not require fully autonomous recovery of product meaning. An agent can assist, but its judgment remains inferred or attributed, not silently upgraded to a maintainer declaration.

## What each feature records

The feature record separates lifecycle, availability, maturity, audience, discovery observations, discovery intent, publication permission, and evidence freshness. A released feature can be experimental, restricted to a plan and role, visible in more than one surface, and authorized for an internal register but not a public label.

Each record also contains entry point and implementation references, outgoing dependencies, documentation and test association assessments, evidence assertions, immutable identity, aliases, and editorial controls. `CONTRACT.md` defines the exact structures and validation rules.

A missing observation is not a dead feature. A retired record is not a deleted record. A route found in source is not an assertion of public availability. A skipped detector is not evidence that documentation or tests are absent.

## Evidence and uncertainty

An **observation** is tied to a source locator and detector provenance. A **declaration** identifies the declaring actor and source. An **inference** references supporting evidence, states its method, and describes uncertainty and rationale.

Evidence binds to a particular field value. A citation for route existence cannot automatically justify released status, broad testing, or adequate documentation. Structural validation checks required shapes. Semantic validation checks IDs, references, claim bindings, supported assessment scope, and projection consistency. Neither validates truth by itself.

Use `unknown` when a value is not established. Use `undisclosed` when the value is deliberately withheld. Use assessment states to distinguish assessed, partial, unassessed, not applicable, and undisclosed. Do not conceal an unperformed assessment behind a numeric zero.

## Outputs and ownership

```text
FEATURE_FACTS.md
.featurefacts/
  LITE.md                 Optional target protocol
  config.yaml             Canonical scan settings, curation, policy, and waivers
  features.yaml           Canonical feature register and editorial decisions
  features.json           Exact machine projection of features.yaml
  surfaces.json           Current and retained stale source surfaces
  manifest.json           Scope, provenance, fingerprints, and commit marker
  FEATURES.md             Readable internal register
  gaps.yaml               Generated applicable findings and waiver projection
  docs-index.json         Exact documentation-assessment projection
  test-index.json         Exact test-assessment projection, not code coverage
```

No independent editing of generated JSON or `gaps.yaml`. Edit the canonical source, then regenerate. A report-only render updates every dependent artifact, not just Markdown. An imported coverage format, Mermaid graph, runtime test-result artifact, or public map exporter requires a later separately versioned contract.

## Commands

These are implementation requirements, not commands supplied by this package.

| Conceptual command | Behavior |
|---|---|
| `init` | Create conservative config and an empty register without overwriting existing decisions |
| `scan` | Extract, propose, merge, assess, validate, and commit a consistent generation |
| `report` | Refresh all dependent artifacts from canonical state without pretending to rescan source |
| `check` | Read-only source freshness, projection, validity, and configured-policy checks |
| `check --projection` | Read-only consistency check only, explicitly not source freshness |
| `show <id>` | Show one feature with provenance and uncertainty |
| `find <path>` | Find associated features, later than the minimum vertical slice |
| `diff <snapshot>` | Compare full register snapshots, not only manifest rollups |
| `lock <id> <field>` | Protect a supported editorial field, with an attributed decision |

`MERGE_AND_CHECK.md` defines failure states, no-op behavior, and write safety.

## Findings instead of unjustified scores

The first release reports observations such as “linked tests found,” “no accepted documentation association found within the inspected scope,” or “test assessment unavailable.” It does not use normalized `documented`, `tested`, `discoverable`, `coupled`, or `confidence` scores.

An exact test annotation and a matching filename are different strengths of association. Only accepted explicit annotations, static references, or attributed maintainer review belong in the assessment's linked-evidence list. Name similarity remains a proposal outside the confirmed association list.

Negative findings require a completed relevant adapter scope. A partially inspected or unsupported area can yield a review request, not a claim that tests or documentation do not exist. Findings carry rule identity, applicability, evidence, scope, a basis fingerprint, and a durable disposition projected from config waivers.

## What success looks like

A builder recognizes the capabilities, can inspect their evidence, can correct the grouping, and does not lose those corrections in later scans. An unchanged scan creates no semantic churn. A failed adapter cannot erase features. A public projection cannot leak a private capability through its rows, counts, links, or source metadata.

The initial real-repository evaluation is part of the first useful slice, not something postponed until after a large adapter platform is built. `BUILD.md` and `tests/ACCEPTANCE.md` define the gates. The included synthetic fixture validation is not evidence that those production gates have already been met.
