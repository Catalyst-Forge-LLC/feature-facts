# FeatureFacts — Phase 1 architecture brief

_Structured capture of planning and architecture **before** code scaffolding. Goal: Phase 2 (or a new agent/session) can start from this file + `.forgetrail/workflow_tracking.json` without re-reading the whole Phase 1 chat._

**Status:** `locked`  
**Last updated:** `2026-09-21`  
**Phase 1 exit:** Locked with owner-selected stack, first ecosystem, site chrome, and Phase 1 command set. Production scaffold proceeds in the same session because the owner approved the full Phase 1 slice.

---

## 1. Problem and outcome

**What we are building (2–4 sentences):**

FeatureFacts is the sixth xFacts family label. It answers **What can this product do?** A curated `FEATURE_FACTS.md` (zero to 12 rows) sits on top of a bounded, evidence-backed `.featurefacts/` register. Extraction proposes surfaces and candidate groupings. Confirmation, publication, and label selection stay human-attributed. This is a sibling of AppFacts, not an AppFacts field.

**Project archetype:** `product`

**What “done” looks like for v1 (measurable where possible):**

- `featurefacts init|scan|report|show|check` run on a TypeScript/Node repo without executing target code, using the network, or calling a model.
- Empty selection is the default. Candidates are not confirmed features and do not occupy public counts.
- Schema-valid register artifacts and a truthful zero-row label when nothing is curated.
- A Worker + static `site/` like toolfacts.dev / agentfacts.dev, ready for featurefacts.dev DNS.
- Private dogfood on one real owned TypeScript repo, with the inventory kept out of public fixtures.

---

## 2. Users and hero flow

**Primary user(s):**

Maintainers and agents reviewing a TypeScript/Node product who need a durable capability inventory, not a file tree rename.

**The single most important workflow (hero flow) end-to-end:**

1. `featurefacts init` writes an empty register and an empty label.
2. `featurefacts scan` extracts TypeScript/Node surfaces into candidate records.
3. The maintainer reviews names and groupings (CLI `show`, register Markdown).
4. `featurefacts report` refreshes generated projections.
5. `featurefacts check` validates structure, references, and (by default) source freshness.

**Secondary workflows (if any) for v1:**

- Skill-only assisted draft when the CLI is not installed.
- Local preview of the label site on a LocalSlip-claimed port.
- LocalHelm enrollment so the checkout appears on the fleet board.

---

## 3. Constraints

- **Technical:** pnpm + TypeScript + ESM. Default scan must not execute target code, follow executable config, use the network, or call a model. Never add FeatureFacts to a target app’s runtime dependencies. No FilePress — Worker + static `site/` like the other label sites.
- **Business / timeline:** Stand up like siblings in this pass. DNS/Cloudflare Worker for featurefacts.dev is owner work.
- **Explicit non-goals for v1:** Visual topology, MCP, hosted drift, automatic retirement, additional ecosystems, FilePress marketing site, publishing a private dogfood inventory.

---

## 4. Stack and tooling

| Area            | Choice                         | Status    | Notes / WHY |
| --------------- | ------------------------------ | --------- | ----------- |
| Framework       | Node CLI + static Worker site  | confirmed | Sibling label-site chrome; no app runtime |
| Language        | TypeScript (ESM)               | confirmed | Owner: ts_family |
| DB / backend    | None (local artifacts)         | confirmed | Artifact-first, no hosted service |
| Auth / storage  | Local files only               | confirmed | `.featurefacts/` + root label |
| Styling         | Sibling static HTML/CSS        | confirmed | Terrain accent; family footer |
| Deploy / CI     | `pnpm ship` → wrangler Worker  | confirmed | git-connected Worker when DNS exists |
| Git host        | GitHub (Catalyst-Forge-LLC)    | proposed  | Remote created when owner asks |
| DNS             | featurefacts.dev               | confirmed | Owner registers/connects |
| Registrar       | Owner                          | confirmed | |
| Package manager | pnpm                           | confirmed | House standard |

**State persistence:** local files only. No PocketBase, no auth.

**Content-generation pattern:** none. Labels and register facts are extracted or declared, never LLM-authored at runtime.

---

