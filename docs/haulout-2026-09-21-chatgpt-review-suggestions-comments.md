---
exported_at: 2026-09-21T03:07:15.960Z
platform: chatgpt
source: api
url: https://chatgpt.com/c/6aaf173a-6e6c-83e9-b422-c0766f666266
title: Review suggestions comments
conversation_id: 6aaf173a-6e6c-83e9-b422-c0766f666266
model: gpt-6-pro
created_at: 2026-09-19T23:14:05.448Z
updated_at: 2026-09-20T13:45:07.463Z
turns: 12
exporter: haulout 1.1.4
---

# Review suggestions comments

- **Platform:** ChatGPT
- **URL:** https://chatgpt.com/c/6aaf173a-6e6c-83e9-b422-c0766f666266
- **Created:** 2026-09-19T23:14:05.448Z
- **Updated:** 2026-09-20T13:45:07.463Z
- **Exported:** 2026-09-21T03:07:15.960Z
- **Turns:** 12
- **Source:** api (conversation API)

---

### You · turn 1 — 2026-09-19T23:14:05.504Z

Please review this. Any suggestions or comments?

---

### ChatGPT · turn 2 — 2026-09-19T23:21:16.159Z

{"paths":["files"]}

---

### ChatGPT · turn 3 — 2026-09-19T23:21:16.159Z

**I think FeatureFacts is worth building. The product boundary is strong, but I would reconcile the contracts before freezing these schemas as v0.1.** The prose describes a more trustworthy system than the current schemas and workflow rules can reliably support.

I read all 20 files and ran the five schemas, the supplied examples, and additional boundary cases through validation. I also prepared a [detailed review](sandbox:/mnt/data/featurefacts-review/REVIEW.md) and a [review package with reproducible validation checks](sandbox:/mnt/data/featurefacts-review.zip).

## What I would preserve

**The label-plus-register split is the right foundation.** `FEATURE_FACTS.md` answers the immediate question, “What can this product do?” The deeper register supplies the code locations, dependencies, tests, documentation, and caveats. That keeps the entry point useful without pretending twelve rows describe the whole product.

**Keeping this separate from AppFacts makes sense.** Composition and capability are different questions. Combining them would make the existing label harder to scan without giving the capability inventory enough room.

**The emphasis on repeated use is particularly good.** Stable IDs, editorial locks, retained retired features, and drift checking are more valuable than a tool that generates an impressive feature list once. The persistent register is what makes this useful across development sessions.

I would also retain the constraints around local operation, no runtime dependency, no default model calls, and no early web interface. The main improvements below do not require expanding those boundaries.

## 1. Make the evidence requirements enforceable

This is the most important correction.

The current feature-record schema accepts this:

```yaml
id: invented-feature
name: Invented feature
type: feature
status: shipped
```

No entry point, implementation location, or evidence is required. I confirmed that it passes validation. The schema requires only those four fields. fileciteturn2file0L15-L17

It also accepts an `observed` evidence claim without a locator and an `inferred` claim without any confidence value or supporting locator. Those omissions are permitted by the evidence definition. fileciteturn2file0L161-L169

You already make the correct distinction that schema-valid does not mean true. This is a narrower issue: **the schema should at least require the evidence structure that the product promises.**

I would distinguish three kinds of claim:

- **Observed:** An adapter found something specific in a source.
- **Declared:** A maintainer or authoritative document asserts something.
- **Inferred:** A rule or agent concludes something from supporting evidence.

These are meaningfully different. “This route exists in the inspected source” can be observed. “This capability is intentionally hidden” will often be a maintainer declaration. “These routes collectively implement resume import” may initially be an inference.

Evidence should also identify **which assertion it supports**. A route-existence citation should not silently justify shipped status, adequate documentation, and broad test coverage.

Some of this can be enforced with conditional schema requirements. JSON Schema supports requiring different structures depending on another field’s value. Resolving locators and checking cross-record references would then be separate semantic checks. citeturn493675view0

## 2. Give uncertainty a proper representation, and separate overlapping states

There is an unfortunate asymmetry in the current contract:

**A feature can claim to be shipped without evidence, but it cannot say its status is unknown.**

