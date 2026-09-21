---
exported_at: 2026-09-21T03:15:33.940Z
platform: grok
source: api
url: https://grok.com/c/6499d0c5-56d2-4ea4-bd06-856b9a25c5a0?rid=46bfbfd8-5aa4-48da-869d-2262d8947d61
title: Feature Map Generator for Codebases
conversation_id: 6499d0c5-56d2-4ea4-bd06-856b9a25c5a0
created_at: 2026-09-19T22:17:14.889764Z
turns: 18
exporter: haulout 1.1.4
---

# Feature Map Generator for Codebases

- **Platform:** Grok
- **URL:** https://grok.com/c/6499d0c5-56d2-4ea4-bd06-856b9a25c5a0?rid=46bfbfd8-5aa4-48da-869d-2262d8947d61
- **Created:** 2026-09-19T22:17:14.889764Z
- **Exported:** 2026-09-21T03:15:33.940Z
- **Turns:** 18
- **Source:** api (conversation API)

---

### You · turn 1 — 2026-09-19T22:18:17.024Z

Interesting challenge, I recently built ExecFoundry.com and it has dozens of features I'm not surfacing on the landing page on purpose. Inside the app discovery is pretty solid as well. But, it might be nice to have an agenslt skill that generates a really comprehensive feature map of an app or similar. Given access to the codebase, map out the overall terrain and features and how they connect, how they are documents, how they are dependent, how they are tested. And produce a very actionable report that includes several files, json, yaml, MD, etc so a Dev or a team could review and improve or just understand. Does this make sense? Is there anything like this on npm? I would make it an open source project with an npm package

---

### Grok · turn 2 — 2026-09-19T22:18:17.036Z

This is a solid product idea — I’ll check what already exists on npm and in the agent-skill space, then sketch whether a dedicated mapper is worth building.Two packages look unusually close to what you described. I’ll pull their actual feature models so we can see where the gap still is.Yes — it makes sense. The unit you care about is a **product feature**, not a file, module, or C4 container. That is the useful distinction.

Most existing tools answer “how is the code wired?” You want “what can the product *do*, how is that capability implemented, documented, coupled, and proven?” For an app like Exec Foundry — lots of real capability, landing page intentionally thin, in-app discovery already decent — that map is a team artifact, not a marketing page.

## What already exists

The space is crowded on **architecture / repo maps**. It is thin on **feature-centric maps with docs + deps + tests as first-class axes**.

Closest OSS / npm-adjacent work:

