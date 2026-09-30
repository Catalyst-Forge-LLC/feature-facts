---
app_facts_version: 0.1.0
name: FeatureFacts
type: CLI tool
status: active
license: MIT
version: 0.2.2
repository: https://github.com/Catalyst-Forge-LLC/feature-facts
stack:
  language: TypeScript
  runtime: Node.js
  tooling: pnpm
key_dependencies:
  - name: ajv
    purpose: Declared in package.json.
    registry: npm
  - name: ajv-formats
    purpose: Declared in package.json.
    registry: npm
  - name: minimatch
    purpose: Declared in package.json.
    registry: npm
  - name: yaml
    purpose: Declared in package.json.
    registry: npm
build:
  package_manager: pnpm
  test: tsx --test tests/cli.test.ts tests/helm-repos.test.ts
  compile: build script
generated:
  date: 2026-09-29
  generator: "appfacts-cli v0.1.0 (scaffold)"
  inputs_fingerprint: 855a5ee959f5eaf2
credits:
  generated_with: https://appfacts.dev
  built_by: "Catalyst Forge — https://www.catalystforge.com/"
---

# FeatureFacts

`CLI tool` · **active** · MIT

FeatureFacts: a compact capability label and evidence-backed feature register.

**[Open visual label →][appfacts-label]** · or scan `APP_FACTS.png`

[Repository](https://github.com/Catalyst-Forge-LLC/feature-facts)

### Stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript |
| Runtime | Node.js |
| Tooling | pnpm |

### Key dependencies

- `ajv` (npm) — Declared in package.json.
- `ajv-formats` (npm) — Declared in package.json.
- `minimatch` (npm) — Declared in package.json.
- `yaml` (npm) — Declared in package.json.

### Build

- **Package Manager** — pnpm
- **Test** — tsx --test tests/cli.test.ts tests/helm-repos.test.ts
- **Compile** — build script

---
*Generated with [AppFacts](https://appfacts.dev) · Built by [Catalyst Forge](https://www.catalystforge.com/) · [Visual label][appfacts-label]*

[appfacts-label]: https://appfacts.dev/v#af1.eJytU82K2zAQfhUxpxZkJzWkNL6mBBbSXrq3UsxEHjvayJKQxklNCPQh-oR9kiIlXnLe9mJkzefvR_p8AfS-6VBxbE4UonYWaliWH8olSLA4ENSwJeQx0DahQAJPPu1udk-CnTMgITLyGKEGVKxPBBKMVmRjgn15egYJj9xVWYGEQN5FzS5MUMOB2cd6seg1H8Z9qdyw2CCjmSIXWxd6Kna7zaK7-Si6u5HIqI5QX8Cg7Ufsk9zz5OmbCtpz0hgt6xzhq2upfMnunTPa9lCDt36Aq4QjTU1LnmxLVmmKUH-_zNHx5QQS_Bi8y2k-kzIYqBXaCo_qiH2idbbMiXodOee5MT-yFJ0LA2bb_8o2aKsHZHX4D1wTDubNND8k7Edt2nQFd2wzoMWewny8EpgiQw0cf4qiSC8iPeJCGV2mVcnxvnMgMxS5FvMAJCg3eG2Ssywl4u1urxJ6shSQKcu3yAlTLauPxXJdVGt4BbhkBr3PrSmU0eKU-y3eRYVd50z7HiRo60eOTadtT8EHbZPpT6sVrojWq3W3IuyqJKsCtZpjEn110Jw1Hx5qPKuVLaX6JOfc7NO5za0WudXiz6_fYv7ofD6X6j7u0jT_BnC9_gVPPTzV