The map requires `status`, and its enum has neither `unknown` nor `undisclosed`. Meanwhile, `visibility` and `intent` do allow `unknown`. fileciteturn2file0L17-L39

I would fix that before implementation. Otherwise, an honest scanner has no valid status to emit when it finds implementation evidence but cannot establish release state.

I would also distinguish an unknown value from an intentionally undisclosed one. “We did not determine this” and “we are not publishing this” should not become interchangeable in the deeper register.

There is a related modeling issue: the status enum combines several dimensions. A feature can simultaneously be:

> Shipped, experimental, available only on one plan, and visible only to administrators.

But `shipped`, `gated`, and `experimental` are currently mutually exclusive status values. Likewise, `landing`, `in-app`, and `admin` combine discovery surfaces with audience. fileciteturn2file0L29-L39

I would separate, at least in the map, lifecycle, availability conditions, audience, and observed discovery surfaces. The label can still project those into a compact summary.

This does not need to become an entitlement-management system. It just needs to avoid forcing a truthful combination into one misleading word.

## 3. Do not let “not detected” become “does not exist”

This principle should be explicit throughout the scanner, scoring, gaps, and retirement rules.

Consider a scan in which the test adapter does not understand the repository. The correct result is:

> Test assessment unavailable for this scope.

It is not:

> This feature has no tests.

Similarly, inspecting one local HTML file cannot establish that a feature has no marketing mention anywhere. A missing observation needs a declared scope before it can support a negative conclusion.

The package already permits skipped detectors, which is good. What is missing is the downstream contract for handling their absence.

I would make the manifest explain what was inspected, which adapters completed, which paths were excluded, and what was unsupported or failed. Assessments should distinguish a supported search that found nothing from an assessment that never happened.

**The word “complete” deserves particular caution.** I would describe the map as the maintained register for the declared survey scope, rather than implying that a scanner has established every capability in an arbitrary codebase.

That still delivers substantial value. A register with explicit blind spots is more useful than an apparently exhaustive one whose blind spots are invisible.

## 4. Reduce the strength of the scoring claims in v1

I like the health questions. I am less convinced by the initial numerical answers.

In `GENESIS.md`, `tested: 1.0` means at least one test cites the feature’s entry points or named behavior. That is evidence of a test association, not necessarily evidence that the feature works, that the test passes, or that failure paths are covered.

The schema’s `covers` values go further, distinguishing `happy-path`, `failures`, and `broad`. Those classifications need a stronger basis than a matching filename or reference. fileciteturn2file0L120-L133

For the first release, I would favor statements like:

> Two linked tests found. Failure-path coverage has not been assessed.

For aggregate reporting:

> Ten of seventeen surveyed features have linked test evidence. Four features were not assessed.

That is easier to interpret than `tested: 0.58`, unless the score’s denominator, exclusions, and meaning are clearly specified.

The same applies to documentation quality and discoverability. Keep the questions, but do not require precise-looking decimals before the measurement rules are established.

**I would also reconsider the name `coupled`.** Its current definition gives higher values to isolation, which invites misreading. Moreover, a highly connected shared capability is not automatically badly designed. The schema explicitly defines `1.0` as isolated and `0.0` as a “god-feature.” fileciteturn2file0L136-L149

Either rename the field before freezing it, or initially report graph observations without turning them into a general architectural-health grade.

## 5. Decide who owns label curation, and what may be published

The specification has two reasonable ideas that need an explicit reconciliation:

`LABEL.md` says the label’s frontmatter is the source of truth. `GENESIS.md` says `features.yaml` is the editorial source of truth, and the skill regenerates the label from curated map rows.

What is missing is a durable answer to:

> Where are the selected feature IDs, their order, and any label-specific overrides stored?

Without that, different implementations could make different choices about whether a scan overwrites label edits, replaces selected rows, or changes their ordering.

I would define two modes.

**Map-backed labels:** The register owns capability facts. A persistent ordered selection owns which features appear on the label. Any display overrides have an explicitly defined home.

**Standalone labels:** Frontmatter owns the declared list. Its evidence sources and verification limits are explicit, and it does not imply that a nonexistent map backs its claims.

