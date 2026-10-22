import { ADAPTERS } from './version.ts';
import { kebabId } from './hash.ts';
import { candidateFeature, emptyAssessment } from './defaults.ts';
import type { Assessment, Feature, Registry, Surface } from './types.ts';
import { findAnnotations } from './adapters/annotations.ts';

function unique(ids: string[]): string[] {
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
}

function titleFromId(id: string): string {
  return id
    .replace(/^(cmd|route|file|ann|doc|test)-/, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function displayName(id: string, titles: string[]): string {
  const nice = titles.find((title) => /^[A-Z][A-Za-z0-9]*(?: [A-Z][A-Za-z0-9]*)*$/.test(title));
  return nice ?? titleFromId(id);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Command and route ids carry a leaf. Other ids are not guessed from nearby words. */
function capabilityLeaf(id: string): string {
  const match = /^(?:cmd|route)-([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(id);
  const leaf = match?.[1] ?? '';
  return leaf.length >= 3 ? leaf : '';
}

function mentionsCapability(text: string, leaf: string, name: string): boolean {
  const code = new RegExp('`' + escapeRegExp(leaf) + '`', 'i');
  const invoked = new RegExp('`[^`\\n]*\\s+' + escapeRegExp(leaf) + '`', 'i');
  const heading = new RegExp('^#{1,6}\\s+' + escapeRegExp(name) + '\\s*$', 'im');
  return code.test(text) || invoked.test(text) || heading.test(text);
}

function testNamedFor(path: string, leaf: string): boolean {
  const base = path.split(/[/\\]/).pop() ?? '';
  return new RegExp('^' + escapeRegExp(leaf) + '\\.(?:test|spec)\\.', 'i').test(base);
}

function linkedAssessment(
  adapterId: string,
  surfaceIds: string[],
  association: 'explicit-annotation' | 'static-reference',
  state: 'assessed' | 'partial',
  result: 'linked-evidence' | 'unknown',
  reason: string,
): Assessment {
  return {
    state,
    result,
    adapter_ids: [adapterId],
    links: surfaceIds.map((surface_id) => ({ surface_id, association })),
    reason,
  };
}

/** A confirmed row keeps a stronger assessment. A sign can fill an empty one. */
function upgradeAssessment(current: Assessment, next: Assessment): Assessment {
  if (next.result === 'linked-evidence') return next;
  if (next.state === 'partial' && current.state === 'unassessed') return next;
  return current;
}

/** `/deck` and `/api/push` share a leaf. Deeper paths stay on their own surface. */
function routeLeaf(ref: string): string | null {
  const path = ref.startsWith('/')
    ? ref
    : ref.match(/^(?:GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+(\/\S*)$/)?.[1];
  if (!path) return null;
  if (path === '/') return '';
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2 && parts[0] === 'api') return parts[1];
  return null;
}

export function assembleFeatures(args: {
  scanId: string;
  prior: Feature[];
  surfaces: Surface[];
  docs: Surface[];
  tests: Surface[];
  fileTexts: Map<string, string>;
}): Feature[] {
  const { scanId, prior, surfaces, docs, tests, fileTexts } = args;
  const byId = new Map<string, Feature>();
  for (const feature of prior) {
    byId.set(feature.id, structuredClone(feature));
  }

  const clusters = new Map<string, { entry: string[]; impl: string[]; docs: string[]; tests: string[]; refs: string[]; titles: string[] }>();

  function cluster(id: string) {
    const existing = clusters.get(id) ?? { entry: [], impl: [], docs: [], tests: [], refs: [], titles: [] };
    clusters.set(id, existing);
    return existing;
  }

  function noteTitle(group: { titles: string[] }, surface: Surface): void {
    if (surface.title) group.titles.push(surface.title);
  }

  // Commands that share one branch (`case 'health': case 'scrape-health':`) are one capability.
  // The alias surface names its primary as the locator symbol.
  const aliasGroups = new Map<string, string[]>();
  for (const surface of surfaces) {
    if (surface.provenance.method !== 'argv-command-alias') continue;
    const primary = surface.locator.symbol ?? surface.ref;
    const members = aliasGroups.get(primary) ?? [primary];
    if (!members.includes(surface.ref)) members.push(surface.ref);
    aliasGroups.set(primary, members);
  }
  const canonicalByName = new Map<string, { id: string; aliases: string[] }>();
  for (const members of aliasGroups.values()) {
    const ids = members.map((name) => kebabId(`cmd-${name}`));
    const confirmed = ids.filter((id) => byId.get(id)?.recognition === 'confirmed');
    // Two confirmed rows are two reviewed identities. Merging them needs a reviewed migration, not a scan.
    if (confirmed.length > 1) continue;
    const id = confirmed[0] ?? ids[0]!;
    const aliases = ids.filter((item) => item !== id).sort((a, b) => a.localeCompare(b));
    for (const name of members) canonicalByName.set(name, { id, aliases });
  }
  const aliasIds = new Set([...canonicalByName.values()].flatMap((item) => item.aliases));

  const commandByLeaf = new Map<string, string>();
  for (const surface of surfaces) {
    if (surface.kind === 'command' && surface.provenance.method !== 'package-json-bin') {
      commandByLeaf.set(surface.ref, canonicalByName.get(surface.ref)?.id ?? surface.id);
    }
  }
  const aliasesById = new Map([...canonicalByName.values()].map((item) => [item.id, item.aliases]));

  for (const surface of surfaces) {
    if (surface.provenance.method === 'package-json-bin' && commandByLeaf.size > 0) continue;
    if (surface.provenance.method === 'explicit-annotation') {
      const group = cluster(kebabId(surface.ref));
      group.entry.push(surface.id);
      group.refs.push(surface.ref);
      noteTitle(group, surface);
      continue;
    }
    const text = fileTexts.get(surface.locator.path) ?? '';
    const annotated = findAnnotations(text).map((item) => item.id);
    if (annotated.length) {
      for (const id of annotated) {
        const group = cluster(kebabId(id));
        group.entry.push(surface.id);
        noteTitle(group, surface);
        if (surface.kind !== 'route' && surface.kind !== 'command') group.impl.push(surface.id);
      }
      continue;
    }
    const canonical = surface.kind === 'command' ? canonicalByName.get(surface.ref) : undefined;
    if (canonical) {
      const group = cluster(canonical.id);
      group.entry.push(surface.id);
      group.refs.push(surface.ref);
      continue;
    }
    const leaf = surface.kind === 'route' ? routeLeaf(surface.ref) : null;
    if (leaf !== null) {
      const commandId = leaf ? commandByLeaf.get(leaf) : undefined;
      if (commandId) {
        const group = cluster(commandId);
        group.impl.push(surface.id);
        noteTitle(group, surface);
        continue;
      }
      const id = leaf ? kebabId(`route-${leaf}`) : 'route-home';
      const group = cluster(id);
      group.entry.push(surface.id);
      group.refs.push(surface.ref);
      noteTitle(group, surface);
      continue;
    }
    const group = cluster(surface.id);
    group.entry.push(surface.id);
    group.refs.push(surface.ref);
    noteTitle(group, surface);
  }

  for (const surface of docs) {
    if (surface.provenance.method === 'explicit-annotation') {
      cluster(kebabId(surface.ref)).docs.push(surface.id);
    }
  }
  for (const surface of tests) {
    if (surface.provenance.method === 'explicit-annotation') {
      cluster(kebabId(surface.ref)).tests.push(surface.id);
    }
  }

  const seen = new Set<string>();
  for (const [id, group] of [...clusters.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    seen.add(id);
    const priorFeature = byId.get(id);
    const entry = unique(group.entry);
    const impl = unique(group.impl);
    const docLinks = unique(group.docs);
    const testLinks = unique(group.tests);
    const name = displayName(id, group.titles);
    const leaf = capabilityLeaf(id);
    const mentionedDocs = leaf
      ? unique(
          docs
            .filter((surface) => {
              if (surface.provenance.method === 'explicit-annotation') return false;
              return mentionsCapability(fileTexts.get(surface.locator.path) ?? '', leaf, name);
            })
            .map((surface) => surface.id),
        )
      : [];
    const namedTests = leaf
      ? unique(
          tests
            .filter(
              (surface) =>
                surface.provenance.method !== 'explicit-annotation' && testNamedFor(surface.locator.path, leaf),
            )
            .map((surface) => surface.id),
        )
      : [];
    const description = `Observed implementation surfaces: ${entry.length ? entry.join(', ') : 'none'}. Candidate only until a maintainer confirms the product meaning.`;
    const locator = [...surfaces, ...docs, ...tests].find((item) =>
      entry.includes(item.id) || docLinks.includes(item.id) || testLinks.includes(item.id),
    )?.locator;
    if (!locator) continue;
    const capabilityEvidence = {
      id: kebabId(`${id}-capability`),
      kind: 'observed' as const,
      state: 'current' as const,
      assertion: {
        field: 'capability',
        value: priorFeature?.description ?? description,
        claim: 'Static extraction found implementation surfaces. This is not confirmation.',
      },
      locator,
      provenance: {
        adapter_id: ADAPTERS.surface.id,
        adapter_version: ADAPTERS.surface.version,
        origin: 'deterministic' as const,
        method: 'surface-cluster',
      },
    };

    const docsAssessment = docLinks.length
      ? linkedAssessment(
          ADAPTERS.document.id,
          docLinks,
          'explicit-annotation',
          'assessed',
          'linked-evidence',
          'An explicit FeatureFacts annotation was found in documentation.',
        )
      : mentionedDocs.length
        ? linkedAssessment(
            ADAPTERS.document.id,
            mentionedDocs,
            'static-reference',
            'partial',
            'linked-evidence',
            'A document names this capability in a heading or code span. That is a sign. It does not mean the documentation is adequate.',
          )
        : emptyAssessment('No explicit documentation association. Filename resemblance is not an accepted link.', [
            ADAPTERS.document.id,
          ]);

    const testsAssessment = testLinks.length
      ? linkedAssessment(
          ADAPTERS.test.id,
          testLinks,
          'explicit-annotation',
          'assessed',
          'linked-evidence',
          'An explicit FeatureFacts annotation was found in a test file. Tests were not executed.',
        )
      : namedTests.length
        ? linkedAssessment(
            ADAPTERS.test.id,
            namedTests,
            'static-reference',
            'partial',
            'linked-evidence',
            'A test file is named for this capability. Tests were not executed, and a matching filename is not an accepted link.',
          )
        : emptyAssessment('No explicit test association. A similar test filename is only a proposal.', [ADAPTERS.test.id]);

    const aliases = aliasesById.get(id) ?? [];
    if (priorFeature) {
      if (aliases.length) {
        priorFeature.editorial.aliases = unique([...priorFeature.editorial.aliases, ...aliases]);
      }
      priorFeature.entry_points = entry;
      priorFeature.implements = impl;
      priorFeature.observation = {
        state: 'current',
        last_seen_scan_id: scanId,
        reason: 'Current source evidence is available.',
      };
      if (priorFeature.recognition !== 'confirmed') {
        priorFeature.description = description;
        priorFeature.docs = docsAssessment;
        priorFeature.tests = testsAssessment;
      } else {
        priorFeature.docs = upgradeAssessment(priorFeature.docs, docsAssessment);
        priorFeature.tests = upgradeAssessment(priorFeature.tests, testsAssessment);
      }
      const nextEvidence = priorFeature.evidence.filter((item) => item.kind !== 'observed' || item.assertion.field !== 'capability');
      nextEvidence.unshift(capabilityEvidence);
      priorFeature.evidence = nextEvidence;
      continue;
    }

    byId.set(
      id,
      candidateFeature({
        id,
        name,
        description,
        entry_points: entry,
        implements: impl,
        docs: docsAssessment,
        tests: testsAssessment,
        observation: { state: 'current', last_seen_scan_id: scanId, reason: 'Current source evidence is available.' },
        evidence: [capabilityEvidence],
      }),
    );
    if (aliases.length) byId.get(id)!.editorial.aliases = aliases;
  }

  // An unconfirmed row for a name that is now an alias would only repeat its primary as a stale candidate.
  for (const id of aliasIds) {
    if (!seen.has(id) && byId.get(id)?.recognition !== 'confirmed') byId.delete(id);
  }

  for (const feature of byId.values()) {
    if (seen.has(feature.id)) continue;
    if (feature.observation.state === 'current') {
      feature.observation = {
        state: 'stale',
        last_seen_scan_id: feature.observation.last_seen_scan_id,
        reason: 'Previous locators were not observed in this scan. The record is retained; it is not retired.',
      };
      for (const item of feature.evidence) {
        if (item.state === 'current') item.state = 'stale';
      }
    }
  }

  // A candidate no scan ever located (for example a product-name row seeded from package.json by a
  // label helper) only says the package exists. Once stale it is dropped; confirmed rows are kept.
  for (const [id, feature] of byId) {
    if (seen.has(id) || feature.recognition === 'confirmed') continue;
    if (feature.entry_points.length || feature.implements.length) continue;
    if (feature.evidence.some((item) => item.locator)) continue;
    byId.delete(id);
  }

  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function applyProduct(registry: Registry, packageText: string | undefined, fallbackName: string, preferredName = ''): void {
  let name = preferredName || fallbackName;
  let type = 'unknown';
  let status = 'unknown';
  if (packageText) {
    try {
      const pkg = JSON.parse(packageText) as { name?: string; private?: boolean; description?: string };
      const raw = typeof pkg.name === 'string' ? pkg.name.replace(/^@[^/]+\//, '') : '';
      if (!preferredName) name = raw || fallbackName;
      type = 'typescript-node';
      status = pkg.private ? 'experimental' : 'active';
    } catch {
      if (!preferredName) name = fallbackName;
    }
  }
  registry.product = { name, type, status };
}
