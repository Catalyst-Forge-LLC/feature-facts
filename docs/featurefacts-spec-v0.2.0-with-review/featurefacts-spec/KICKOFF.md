# Kickoff: paste into a builder agent

Use in a new implementation repository. Adjust only the path to this package.

> Follow `featurefacts-spec/AGENTS.md` as the build protocol. Read `BUILD.md`, `docs/GENESIS.md`, `docs/CONTRACT.md`, `docs/LABEL.md`, `docs/DETECTORS.md`, `docs/MERGE_AND_CHECK.md`, and `docs/PUBLICATION_AND_SAFETY.md` in that package.
>
> Implement FeatureFacts as two reading depths: a curated `FEATURE_FACTS.md` label and a bounded, evidence-backed `.featurefacts/` register. This is a sibling of AppFacts, not an AppFacts extension. Use the revised 0.2.0 contract, with separate lifecycle, availability, maturity, audience, and disclosure states. Unknown is not undisclosed. Candidate clusters are not confirmed features.
>
> Do not select the production stack until I supply it. The included Python helpers are spec tests only. Draft `docs/PHASE_1_BRIEF.md` and obtain my approval before scaffolding application code. Include one supported ecosystem and an early private real-repository evaluation.
>
> Preserve IDs, approved curation, declarations, and locks. Do not infer release from source presence, absence from a skipped adapter, or broad coverage from a test filename. Default scans must not execute target code, use the network, call a model, or add a runtime dependency to the target app. Keep internal capabilities out of public projections and counts unless explicitly approved.
>
> Run the package validator. Treat the production acceptance scenarios as pending until the implementation demonstrates them. Keep the label small, and make the tenth scan as trustworthy as the first.