There is also a publication decision hiding inside this design.

An internal register can legitimately contain administrative functions, intentionally hidden capabilities, and sensitive code locations. That does not mean all of those belong in a public label or viewer.

**Product visibility and permission to publish are different things.** Not every hidden feature is confidential, but “hidden” is not authorization to disclose it either.

I would add a small, explicit publication policy. It should apply to rows, map links, and aggregate counts. Excluding a private feature from the table while including it in a public hidden-feature count can still reveal something the owner intended to withhold.

## 6. Strengthen the rescan, retirement, and freshness guarantees

This is where the tool could earn trust or lose it.

### Missing evidence should not immediately mean a dead feature

The merge rules allow retirement when a feature loses all evidence. But evidence can disappear because an adapter failed, a path was excluded, or a parser stopped recognizing a pattern.

I would require a completed relevant scan and defined removal criteria before retirement. Otherwise, retain the record and mark its evidence stale or unresolved.

Also, `orphaned` should not necessarily be a product lifecycle state. It may describe the scanner’s inability to associate evidence with a feature that still exists.

### Matching by name needs a conservative fallback

Two capabilities can share a display name. A feature can be renamed without becoming a new feature. Several old clusters can become one reviewed feature.

Name-only matching should produce a review conflict when ambiguous, not silently inherit the wrong identity.

The existing “scan twice, no duplicate IDs” fixture is useful, but I would add path moves, duplicate names, and reviewed cluster changes.

### Label consistency is not source freshness

Under the written fingerprint contract, the label is checked against fields resampled from the map.

That leaves a straightforward failure case:

> The source changes, but both the map and label remain stale. The label still agrees with the map.

Those artifacts are consistent with each other, but not current.

I would explicitly separate:

**Projection consistency:** Does the label match the register?

**Source freshness:** Does the register reflect the relevant current inputs, configuration, and detector versions?

Both checks matter. One should not be presented as the other.

## Concrete corrections I would make in the package

These are smaller than the design issues above, but several are directly testable.

| Issue | Suggested correction |
|---|---|
| `LABEL.md` allows `undisclosed` health values, but the label schema rejects them. | Align the schema and prose with the chosen uncertainty model. |
| The canonical `features.yaml` collection has no wrapper schema, only a feature-record schema. | Define its versioned top-level structure before implementations diverge. |
| There is a sample config but no config schema. | Add one, including the curation and policy contract. |
| Recommended `intent: tribal-knowledge` is not a permitted intent. | Model documentation exceptions separately from visibility intent. |
| Arbitrary lock names, including typos, pass validation. | Validate supported field paths. |
| Duplicate feature IDs on the label pass validation. | Add ID-level semantic uniqueness checks. |
| The ID expression rejects `ai` but accepts `a--b`. | Decide what “kebab-case” should mean and encode that consistently. |
| The sample label’s date is unquoted. | Emit `date: "2026-09-19"` and specify YAML parsing expectations. |
| The example include patterns omit root `README.md`. | Include the root documentation and entry points the adapters are meant to inspect. |
| A label must contain at least one feature, but an unsupported or empty repository may yield none. | Specify a truthful no-result outcome rather than forcing a fabricated row. |

The date issue is specifically a portability finding. In my test, PyYAML converted the unquoted date into a Python date object, which then failed the schema’s string requirement. Normalizing it to a string made the supplied label pass. PyYAML documents this timestamp conversion behavior. citeturn493675view3

All five schemas themselves passed meta-validation. The supplied feature and gaps examples also passed. The problem is not malformed schemas, it is incomplete or inconsistent guarantees.

## Two additions I would bring into the first practical release

**Explicit self-exclusion and safe scanning.** State that generated FeatureFacts labels, maps, and reports are not independent evidence. Otherwise, the scanner could ingest its own prior claims as documentation and make them appear corroborated. Also specify that the default scan does not execute target application code, configuration, hooks, or tests.

**A self-sufficient skill bundle.** The no-CLI fallback promises schema-valid output, but the installation instructions currently focus on copying `SKILL.md`. Bundle the schemas, examples, and validation instructions too. The Agent Skills format supports reference material and assets, so these do not need to bloat the main skill instructions. citeturn698595search2

