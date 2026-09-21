# FeatureFacts — context prompt

Merge of `docs/PHASE_1_BRIEF.md` for later sessions.

**Product:** FeatureFacts, xFacts Terrain label. Question: What can this product do?

**Stack:** pnpm + TypeScript + ESM. No PocketBase. No FilePress. Worker + static `site/`.

**First ecosystem:** TypeScript/Node.

**Hero flow:** `init` → `scan` → review candidates → `report` → `check`.

**Hard rules:** Do not execute target code. Do not use the network or a model in the default scan. Do not auto-confirm or auto-curate. Unknown ≠ undisclosed. Candidates ≠ confirmed. Public projections filter private rows, paths, hashes, and counts. Preserve IDs and approved curation.

**Out of scope until later:** visual topology, MCP, hosted drift, automatic retirement, additional ecosystems.

**Docs of record:** `docs/PHASE_1_BRIEF.md`, `.forgetrail/workflow_tracking.json`, `SPEC.md`.
