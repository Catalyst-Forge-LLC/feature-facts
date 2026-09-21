# FEATURE_FACTS.md: label contract

The label answers **What can this product do?** It is a small entry point, not the full feature register.

## Two authority modes

**Map-backed mode:** `features.yaml` owns capability facts. `config.yaml` owns approved ordered `curation.selected_ids`, optional name-only display overrides, publication target, and aggregate inclusion. Frontmatter and Markdown are generated. Do not hand-edit factual label fields, counts, or statuses.

**Standalone mode:** Frontmatter owns an attributed declared list. Require a declaration identifying actor, source, and recorded time, plus `verification_limits`. Do not emit a map link, registry-wide counts, or register assessment rollups. Every row has `evidence_state: declared`. A standalone label is not a source-freshness check or an assertion that the full product was inspected.

## Stable selection

Selection is zero to 12 unique feature IDs, in the owner's chosen order. Initialization creates an empty selection. A scanner can suggest candidates for curation but cannot silently approve or promote them. More than 12 IDs is a validation error, not an instruction to truncate them.

Map-backed rows are selected only from confirmed, non-retired capabilities eligible for the publication target. Candidate clusters are excluded. An unconfirmed, missing, retired, or disallowed selected ID produces a review diagnostic. Preserve its identity in canonical history and never silently substitute a different feature. Redirects do not silently rewrite an approved selection.

Retained stale capabilities can still occupy their approved row with `evidence_state: stale` or `unresolved`. Do not imply current source verification. Normal rendering must report invalid curation. Public rendering must always filter disallowed rows, even in an error path. Publication revocation must not leave an old now-disallowed label presented as current. Replace it with the safe filtered projection or remove it and report failure.

Overrides can change the short display name only. They must be attached to selected IDs and covered by curation approval. Lifecycle, availability, evidence assessments, and publication permission cannot be overridden in the label.

## Frontmatter

Required fields are `feature_facts_version`, `mode`, `audience`, product `name`, `type`, and `status`, `selection_state`, `features`, `basis`, and `generated`. Product license is optional.

Map-backed mode uses `basis.kind: registry`. Standalone mode uses `basis.kind: declaration`, and requires the explicit declaration and verification limits.

`selection_state` is `curated` when rows exist. An empty row list requires `empty_reason` and either `not-curated` or `no-eligible-features`. Do not use “no features exist” when the actual result is unsupported scanning or absent curation.

The generated object contains a quoted date string, generator name, generator version, and the SHA-256 projection fingerprint. Do not add a private source tree hash, internal commit ID, adapter diagnostics, or registry hash to a public label.

## Each row

Each row contains `id`, `name`, `lifecycle`, `availability`, availability `conditions`, `maturity`, `documentation`, `tests`, and `evidence_state`.

Lifecycle, availability, and maturity remain separate. This allows “released, experimental, Pro plan and member role” without forcing mutually exclusive status values. Conditional availability requires conditions. Other availability states have no conditions.

Documentation and test columns are compact projections. An assessed result displays `linked-evidence` or `no-linked-evidence`. A partial assessment displays `partial`. An unassessed result displays `unknown`. Not-applicable and undisclosed retain their explicit states. These are not grades.

Map-backed `evidence_state` comes from the feature's observation state. Standalone rows use `declared`. The body must make stale, partial, unknown, or declaration-only limitations visible rather than only storing them in frontmatter.

## Aggregates

Aggregates are optional and include only **eligible confirmed active capabilities**, where active means non-retired. “Registered” does not mean every record in the private register. It excludes candidates, retired records, and, for public labels, every unapproved private record.

`counts.registered = counts.selected + counts.unlabeled`. `selected` equals the emitted row count. `unlabeled` means eligible but not selected, not undiscovered or unnamed.

For documentation and tests, each rollup exposes `eligible`, `assessed`, `with_links`, `without_links`, `partial`, `unassessed`, `not_applicable`, and `undisclosed`.

```text
assessed = with_links + without_links
eligible = assessed + partial + unassessed + not_applicable + undisclosed
```

The `with_links` and `without_links` subcounts refer only to fully assessed capabilities. Partial observations remain in the partial bucket. A suitable rendering is “10 of 13 assessed capabilities have linked test evidence, with 4 additional eligible capabilities unassessed.” Never describe this as source-code coverage.

This revision removes the previous overlapping shipped/gated/hidden/dead counts and 0-to-1 health scores. A later format may add dimension-specific counts with explicit overlap and scope rules.

## Publication and links

The default target is internal. The normal internal link is `.featurefacts/FEATURES.md`, rendered as a Markdown link, not just a code-formatted directory name.

A public label is a filtered projection. It cannot link to the private register in 0.2.0. The config's public `map_link` is null, and the label has no `map` field. A safe public register exporter is deferred, rather than treating a manually supplied URL as proof that an internal register is safe to expose.

Filter before calculating counts, assessments, selection outcomes, content fingerprints, and rendered body. A private-only change must not change the public semantic projection. Timestamps update only when the public projection itself changes, avoiding private change signals through rewritten public labels.

A feature's public approval covers the defined label whitelist, including its displayed availability conditions. It does not authorize publishing source locators, dependencies, raw evidence, private diagnostics, or the full registry.

## Projection fingerprint and checks

The projection fingerprint is SHA-256 of canonical label frontmatter with the entire `generated` object omitted. Canonicalization uses UTF-8 JSON, sorted object keys, preserved array order, no insignificant whitespace, and no non-finite values. The supported data uses strings, booleans, nulls, integers, arrays, and objects. Do not change escaping or number rules across implementations without compatibility tests.

This fingerprint detects label-content drift. `check --projection` compares the current canonical register and config projection with frontmatter and body. Default `check` additionally recomputes source inputs and detector/config/rule fingerprints. A stale map and stale label can agree with each other and still fail source freshness.

A standalone label can be checked for structure, self-fingerprint, and body consistency. Its source-freshness result is explicitly unavailable or not applicable, not a fabricated pass.

## Rendering

Escape untrusted Markdown table content and HTML. Do not render raw source snippets as active HTML. Keep the default body to a capability table, clear limitations, optional aggregates, and a usable map link when permitted. Dependencies, locators, gaps, and lengthy descriptions belong in the register.