## How I would narrow the first build

I would prioritize **one supported ecosystem, reliable evidence extraction, a reviewed capability register, persistent curation, and safe rescans**.

Move a real-repository evaluation earlier. A tiny fixture can prove that files are emitted and IDs are retained, but it cannot prove that the output reads like a product rather than a renamed directory tree.

The first meaningful acceptance test should be:

> A maintainer recognizes the capabilities, can inspect the supporting evidence, can correct the grouping, and does not lose those corrections on subsequent scans.

I agree with keeping the default scanner deterministic. I would just avoid making that synonymous with fully autonomous recovery of product meaning. Deterministic extraction and verification can support a partly curated capability model without weakening the product.

Finally, I would simplify the normative language. Keep the map metaphor for identity, but use **features, dependencies, documentation, and tests** in contracts and actions. “Contours,” “drainages,” “deeds,” and “benchmarks” add translation work, especially when “benchmark” can mean something different from a functional test.

**My overall recommendation is to keep the concept, tighten the claims, and resist adding more machinery yet. The successful first version is one a builder trusts after the tenth scan, not just one that produces an impressive first label.**

---

### You · turn 4 — 2026-09-19T23:24:47.175Z

Excellent! Can you update the package with your suggestions?

---

### ChatGPT · turn 5 — 2026-09-19T23:44:53.943Z

{"paths":["files"],"query":"read"}

---

### ChatGPT · turn 6 — 2026-09-19T23:44:53.943Z

{"path":"/files/read","args":{"read":[{"ref_id":"file_00000000907881f59b0cb667ff167219","start_line":1,"max_lines":1000},{"ref_id":"file_0000000018d081f591b738d0861f19e0","start_line":1,"max_lines":1000}]}}

---

### ChatGPT · turn 7 — 2026-09-19T23:44:53.943Z

**Done. [Download the updated FeatureFacts specification package, v0.2.0](sandbox:/mnt/data/featurefacts-spec-v0.2.0.zip).**

I revised **all 20 original files**, with corresponding changes to the schemas, examples, build instructions, and agent protocols. The original package is unchanged. This is marked as a **breaking draft revision** because the field definitions and ownership rules have materially changed.

### What changed

**Evidence and data contracts.** The package now distinguishes observations, declarations, and inferences, binds evidence to specific claims, and separates lifecycle, availability, maturity, audience, discovery, and publication permission. Unknown, undisclosed, partial, and unassessed results have explicit representations. Numerical health scores have been replaced with scoped evidence-association summaries.

**Curation, publication, and maintenance.** Approved label selection and ordering now have a persistent home. Public projections filter private capabilities before calculating counts or generating output. Standalone labels and zero-feature outcomes are defined. Rescanning rules preserve identity and editorial decisions, require reviewed retirement, and distinguish label consistency from actual source freshness.

**Implementation handoff.** Added migration guidance, a decision log, review-to-change traceability, safety requirements, reproducible validation tools, and a production acceptance matrix. The build plan brings real-repository evaluation into the first useful release while deferring unnecessary expansion.

### Validation

**All 112 automated package checks passed across 11 schemas.** The separately packaged skill bundle also passed the same checks. These validate the specification, synthetic examples, and reference contract behavior, not a production scanner. Production acceptance scenarios remain explicitly pending implementation.

The ZIP retains `featurefacts-spec/` as its top-level directory, so the existing kickoff paths still work. Start with `README.md`, or give the implementation agent `KICKOFF.md`.

[Change log](sandbox:/mnt/data/featurefacts-updated/featurefacts-spec/CHANGELOG.md) · [Validation report](sandbox:/mnt/data/featurefacts-updated/featurefacts-spec/VALIDATION.md) · [Self-contained draft skill bundle](sandbox:/mnt/data/featurefacts-skill-v0.2.0.zip)

---

### You · turn 8 — 2026-09-20T13:35:12.446Z

Would this be a pretty unique and useful offering overall? Seems like it would be, especially open source.

---

### ChatGPT · turn 9 — 2026-09-20T13:39:19.349Z

{"paths":["files"]}

---

### ChatGPT · turn 10 — 2026-09-20T13:39:19.349Z