## 5. Data model (sketch)

**Core entities:**

- **Surface** — typed observation (route, command, document, test, …) with locator + provenance.
- **Feature record** — candidate or confirmed capability with separate lifecycle, availability, maturity, audience, intent, publication, and observation state.
- **Config** — include/exclude, adapters, empty-by-default curation, publication target, policy, waivers, safety.
- **Label** — generated map-backed projection or standalone declaration. Max 12 rows.
- **Manifest** — scan scope, adapter results, fingerprints, artifact digests.

**Relationships:**

Features reference surfaces via `entry_points` / `implements` / assessment links. Docs and tests are association assessments, not quality scores. Inbound dependency edges are derived.

**Existing data / migration:** 0.2.0 spec package under `docs/featurefacts-spec-v0.2.0-with-review/`. Promote schemas and examples; do not freeze 0.1.0.

---

## 6. Integrations and external systems

| Integration | Purpose | Auth / secrets | Risk notes |
| ----------- | ------- | -------------- | ---------- |
| LocalHelm   | Fleet enroll + plugin board | none | Owner confirms apply |
| LocalSlip   | Named local preview port | none | Claim only; no LAN unless asked |
| Cloudflare Worker | Optional `pnpm ship` | wrangler account | DNS is owner work |
| LLM         | none in default scan | n/a | Skill path may be agent-assisted and must say so |

---

## 7. Hardest problems and risks

1. Treating folders, routes, or test filenames as confirmed product capabilities.
2. Leaking private register paths, hashes, or counts into a public projection.
3. Semantic churn on unchanged rescans (timestamps, unstable IDs).
4. Over-claiming completeness for a first TypeScript/Node adapter.

---

## 8. Architectural decisions (numbered)

**D1.** Production stack is pnpm + TypeScript + ESM. Python in the spec package stays a contract harness only.  
**D2.** First ecosystem is TypeScript/Node. Unsupported inputs report `unsupported`, not a fabricated inventory.  
**D3.** Public site is a Worker + static `site/` like ToolFacts/AgentFacts. Not FilePress.  
**D4.** Default scan is local, non-executing, no network, no model. Safety flags are constants in config.  
**D5.** Init creates an empty selection. The scanner proposes candidates and cannot silently confirm or curate.  
**D6.** Unknown and undisclosed stay distinct. Candidates stay out of confirmed counts.  
**D7.** Hub family chrome updates when the label site exists; live DNS remains owner work.  
**D8.** First real-repo dogfood stays private. Do not publish that inventory as a fixture.

---

## 9. Open questions (before or during Phase 2)

| # | Question | Owner / resolve by |
| - | -------- | ------------------ |
| 1 | GitHub remote name and when to push | Owner |
| 2 | featurefacts.dev DNS / Worker connect | Owner |
| 3 | Which owned TS repo is the lasting private dogfood target after self-scan | Owner |
| 4 | LocalHelm fleet apply if no fleet file exists yet | Owner |

---

## 10. Explicitly out of scope (v1)

Visual topology / public map viewer, FeatureFacts MCP, hosted integrations, automatic retirement, graph/history adapters, incremental extraction, `find` / identity migrations / snapshot `diff`, FilePress, AppFacts expansion, calibrated health scores, imported coverage.

---

## 11. First feature batch (post-scaffold)

1. Promote 0.2.0 schemas/examples and TypeScript validator.
2. CLI: `init`, `scan`, `report`, `show`, `check`.
3. TypeScript/Node tree, surface, document, and test adapters.
4. Sibling label site + `pnpm ship`.
5. LocalHelm plugin + LocalSlip preview claim.
6. Skill bundle for no-CLI assisted drafts.
7. Private dogfood + fixture acceptance cases that can be demonstrated now.
8. xFacts hub family row (draft, not claiming a live DNS).

---

## 12. Handoff checklist (before leaving Phase 1)

- [x] User confirmed stack, first ecosystem, Worker site (not FilePress), and full Phase 1 slice
- [x] This brief is **locked**
- [x] Major decisions recorded in `.forgetrail/workflow_tracking.json`
- [ ] Phase 2 opener reads this file + tracking first (scaffold happens in the same approved slice)
