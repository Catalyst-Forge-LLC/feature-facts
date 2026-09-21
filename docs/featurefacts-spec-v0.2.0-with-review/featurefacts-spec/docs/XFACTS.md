# xFacts family placement

FeatureFacts is a new family row, not an AppFacts property. The family plan retained from the original specification is:

| Label | Layer | Question | Planned site |
|---|---|---|---|
| AppFacts | Body | What is this app built from? | appfacts.dev |
| ModelFacts | Brain | What does this model document about itself? | modelfacts.dev |
| ToolFacts | Toolbelt | What does this tool touch when invoked? | toolfacts.dev |
| AgentFacts | Hands | What may this configuration do? | agentfacts.dev |
| SkillFacts | Playbook | What will this skill teach an agent to do? | skillfacts.dev |
| FeatureFacts | Terrain | What can this product do? | featurefacts.dev |

This is the intended integration plan, not a verification that any site or hub change has been deployed. The x is a variable, not a social network.

## Shared conventions

Keep one primary question, a small root Markdown artifact, closed machine-readable vocabularies, explicit uncertainty, and the inherited licensing intent. A structurally valid label is not a truth certificate. Do not upload secrets or source material to a model without authorization.

Map-backed FeatureFacts frontmatter is a generated projection from the registry and config. Standalone frontmatter owns an attributed declared list. This is an explicit ownership refinement of the older blanket “frontmatter is the source of truth” convention.

## Deeper reading

```text
FEATURE_FACTS.md
  -> .featurefacts/FEATURES.md      Internal readable register
     features.yaml                Canonical bounded capability register
     gaps.yaml                    Applicable findings
     surfaces.json                Source observations and provenance
```

The public label does not expose the private map in 0.2.0. Humans and agents start with the label, then retrieve only the internal evidence needed for the task when authorized.

## Future hub work

When the product actually ships, update the xFacts hub's family table, agent-facing index, and shared footer in the relevant repositories. A viewer may follow the family pattern later, after a safe publication contract exists. None of those external repository changes is performed by this spec package.