**Yes, I think FeatureFacts could be genuinely useful and meaningfully differentiated, especially as an open-source project.** But after checking the current landscape, I would describe it as **a distinctive, more rigorously specified approach to an existing problem**, rather than an entirely new category.

That distinction does not weaken the case for building it. It makes the positioning clearer.

## There is a surprisingly close open-source neighbor

The closest thing I found is the MIT-licensed **`feature-inventory` skill in `yashasvigirdhar/skills`**. It creates a YAML inventory of user-facing capabilities, connecting frontend routes, API endpoints, tests, documentation, and feature flags. It includes an initial human-review step and subsequent drift synchronization. That is direct conceptual overlap, not merely another documentation generator. citeturn395359view1

Its published schema also includes stable feature IDs, lifecycle status, personas, and links to associated artifacts. So “structured feature inventory,” “agent-readable,” “stable IDs,” and “keep it synchronized” are not individually unique claims. citeturn993319view0

Other tools address parts of the same problem:

| Offering | Its documented focus | Where I see FeatureFacts fitting differently |
|---|---|---|
| **DeepWiki** | Generates codebase explanations, architecture diagrams, source links, and repository Q&A. citeturn395359view3 | A structured capability register rather than primarily an explanatory wiki. |
| **Backstage** | Catalogs software entities, ownership, and metadata using files stored alongside code. citeturn182872view1 | A smaller, product-capability-focused artifact, usable without adopting a developer portal. |
| **Serenity BDD** | Produces living documentation describing product behavior through requirements and automated acceptance tests. citeturn993319view2 | An inventory that can begin with the available evidence, including capabilities whose test associations remain unknown. |
| **OpenSpec** | Maintains specifications and change artifacts to guide development with coding assistants. citeturn438767view1 | A complementary account of observed and declared capabilities, rather than primarily a specification of intended behavior. |
| **Quill** | Describes feature discovery from code, documentation generation, preserved human edits, and drift detection. citeturn438767view2 | A reusable register as the principal output, rather than a catalog primarily supporting generated documentation and walkthroughs. |

These are comparisons of published documentation and source instructions, not hands-on benchmarks. In particular, I would not claim that evidence links, human review, or drift detection are absent from neighboring tools.

## What I think is genuinely distinctive

**The strongest distinction is the combination of a readable capability label with a maintained register that makes its evidence and limitations inspectable.**

The revised specification goes beyond collecting feature names. It defines field-bound observations, declarations, and inferences, explicit uncertainty, assessment completeness, source provenance, and independent feature dimensions. It also defines conservative retirement, publication filtering, persistent editorial choices, and separate source-freshness and label-consistency checks. Those are substantial parts of the proposed product, not just presentation details. fileciteturn2file0L15-L21

The difference becomes concrete in a hypothetical example:

> **Basic inventory:** “Data export, shipped, tested.”
>
> **FeatureFacts:** “Data export is declared shipped by the maintainer. The inspected source contains these entry points. Two test associations were found, but test execution was not assessed. This declaration remains current, while one source association needs rechecking.”

The second representation is more useful when someone needs to make a decision, not merely skim a list.

I would organize the differentiation around three things:

**Evidence that can be questioned.** A reader can distinguish what the scanner found from what a maintainer stated or an agent inferred. The tool does not need to pretend that all three have equal authority.

**Information that survives maintenance.** A maintainer’s correction should become durable knowledge, not something the next scan casually overwrites. The value lies partly in avoiding the same review repeatedly.

**Two levels of detail for different jobs.** A compact label helps someone understand the product quickly. The register supports investigation, maintenance, and automation. Neither has to become bloated to serve the other.

None of those ideas is unprecedented alone. Together, implemented well in a small tool, they make a credible offering.

## Where I expect the usefulness to be strongest

My strongest use-case hypothesis is **maintainers and coding agents returning to an evolving product**, rather than visitors reading a public feature label.

Consider the questions someone might ask before changing a capability:

> Where does this begin? What else belongs to it? Which documentation and tests are associated with it? Which parts of this record were reviewed? What has changed since then?