| Project | What it actually does | Gap vs your idea |
|---|---|---|
| [yonathan06/featuremap](https://github.com/yonathan06/featuremap) (`@yonatan.bendahan/featuremap`) | Agent skill + CLI. Product items (feature / workflow / integration) with file+commit evidence. Writes `.featuremap/items/*`. Visualize graph. Incremental updates. | Early (few commits). Evidence is files/commits, not “documented / dependent / tested.” Agent *authors* the map; CLI does not infer features from AST. |
| [markschellhas/feature-map](https://github.com/markschellhas/feature-map) (`feature-map-cli` on npm) | Authoritative `.features/*.yaml` registry. list/search/validate/graph/impact/check. Installs an agent skill. | **Does not generate from code.** Humans/agents write YAML; CLI keeps it honest. |
| [archmap](https://www.npmjs.com/package/archmap) | Module map, dep graph, implicit git contracts, health score, `SUMMARY.md` + JSON for agents. | Module-centric, not product-feature-centric. Weak on tests/docs-as-product-surface. |
| [codebase-intelligence](https://www.npmjs.com/package/codebase-intelligence) | TS graph + metrics (coverage, blast radius, coupling) + agent skill. | Excellent *code* intel. Features are not the object. |
| [affordance-spec](https://www.npmjs.com/package/affordance-spec) | Pages, API routes, tables, buckets, components, auth overlay. | Surface map of *affordances*, not named product features + test/doc health. |
| [codeflow-viz](https://www.npmjs.com/package/codeflow-viz) | Pages → clicks → handlers → APIs → data. Has a skill. | Interaction/data-flow, not a feature inventory with test/doc/dep scores. |
| npm `feature-map` (Playwright Solutions) | Coverage % against a hand-written YAML of pages/features. | Test-coverage tracker only. |
| C4 architecture skill, `codebase-map`, `repo-outline`, `@omertt27/codemap`, Grasp, etc. | Structure, symbols, imports, health. | Wrong abstraction. |

So: **nothing on npm is “scan repo → comprehensive product feature terrain + docs/deps/tests + multi-file actionable report.”** Pieces exist. The product you described does not.

Commercial analog: ChatGate “Product Map” — visual feature hierarchy from a repo. Closed, not a package you own.

## The actual wedge

Do not compete with dependency-cruiser / archmap / codebase-intelligence on graphs. Compete on this sentence:

> Every user-visible (or internally-gated) capability is a node. Code, docs, tests, and other features are edges. The report tells a team what to surface, document, test, or decouple next.

That is different from “here is `src/`.”

Three layers, in this order:

1. **Observed surfaces** (deterministic): routes, pages, API handlers, jobs, flags, permissions, nav items, settings keys, CLI commands, event names, schema models.
2. **Inferred features** (heuristic + optional LLM): cluster surfaces into named capabilities (“Resume importer”, “Interview prep”, “Compensation band model”).
3. **Health overlays**: docs hits, test hits, coupling, orphan/hidden status.

Layer 1 should work with zero LLM. Layer 2 is where an agent skill earns its keep. Layer 3 is why a team would run it every sprint.

## Suggested artifact set

One scan writes a directory, not a novel. Something like:

```text
.feature-terrain/
  manifest.json          # scan meta, git sha, scores
  features.yaml          # canonical human-editable registry
  features.json          # same graph, machine
  graph.mermaid.md       # feature↔feature + feature↔module
  FEATURES.md            # executive map + recommended actions
  gaps.yaml              # undocumented / untested / hidden / cyclic
  coverage.json          # feature → tests
  docs-index.json        # feature → README/JSDoc/help/changelog
```

A feature record that is actually useful:

```yaml
id: resume-importer
name: Resume importer
status: shipped          # shipped | gated | experimental | dead
visibility: in-app-only  # landing | in-app | admin | hidden
entry_points:
  - app/routes/import.tsx
  - app/api/parse-resume/route.ts
depends_on: [file-storage, llm-extract, job-queue]
depended_by: [profile-builder, job-match]
docs:
  - path: docs/import.md
    quality: thin
tests:
  - path: tests/import.spec.ts
    kind: e2e
    covers: happy-path
scores:
  documented: 0.4
  tested: 0.6
  coupled: 0.8
  discoverable: 0.3
actions:
  - Add landing-page mention or keep hidden on purpose
  - Missing failure-path tests for parse errors
  - Tight coupling to job-queue; extract port
```

`features.yaml` should be **mergeable**. First scan proposes. Humans/agents edit names and `visibility`. Next scan updates evidence without wiping editorial judgment. That is the lesson from `feature-map-cli` and FeatureMap: generated-only maps rot or lie; hand-only maps never get written.

## Package + skill shape

Two deliverables, one repo:

1. **`feature-terrain` npm package**  
   Deterministic CLI: detect stack, extract surfaces, cluster, score, write artifacts. Programmatic API for CI.  
   `npx feature-terrain scan` / `report` / `diff` / `check`.

2. **Agent skill** (`SKILL.md`)  
   Not “read the whole repo and write a novel.” Procedure: run the CLI, then only do the judgment the scanner cannot — name features, mark intentional hiding, propose the top 10 actions, update `features.yaml`.

That split matters. Pure-skill maps hallucinate features. Pure-scanner maps produce folder taxonomies labeled as features. Combined, you get something a CTO can hand a new hire.

v1 language target: TS/JS + Next/Remix/Express-style apps (your world). Detect tests via naming + imports + coverage artifacts if present. Detect docs via colocated README, JSDoc, `/docs`, in-app help strings, changelog headings.

Name collision warning: `feature-map` and `featuremap` are already taken in adjacent ways. Prefer `feature-terrain`, `featerrain`, `app-terrain`, or `capability-map`.

## Does it justify OSS?

Yes, if you keep the promise narrow:

- Feature is the noun.
- Evidence is cited (file:line or route).
- Docs / deps / tests are scored, not narrated.
- Output is files a team can review in PR.
- Hidden-on-purpose is a first-class status, not a bug.

That last point is specifically useful for Exec Foundry. The report should not scream “put this on the homepage.” It should say “shipped, in-app-only, well-tested, undocumented externally — confirm that is intentional.”

## What I would not do

- Do not start with a pretty graph UI. Graph is a bonus; the YAML/JSON/MD pack is the product.
- Do not require an LLM for the first useful report.
- Do not try to support 20 languages on day one.
- Do not treat “directory named `billing/`” as a feature. Billing is a module; “invoice retry with dunning email” is a feature.

If you want a next step I can scaffold the OSS repo: CLI skeleton, JSON Schema for the feature record, empty skill, and a first extractor aimed at a Next-style app so you can point it at Exec Foundry and see whether the terrain looks true.

---

### You · turn 3 — 2026-09-19T22:22:49.165Z

Yes map this out into a spec package I could give my agents in Cursor (using you, Grok) to build it out. Keep it tech agnostic, as I have my own prefs. And, suggest a clever name that fits in with my other tools: catalystforge.com/tools

---

### Grok · turn 4 — 2026-09-19T22:22:49.176Z

I’ll check how Catalyst Forge names its tools, then write a tech-agnostic spec pack your Cursor agents can build from.ForgeTrail’s naming and shelf style are clear. I’ll pull a bit of that shape so the spec package sits next to it instead of looking like a one-off.Name recommendation: **ForgePlat** — sibling to ForgeTrail. I’ll write the spec pack in that voice so an agent can build from files, not from this chat.

---

### You · turn 5 — 2026-09-19T22:23:22.544Z

What about TrailMapper?

---

### Grok · turn 6 — 2026-09-19T22:23:22.556Z

TrailMapper sits right on top of ForgeTrail — I’ll check collisions and whether the metaphor holds before recommending it.**TrailMapper is the attractive wrong name.** I would not take it.

It *sounds* like it belongs on the shelf next to ForgeTrail. That is the trap. The two tools would start answering the same imagined question.

| | ForgeTrail | This product |
|---|---|---|
| Noun | session, phase, decision | feature / capability |
| Axis | time | product space |
| Rot | forgotten decisions | hidden, undocumented, untested capabilities |

“TrailMapper” reads as: *map the trail.* People will assume it visualizes ForgeTrail phases, session history, or agent paths. It does not. It inventories what the *product* can do. Wrong noun baked into the title.

It also collides in the real world, not just on a whiteboard:

- [trailmapper.io](https://trailmapper.io) — donor-fundraising / campaign software
- Nepal trekking startup **Trailmapper** (launched May 2026)
- SkyMark **TRAILMAPPER™** — indoor RF survey cart
- Block Trailblaze **trailmaps** as a packaged unit
- Hiking “trail map” apps in every store
- npm `@smore/trailmap` (old, but the slug is burned in spirit)

Search “TrailMapper” and you get dirt paths and fundraising, never a feature cadastre.

## When the Trail- family *does* work

Use Trail- for things that are actually about the path:

- ForgeTrail — keep the path
- a Trail *viewer* or *resume* helper — show where the last session stopped

Do not use Trail- for a register of product parcels. That is a map of the *land the trail crosses*, not of the trail.

## If you want pairing without the collision

Keep one shared prefix, change the noun:

| Name | Verdict |
|---|---|
| **ForgePlat** | Still the best shelf pair. Path vs plat. Two sentences, no overlap. |
| **ForgeAtlas** | Fine backup if “plat” feels too surveyor. Weaker metaphor (atlas = book of maps, not a parcel register). |
| **ForgeTopo** | Also fine. Slightly more “code structure” than “product features.” |
| **TrailMapper** | Sounds native, means the wrong thing, already used. |

Taglines, if that helps the ear:

- ForgeTrail: *Forge the path. Keep the trail.*
- ForgePlat: *Stake the features. Keep the plat.*

TrailMapper does not get a second sentence that is this clean without stealing ForgeTrail’s.

If you still want it because it is easier to say in a standup, use it as a **working title** inside the repo and publish as ForgePlat. I would not put TrailMapper on catalystforge.com/tools.

Say the word and I will retitle the spec pack. Until then it stays ForgePlat.

---

### You · turn 7 — 2026-09-19T22:34:25.637Z

Sorry, didn't mean to stop the spec package progress, was just adding a comment. Let's go with something like topographer?

---

### Grok · turn 8 — 2026-09-19T22:34:25.648Z

`topographer` is close to the right metaphor — I’ll check whether that exact name is already burned, then finish the spec pack under whatever name still works.`topographer` is already an npm package in this exact neighborhood — repo graphs, `.topographer/` output. Shipping under that name would collide. House style next to ForgeTrail is **ForgeTopo** (`forgetopo`). I’ll finish the spec pack under that name.`topographer` is the right *job* and the wrong *slug*. npm already has [`topographer`](https://www.npmjs.com/package/topographer) — a repo-change dependency graph that writes `.topographer/`. Same neighborhood, different noun.<grok:render card_id="b05bce" card_type="citation_card" type="render_inline_citation"><argument name="citation_id">99</argument></grok:render>

Shelf pair that still says “topographer” without colliding:

**ForgeTopo** · CLI `forgetopo` · dir `.forgetopo/` · tagline *Chart the terrain. Keep the contours.*

Same pattern as ForgeTrail / `forgetrail` / `.forgetrail/`.

The spec pack is complete and downloadable:

Unzip and hand the folder to a Cursor agent. Start from `KICKOFF.md`.

|<grok:render card_id="xE8S5" card_type="rendered_file_card" type="render_file"><argument name="file_path">/home/workdir/artifacts/forgetopo-spec.zip</argument></grok:render> File | Job |
|---|---|
| `docs/GENESIS.md` | What the product is |
| `AGENTS.md` | Rules for the *builder* agent |
| `BUILD.md` | Phase 0–5 with exit criteria |
| `KICKOFF.md` | Paste-ready prompt |
| `schemas/*` | Artifact contract |
| `content/SKILL.md` | Skill that ships *with* the tool, used on target apps |
| `content/TOPO_LITE.md` | Drop-in `.forgetopo/TOPO.md` |
| `examples/` | One contour, one gaps file, one config |

Still tech-agnostic: no language, no framework, adapters behind `docs/DETECTORS.md`.

When you open a new empty implementation repo, paste the kickoff line, then name the stack. Phase 1 is a fixture scan that writes a real `.forgetopo/` — not a website, not an LLM pipeline.

---

### You · turn 9 — 2026-09-19T22:38:03.652Z

Wait... Check out my xFacts suite. I do have an appFacts concept. Perhaps this could be an extension of that?

---

### Grok · turn 10 — 2026-09-19T22:38:03.663Z

AppFacts is already in your shelf language — I’ll read the actual xFacts suite before recommending whether ForgeTopo should stand alone or extend it.xFacts is a label family, not a map family. I’ll pull the AppFacts spec and schema so the recommendation matches that contract instead of forcing a merge.AppFacts is the side of the box. A feature survey is the supply chain. I’ll add that relationship into the spec so a builder agent doesn’t fold them into one file.Yes — same *instinct*, wrong *file*.

xFacts labels each answer one question in under a minute. AppFacts is specifically: **what is this app built from?** Stack, key deps, services, how it builds. Composition, not capability.<grok:render card_id="a82c72" card_type="citation_card" type="render_inline_citation"><argument name="citation_id">115</argument></grok:render>

Your own rule for that family is the side of the box, not the supply chain. A 40-contour feature register with locators, locks, and drainages is the supply chain. Cramming it into `APP_FACTS.md` would wreck the thing that makes AppFacts work.

| | AppFacts | This survey |
|---|---|---|
| Question | Built *from*? | Can *do*? |
| Size | one markdown label | a directory |
| Cap | curated | complete |
| Rot | prose stack sections | hidden / untested / undocumented features |

So: **sibling in the family, not a field on AppFacts.**

The clean extension is a sixth label plus a generator:

1. **FeatureFacts** — `FEATURE_FACTS.md`  
   Question: *what can this product do?*  
   Curated 8–12 contours, counts (shipped / gated / hidden / dead), health rollup. Hidden on the label is information, not a defect.

2. **ForgeTopo** — still the surveyor  
   `.forgetopo/` stays the plat book. It *emits* FeatureFacts the way the AppFacts generator emits `APP_FACTS.md`.

That is the same split you already ship: noisy source → glanceable label. Here the noisy source is the product itself.

Do not:

- add a `features:` graph to the AppFacts schema
- rename ForgeTopo to AppFacts
- put the generator in the `app-facts` repo

Do:

- keep ForgeTopo as its own tool on the shelf
- treat FeatureFacts as an output adapter (Phase 4)
- if it earns a hub slot, new repo, CC0 spec, shared xFacts footer

That relationship is now in the spec pack as `docs/XFACTS.md`. Rebuild is here:

If you want the xFacts slot to lead, next pass is a Feature<grok:render card_id="X98eR" card_type="rendered_file_card" type="render_file"><argument name="file_path">/home/workdir/artifacts/forgetopo-spec.zip</argument></grok:render>Facts schema that looks like AppFacts (frontmatter + table + `--check`), with ForgeTopo only required when someone asks for the full terrain.

---

### You · turn 11 — 2026-09-19T22:46:36.986Z

Yes, new hub spot for sure, in fact, we can have it all be featureFacts. A curated label that links to a full map. This would help humans and agents

---

### Grok · turn 12 — 2026-09-19T22:46:36.999Z

FeatureFacts as the hub name, label in front, full map behind it. I’ll realign the spec pack to that two-layer shape so it matches the rest of xFacts.Yes. Make **FeatureFacts** the product. Label in front, map behind it. That is the version humans and agents will both use.

AppFacts stays *built from*. FeatureFacts is *can do*. Same family skeleton, new hub row.<grok:render card_id="a84374" card_type="citation_card" type="render_inline_citation"><argument name="citation_id">116</argument></grok:render>

```
FEATURE_FACTS.md          ← 12 rows, one minute
        │
        └── map: .featurefacts/
              features.yaml
              FEATURES.md
              gaps.yaml
```

An agent reads the label first (cheap). It opens one contour in the map only when it needs a locator, a test, or a dependency. A person does the same thing with their eyes.

Hidden stays a count and a map row. Promotion onto the label is editorial. That is how Exec Foundry’s intentional iceberg stays honest instead of turning into a marketing dump.

Spec pack is re-pointed at this shape: `featurefacts` CLI, `FEATURE_FACTS.md`, `.featurefacts/`, CC0 spec / MIT tooling, `/v` later like the siblings. Hub work when it ships: sixth row on xfacts.dev, footer, `llms.txt`. Do not touch the AppFacts schema.

Builder kickoff is `KICKOFF.md`. Phase 1 is a fixture that writes a valid label *and* a map, with `<grok:render card_id="owd7m" card_type="rendered_file_card" type="render_file"><argument name="file_path">/home/workdir/artifacts/featurefacts-spec.zip</argument></grok:render>map:` linking them.

---

### You · turn 13 — 2026-09-19T22:48:35.193Z

This has real potential!

---

### Grok · turn 14 — 2026-09-19T22:48:35.204Z

It does — especially as a label that links to a map, not another architecture hairball. I’ll note the direction so the next session doesn’t relitigate the name.The leverage is that Exec Foundry already *is* the motivating case: more product than the landing page, solid in-app discovery, and a team-plus-agents that keep rediscovering the same terrain.

FeatureFacts gives them a shared object. The label is what you trust in a minute. The map is what you open when you are about to change, test, or document something. AppFacts stays the ingredients list.

When you want to move it: empty repo, paste `KICKOFF.md`, name the stack, dogfood the fixture, then point it at Exec Foundry and see whether a product person recognizes the twelve rows. If those rows are wrong, the schema is cheap to fix. If they are right, the hub slot is real.

---

### You · turn 15 — 2026-09-19T22:49:55.626Z

What else does the hub need?

---

### Grok · turn 16 — 2026-09-19T22:49:55.637Z

I’ll check how the existing five labels are wired into the hub so the FeatureFacts slot matches house rules instead of guessing.The hub is thin on purpose. Most of the work is a **sibling repo + a few hub files**, not a new platform.

Hub README already says: when the family grows, change `site/footer.html` first; per-label specs do not live in x-facts. Panel is explicitly *not* a sixth label. FeatureFacts *is*. That sentence has to move.<grok:render card_id="6634f1" card_type="citation_card" type="render_inline_citation"><argument name="citation_id">135</argument></grok:render>

## Hub repo (`x-facts`) — small

| Touch | Why |
|---|---|
| `site/index.html` | Sixth row: FeatureFacts · Terrain · What can this product do? · featurefacts.dev |
| `site/footer.html` | Canonical footer every sibling pastes. Change this before the label site deploys. |
| `site/llms.txt` | Add the row + agent entry (`https://featurefacts.dev/llms.txt` once live). Today it lists five only. |
| `README.md` | Stop saying the family is five objects. Point at the sibling repo. |
| `specs/DISCOVERY-AND-PUBLICATION.md` | Add FeatureFacts pointer contract (repo-root `FEATURE_FACTS.md`, fallback `/.well-known/x-facts/feature.md`, `map:` is extra and FeatureFacts-only). |
| `specs/ROADMAPS.md` | One line: label shipped / site pending / dogfood pending. |
| Essays | One paragraph in *why-labels* if you mention the set. Do not turn the hub into a FeatureFacts tutorial. |

Do **not** put the FeatureFacts schema, examples, or generator on the hub. That is how AppFacts stayed a sibling.

Leave Panel alone. It stays a derived tool-surface view.

## Sibling repo (`featurefacts`) — the real ship

Copy the AppFacts skeleton, swap the question.

- `SPEC.md` + `schema/feature-facts.schema.json` (CC0)
- `FEATURE_FACTS.md` dogfooded on the repo itself
- `examples/` including a template
- Generator that writes the label and, when asked, the `.featurefacts/` map
- `site/` on featurefacts.dev: landing, `/schema`, `/v` fragment viewer, `/llms.txt`
- Badge spec if siblings still badge
- `--check` against `inputs_fingerprint`
- Shared family footer from the hub file
- License split: spec/schema CC0, tooling MIT

Discovery extras FeatureFacts needs that AppFacts does not:

- `map:` path or URL on the label
- A rule that `/v` shows the **label**, not the plat book
- Host surface: public repo root (same as AppFacts). Product homepage fallback: `/.well-known/x-facts/feature.md`

## Family language that will otherwise lie

- “Five labels” / “five objects only” on xfacts.dev and in essays
- `llms.txt` table
- well-known enum `app|model|tool|agent|skill` — add `feature`
- LocalHelm / catalog rows, if those boards list label kinds
- Catalyst Forge tools shelf + nutrition-label blog post (“we now ship those labels”)

## Dogfood before the hub row goes live

Ship `FEATURE_FACTS.md` on at least one real product (Exec Foundry) and one OSS tool (ForgeTrail). Mark those catalog rows `dogfood: true`, same as the other labels.

If the twelve Exec Foundry rows look wrong to you, fix the schema. If they look true, then flip the hub row.

## Order that will not thrash

1. Freeze label schema + example `FEATURE_FACTS.md` (you already have this in the spec pack).
2. Stand up featurefacts.dev with spec, schema, example, `/llms.txt`. `/v` can be ugly.
3. Dogfood Exec Foundry + ForgeTrail.
4. Patch hub footer → index → `llms.txt` → discovery spec.
5. Only then talk map depth, MCP, or a pretty viewer.

The hub does not need a map explorer. It needs a sixth honest sentence and a working sibling domain.

---

### You · turn 17 — 2026-09-19T22:50:41.923Z

I mean in general for xFacts itself

---

### Grok · turn 18 — 2026-09-19T22:50:41.934Z

You mean the suite, not the FeatureFacts row. I’ll read the hub’s own roadmaps and gaps so this is their list, not a generic “add more labels” pitch.The suite’s own roadmap already says this: **depth over breadth**. P0 (five sites live) is done. What it still lacks is not another noun. It is *use*.<grok:render card_id="3811a6" card_type="citation_card" type="render_inline_citation"><argument name="citation_id">149</argument></grok:render>

Your hard-doubts doc is the real punch list. Almost every “hub need” falls out of it.<grok:render card_id="98dfd0" card_type="citation_card" type="render_inline_citation"><argument name="citation_id">150</argument></grok:render>

## 1. Pointers from the attach surface

This is the suite-level hole.

`{LABEL}_FACTS.md` in git plus a `/v#…` card still leaves the install moment blind: MCP registry row, `mcp.json`, skill marketplace, model card, “add this agent.” Source tree is invisible there.

Until a harness or registry field says `toolFactsUrl` / equivalent and something actually fetches it, “agents will find llms.txt” is a hope. Hub work that matters: one pointer contract per host surface, implemented on **one** real attach path (ForgeTrail MCP is the obvious dogfood), then documented so a second host can copy it.

`/.well-known/x-facts/{kind}.md` is the fallback. It is not the primary.

## 2. One external Panel consumer

P1 is “code done, external review open.” P3 (A2A / HF / SBOM profiles) is explicitly blocked until the tool path has a user who is not you.

The hub needs a written review in `reviews/` from someone who used `mcp-tools-list` to allow or deny a tool. Without that, Panel is a self-hosted demo.

## 3. Measurement so labels do not become theater

A wrong `side_effects: none` is worse than no label. `--check` today is fingerprint/freshness, not truth.

Minimum that would change the suite’s credibility:

- Drift that fails CI when the *claim* and the *observed surface* disagree (Panel already aims here for tools).
- `reviewed.status` used in public, not just present in schema (`publisher-authored` vs `independently-reviewed` vs `stale`).
- No “certified” language anywhere. You already forbade it. Keep refusing.

Digests you deferred (SkillFacts package digest, AgentFacts config digest) are how “stale” becomes mechanical. Those are suite needs. A sixth label is not.

## 4. Agent entry that actually gets read

`appfacts.dev/llms.txt` 404’d when checked. Hub `llms.txt` is good; several label sites are not.

Also still open on the hub roadmap: ForgeTrail / `AGENTS.md` bootstrap that points agents at the family `llms.txt` on session start. That is the seeding mechanism your doubts file says is missing.

If Cursor and Claude Code never see the pointer, the dual human/agent bet fails quietly.

## 5. Exemplars, not essays

August flesh-out: Tool/Agent/Skill were thin (one exemplar, stub generators). Target was 3–5 types per label.

The hub should not grow tutorials. Each **label repo** needs a short zoo: boring library, MCP server with teeth, hosted SaaS, archived tool. Empty directories feel dead; that is the cold-start doubt.

Dogfood more of your own shelf until a stranger publishes one. Catalog `dogfood: true` is fine. A directory of only Catalyst Forge rows is not a network.

## 6. Stop looking like sprawl

Your admission rule exists because five labels already look like a product line. The suite needs visible refusals (DataFacts, PromptFacts) on the hub, not another row “for completeness.”

FeatureFacts can earn a seat later if capability-vs-composition stays a different question and Exec Foundry dogfood is real. It is not what xFacts is starving for this week.

## 7. Naming, every time

“x is a variable, not a social network” has to stay on the hub hero. First-impression Twitter collision is in your own doubts list. Do not spend hub calories on a rebrand; spend them on the sentence being unavoidable.

---

If you force a single priority order for *xFacts itself*:

1. Pointer on one live attach surface (ForgeTrail MCP).
2. Label-site `/llms.txt` parity + ForgeTrail agent bootstrap.
3. One external Panel review.
4. Exemplars + `--check` that can fail on claim-vs-surface drift.
5. Then, and only then, talk FeatureFacts as a hub row.

The family does not need more surface. It needs one path where an agent refuses a tool because ToolFacts said so.
