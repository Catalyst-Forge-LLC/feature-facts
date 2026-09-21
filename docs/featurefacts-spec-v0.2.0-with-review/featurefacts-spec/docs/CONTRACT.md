# Data contract, version 0.2.0

This document and the schemas are normative together. Examples illustrate them. The development validator implements a subset of semantic rules and reports its actual scope in `VALIDATION.md`.

## Versions and parsing

All independently consumed target product data artifacts other than the label use `schemaVersion: "0.2.0"`. Schema definitions and development-harness reports are not target product artifacts. Label frontmatter retains the family-specific `feature_facts_version: "0.2.0"` as its version field. A feature record is an embedded object, versioned by its registry. Do not add an independent version to each nested object.

Schema `$id` values identify the intended 0.2.0 namespace. Resolve the bundled schemas locally. This package does not assert that those endpoints have been published, and validation must not fetch them from the network.

YAML data must use a JSON-compatible subset. Object keys are strings. Dates and date-times are quoted strings. Duplicate keys, merge keys, custom tags, anchors, aliases, non-finite numbers, and non-JSON values are rejected. Implementations may use different parsers, but must pass equivalent parsing fixtures. Schemas do not insert defaults. Apply documented config defaults explicitly before hashing or validation.

IDs are lowercase ASCII kebab-case, one to 64 characters, starting with a letter. `a`, `ai`, and `resume-import` are valid. Empty components, leading/trailing hyphens, underscores, and `a--b` are invalid. IDs are unique within their artifact domain. Evidence IDs are unique across the whole registry.

Paths use repository-relative POSIX separators. Absolute paths, colons (including drive-qualified paths and URL schemes), parent traversal, standalone `.` components, backslashes, control characters, and empty components are forbidden. The manifest's root is the explicit sentinel `.` rather than a path locator. A valid-looking path still needs runtime containment and symlink checks.

## Canonical documents

| Artifact | Schema | Authority |
|---|---|---|
| `config.yaml` | `config.schema.json` | Settings, label selection, overrides, publication target, policy, and waivers |
| `features.yaml` | `registry.schema.json` | Feature facts, evidence, editorial decisions, aliases, and redirects |
| Feature object | `feature-record.schema.json` | Embedded in the registry |
| `features.json` | `registry.schema.json` | Generated exact data copy of YAML |
| `surfaces.json` | `surfaces.schema.json` | Extracted and retained surface records |
| Detector result | `detector-result.schema.json` | Extraction boundary, not an additional required target file |
| `manifest.json` | `manifest.schema.json` | Scan scope, versions, fingerprints, and committed artifact digests |
| `gaps.yaml` | `gaps.schema.json` | Generated findings and projected dispositions |
| `docs-index.json` | `docs-index.schema.json` | Exact feature documentation-assessment projection |
| `test-index.json` | `test-index.schema.json` | Exact feature test-assessment projection |
| Label frontmatter | `feature-facts-label.schema.json` | Generated projection, or standalone declaration in explicit standalone mode |

`common.schema.json` supplies shared definitions. `FEATURES.md` and label Markdown bodies are generated human-readable renderings, not independent facts. `coverage.json` is not supported in 0.2.0.

## Feature dimensions

| Field | Values or meaning |
|---|---|
| `type` | `feature`, `workflow`, `integration`, or candidate-only `surface-cluster` |
| `recognition` | `candidate` or `confirmed` |
| `lifecycle` | `implemented`, `released`, `stub`, `retired`, `unknown`, or `undisclosed` |
| `availability.state` | `unrestricted`, `conditional`, `unavailable`, `unknown`, or `undisclosed` |
| `availability.conditions` | Explicit plan, role, flag, or other conditions, required only for `conditional` |
| `maturity` | `stable`, `experimental`, `deprecated`, `unknown`, or `undisclosed` |
| `audiences` | Known user/operator/admin/agent/developer values, or unknown/undisclosed |
| `discovery` | Assessed/partial/unassessed/undisclosed observations of specific discovery surfaces |
| `intent` | `public-discovery`, `limited-discovery`, `unknown`, or `undisclosed` |
| `publication.scope` | `internal` or explicitly approved `public` |
| `observation.state` | `current`, `stale`, or `unresolved`, independent of product lifecycle |

The scalar unknown/undisclosed fields require matching entries in `uncertainty_reasons`. Structured dimensions carry their own `reason`. Internal publication is the conservative default, not a claim that the owner explicitly declared the feature confidential.

`implemented` concerns inspected implementation evidence. It does not mean released, production-enabled, correct, or tested. A known availability value is a declaration in this revision. Detectors can observe source conditions, but cannot silently turn those into an assertion about deployed availability.

Confirmation is a maintainer review declaration. An agent may propose confirmation, but cannot invent the actor's approval. A confirmed feature can later have stale evidence without losing its identity or historical declarations.

## Surfaces and locators

A surface separates its semantic reference from its source location. For example, `ref: POST /api/import` is not a filename. Its locator supplies `path`, `content_sha256`, and optional line range and symbol. A line range without a source path is invalid. Content hashes use SHA-256 of exact file bytes.