FeatureFacts could provide a reviewed starting point for those questions. It should still send the reader back to relevant source evidence, not replace that inspection.

For your own workflow, that seems particularly well aligned. You build multiple tools and want them to compose. A maintained register could let a documentation tool, a review skill, and a coding agent start from the same approved capability definitions instead of each inventing a slightly different product model.

**That is a more compelling benefit than “generate a feature list.”**

A second promising use case is **handoff and onboarding**. I would test whether a new contributor can move from a product-level task to the relevant implementation, documentation, and tests more accurately with FeatureFacts than with the README and ordinary code search alone.

A third is **public communication**. An approved label could give an open-source project a consistent, readable account of its capabilities without exposing its whole internal register. The revised package explicitly separates publication decisions from internal inventory and filters public output accordingly. fileciteturn2file0L17-L21

The public label could attract attention. The maintained register would need to justify continued use.

## Why open source is a particularly good fit

I see open source as more than a pricing decision here.

**The format becomes more useful when other tools can rely on it.** A documentation generator should not have to run your scanner to consume an existing register. A review tool should not need a hosted account to interpret evidence states. A maintainer should be able to retain the artifacts even after changing tools.

That suggests an important principle:

> **The register should remain useful independently of the tool that generated it.**

Open source could also make the interpretation rules easier to challenge. When a tool reports that evidence is stale or an association is missing, users should be able to inspect how it reached that result and improve the relevant detector.

It creates a plausible path for framework-specific contributions, too. Rather than requiring one maintainer to understand every stack, contributors could add bounded adapters that emit the same evidence contract.

Those are potential benefits, not automatic outcomes. A public repository alone does not create interoperability, trustworthy extraction, or a contributor community. The schema, examples, validation tools, and extension boundaries have to make participation practical.

Also, **open source itself is not the differentiator**, since the closest feature-inventory alternative is already MIT-licensed. The differentiator would be what your implementation guarantees and how little friction it adds. citeturn395359view1

## The biggest risk is maintenance burden, not lack of novelty

My main concern would be building something that is impressively rigorous but asks users to become administrators of a second product model.

Every additional field, approval, exception, and correction has a cost. The stronger contract pays off only when the tool handles enough of the work that maintaining the register is easier than repeatedly reconstructing the same knowledge.

There is also a straightforward substitution test:

> Why should someone install FeatureFacts rather than ask their existing coding agent to create and maintain a YAML feature inventory?

Your answer cannot merely be “ours also produces YAML.” It needs to be something like:

> “Your agent can help build the inventory. FeatureFacts supplies the shared format, validation, evidence rules, safe update behavior, and readable outputs that make the inventory dependable over time.”

That is a legitimate reason for a separate tool.

## What would convince me it is working

I would look for **continued use after real changes**, not just favorable reactions to the first generated label.

The revealing demonstration would be a repository where a maintainer corrects the initial grouping, development continues, and subsequent scans preserve those decisions while identifying useful changes without flooding the maintainer with noise. Then another person or agent uses the register to complete a real task.

Exec Foundry would be a useful initial proving ground because you can judge whether the capability model matches the product. A few repositories maintained by other people would then test whether the value extends beyond your own conventions.

At present, the package is a revised specification with validation fixtures, not a working production scanner or evidence of adoption. That is the main remaining uncertainty, rather than whether the concept has a sensible use. fileciteturn2file0L11-L13 fileciteturn2file0L27-L31

**My overall view: yes, this deserves its own open-source project. I would position it as “an inspectable, maintainable map of your product’s capabilities,” not “the first tool that discovers features.” The opportunity is to make that map dependable enough that people and other tools keep using it.**

---

### You · turn 11 — 2026-09-20T13:43:13.360Z

Can you add this review to the ZIP?

---

### ChatGPT · turn 12 — 2026-09-20T13:45:06.174Z

[Download the updated FeatureFacts ZIP](sandbox:/mnt/data/featurefacts-spec-v0.2.0-with-review.zip)

Added the full review as **`featurefacts-spec/docs/OFFERING_REVIEW.md`**, including the competitive comparison, differentiation, open-source rationale, adoption risks, and source links.

All 93 existing files are unchanged, and the updated archive passed its integrity check.
