# FeatureFacts: Uniqueness, Usefulness, and Open-Source Fit

*Conversation review, added to the specification package on September 20, 2026. This is a product assessment, not a normative specification. External links are retained from the review. References to the package use relative links.*

**Yes, I think FeatureFacts could be genuinely useful and meaningfully differentiated, especially as an open-source project.** But after checking the current landscape, I would describe it as **a distinctive, more rigorously specified approach to an existing problem**, rather than an entirely new category.

That distinction does not weaken the case for building it. It makes the positioning clearer.

## There is a surprisingly close open-source neighbor

The closest thing I found is the MIT-licensed **`feature-inventory` skill in `yashasvigirdhar/skills`**. It creates a YAML inventory of user-facing capabilities, connecting frontend routes, API endpoints, tests, documentation, and feature flags. It includes an initial human-review step and subsequent drift synchronization. That is direct conceptual overlap, not merely another documentation generator. ([Skill source](https://raw.githubusercontent.com/yashasvigirdhar/skills/main/feature-inventory/SKILL.md))

Its published schema also includes stable feature IDs, lifecycle status, personas, and links to associated artifacts. So “structured feature inventory,” “agent-readable,” “stable IDs,” and “keep it synchronized” are not individually unique claims. ([Schema source](https://raw.githubusercontent.com/yashasvigirdhar/skills/main/feature-inventory/references/schema.md))

Other tools address parts of the same problem:

| Offering | Its documented focus | Where I see FeatureFacts fitting differently |
|---|---|---|
| **DeepWiki** | Generates codebase explanations, architecture diagrams, source links, and repository Q&A. ([Documentation](https://docs.devin.ai/work-with-devin/deepwiki)) | A structured capability register rather than primarily an explanatory wiki. |
| **Backstage** | Catalogs software entities, ownership, and metadata using files stored alongside code. ([Documentation](https://backstage.io/docs/features/software-catalog/)) | A smaller, product-capability-focused artifact, usable without adopting a developer portal. |
| **Serenity BDD** | Produces living documentation describing product behavior through requirements and automated acceptance tests. ([Documentation](https://serenity-bdd.github.io/docs/reporting/living_documentation)) | An inventory that can begin with the available evidence, including capabilities whose test associations remain unknown. |
| **OpenSpec** | Maintains specifications and change artifacts to guide development with coding assistants. ([Repository](https://github.com/Fission-AI/OpenSpec)) | A complementary account of observed and declared capabilities, rather than primarily a specification of intended behavior. |
| **Quill** | Describes feature discovery from code, documentation generation, preserved human edits, and drift detection. ([How it works](https://quilldocs.ai/how-it-works)) | A reusable register as the principal output, rather than a catalog primarily supporting generated documentation and walkthroughs. |

These are comparisons of published documentation and source instructions, not hands-on benchmarks. In particular, I would not claim that evidence links, human review, or drift detection are absent from neighboring tools.

## What I think is genuinely distinctive

**The strongest distinction is the combination of a readable capability label with a maintained register that makes its evidence and limitations inspectable.**

The revised specification goes beyond collecting feature names. It defines field-bound observations, declarations, and inferences, explicit uncertainty, assessment completeness, source provenance, and independent feature dimensions. It also defines conservative retirement, publication filtering, persistent editorial choices, and separate source-freshness and label-consistency checks. Those are substantial parts of the proposed product, not just presentation details. ([Package change log, Contract changes](../CHANGELOG.md#contract-changes))

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

A third is **public communication**. An approved label could give an open-source project a consistent, readable account of its capabilities without exposing its whole internal register. The revised package explicitly separates publication decisions from internal inventory and filters public output accordingly. ([Package change log, Contract changes](../CHANGELOG.md#contract-changes))

The public label could attract attention. The maintained register would need to justify continued use.

## Why open source is a particularly good fit

I see open source as more than a pricing decision here.

**The format becomes more useful when other tools can rely on it.** A documentation generator should not have to run your scanner to consume an existing register. A review tool should not need a hosted account to interpret evidence states. A maintainer should be able to retain the artifacts even after changing tools.

That suggests an important principle:

> **The register should remain useful independently of the tool that generated it.**

Open source could also make the interpretation rules easier to challenge. When a tool reports that evidence is stale or an association is missing, users should be able to inspect how it reached that result and improve the relevant detector.

It creates a plausible path for framework-specific contributions, too. Rather than requiring one maintainer to understand every stack, contributors could add bounded adapters that emit the same evidence contract.

Those are potential benefits, not automatic outcomes. A public repository alone does not create interoperability, trustworthy extraction, or a contributor community. The schema, examples, validation tools, and extension boundaries have to make participation practical.

Also, **open source itself is not the differentiator**, since the closest feature-inventory alternative is already MIT-licensed. The differentiator would be what your implementation guarantees and how little friction it adds. ([Skill source](https://raw.githubusercontent.com/yashasvigirdhar/skills/main/feature-inventory/SKILL.md))

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

At present, the package is a revised specification with validation fixtures, not a working production scanner or evidence of adoption. That is the main remaining uncertainty, rather than whether the concept has a sensible use. ([Package change log](../CHANGELOG.md), including [Examples and validation](../CHANGELOG.md#examples-and-validation))

**My overall view: yes, this deserves its own open-source project. I would position it as “an inspectable, maintainable map of your product’s capabilities,” not “the first tool that discovers features.” The opportunity is to make that map dependable enough that people and other tools keep using it.**