`provenance` records adapter ID, version, origin, and extraction method. `origin` distinguishes deterministic extraction, agent assistance, and maintainer input. The surface's state makes retained stale or unresolved references explicit. Line numbers are useful navigation aids, not the stable identity of a feature.

Feature `entry_points` and `implements` reference surface IDs. Documentation and test associations reference document and test surfaces. A surface need not duplicate reverse feature IDs. Derive reverse lookups from canonical outgoing associations.

## Evidence assertions

Each evidence object has an ID, kind, state, and assertion. The assertion contains a field, the value it supports, and a readable claim.

| Kind | Required additional structure |
|---|---|
| `observed` | Source locator and detector provenance |
| `declared` | Declaring actor, source, recorded date-time, and optional source locator |
| `inferred` | Nonempty supporting evidence IDs, method, uncertainty level, and rationale |

For a current assertion, `assertion.value` equals the corresponding field in the feature record. `capability` binds to `description`. `dependencies` binds to the ordered target list, excluding the evidence-ID wrappers. Other assertion fields bind to their complete corresponding value. Structural schemas intentionally leave this value generic. The semantic validator must enforce the binding.

Historical stale or unresolved evidence may retain a previous field value. Do not rewrite an old observation to make it describe a newly inferred state. A historical value that no longer matches cannot support the current value. Stale supporting evidence cannot silently support a current inference. Inference support references must exist in the same feature record, cannot refer to themselves, and cannot form a cycle.

Every feature needs capability evidence, even a candidate. Known substantive fields need field-specific support. Confirmed recognition, released/retired lifecycle, known availability, known intent, and public publication permission require attributed declarations in 0.2.0. Public permission must be current. Other known fields can use appropriately scoped observations or explicit inferences. Not-applicable assessments and maintainer-reviewed associations require declarations.

Unknown values do not require fabricated evidence. They require a reason. An unsupported inference does not become valid merely because it has low confidence. The uncertainty enum is descriptive and uncalibrated, not a probability.

An evidence binding is a traceability mechanism, not a cryptographic authorization check or a truth proof. A validator cannot establish that a named actor actually approved a decision. Implementations must preserve approval provenance and must not invent it.

## Documentation and test assessments

Each assessment contains `state`, `result`, `adapter_ids`, `links`, and `reason`.

| State | Allowed result | Interpretation |
|---|---|---|
| `assessed` | `linked-evidence` or `no-linked-evidence` | Relevant supported scope completed |
| `partial` | `linked-evidence` or `unknown` | Some scope or evidence remains unverified |
| `unassessed` | `unknown` | Assessment not performed or unavailable |
| `not-applicable` | `not-applicable` | Attributed applicability decision |
| `undisclosed` | `undisclosed` | Deliberately withheld |

`linked-evidence` requires at least one accepted link. `no-linked-evidence` requires an assessed state and an empty link list. A partial result without a positive link is `unknown`, never `no-linked-evidence`. Unassessed, not-applicable, and undisclosed results have no asserted links.

Links record `surface_id` and one association method: `explicit-annotation`, `static-reference`, or `maintainer-reviewed`. Name similarity is a suggestion, not an accepted association. A maintainer review must be attributed in evidence. An association says nothing about runtime success, failure-path breadth, code coverage percentage, or documentation adequacy.

For assessed results, all named relevant adapters must have completed their supported eligible files. A skipped or failed adapter invalidates a negative conclusion. Retain old surfaces and evidence as stale while updating the current assessment to partial or unassessed. Assessing tests must cite test adapters, not substitute a completed tree adapter.

## Dependencies, identities, and editorial controls

Dependencies contain a target and field-specific evidence IDs. Targets are feature IDs or configured `external:<id>` values. Generate inbound edges. No independent `depended_by` editing and no inverse-coupling score.

The canonical feature ID is immutable. Aliases are retired or alternative identifiers, not display-name matches. They must not collide with another feature ID or alias. Redirects require existing source and target records, an attributed reason, a retired source, and an acyclic graph. Records are not deleted as a consequence of ordinary scanning.

`editorial.locked` is a closed set of supported editorial field names. Unknown names and typos fail validation. Identity and publication approval are protected even without a lock. Current evidence state and detector outcomes are never lockable. The scanner may report a conflict without overwriting a declaration.

Curation and display-name overrides live only in config. A nonempty selection requires attributed approval. Waivers also live in config and are keyed by stable feature ID and rule ID, with the assessed-basis fingerprint, reason, actor, and date-time. `gaps.yaml` projects their current applicability.

## Semantic validation requirements

Check ID uniqueness, alias and redirect integrity, surface/feature/external references, evidence bindings and inference acyclicity, correct association surface kinds, relevant adapter scope, locator resolution or stale state, current public approval, valid ordered curation, and exact derived projections.

Verify aggregate denominators and the artifact commit marker. Honor format checks rather than assuming date formats are enforced by every validator. Do not resolve unknown schema IDs over the network.

Record structural validation, reference integrity, source freshness, and policy outcomes separately. Passing one does not imply passing the others.
