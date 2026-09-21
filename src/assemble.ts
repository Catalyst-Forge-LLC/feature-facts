import { ADAPTERS } from './version.ts';
import { kebabId } from './hash.ts';
import { candidateFeature, emptyAssessment } from './defaults.ts';
import type { Feature, Registry, Surface } from './types.ts';
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

  const clusters = new Map<string, { entry: string[]; impl: string[]; docs: string[]; tests: string[]; refs: string[] }>();

  function cluster(id: string) {
    const existing = clusters.get(id) ?? { entry: [], impl: [], docs: [], tests: [], refs: [] };
    clusters.set(id, existing);
    return existing;
  }

  for (const surface of surfaces) {
    if (surface.provenance.method === 'explicit-annotation') {
      const group = cluster(kebabId(surface.ref));
      group.entry.push(surface.id);
      group.refs.push(surface.ref);
      continue;
    }
    const text = fileTexts.get(surface.locator.path) ?? '';
    const annotated = findAnnotations(text).map((item) => item.id);
    if (annotated.length) {
      for (const id of annotated) {
        const group = cluster(kebabId(id));
        group.entry.push(surface.id);
        if (surface.kind !== 'route' && surface.kind !== 'command') group.impl.push(surface.id);
      }
      continue;
    }
    const group = cluster(surface.id);
    group.entry.push(surface.id);
    group.refs.push(surface.ref);
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
      ? {
          state: 'assessed' as const,
          result: 'linked-evidence' as const,
          adapter_ids: [ADAPTERS.document.id],
          links: docLinks.map((surface_id) => ({ surface_id, association: 'explicit-annotation' as const })),
          reason: 'An explicit FeatureFacts annotation was found in documentation.',
        }
      : emptyAssessment('No explicit documentation association. Filename resemblance is not an accepted link.', [ADAPTERS.document.id]);

    const testsAssessment = testLinks.length
      ? {
          state: 'assessed' as const,
          result: 'linked-evidence' as const,
          adapter_ids: [ADAPTERS.test.id],
          links: testLinks.map((surface_id) => ({ surface_id, association: 'explicit-annotation' as const })),
          reason: 'An explicit FeatureFacts annotation was found in a test file. Tests were not executed.',
        }
      : emptyAssessment('No explicit test association. A similar test filename is only a proposal.', [ADAPTERS.test.id]);

    if (priorFeature) {
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
        if (docsAssessment.result === 'linked-evidence') priorFeature.docs = docsAssessment;
        if (testsAssessment.result === 'linked-evidence') priorFeature.tests = testsAssessment;
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
        name: titleFromId(id),
        description,
        entry_points: entry,
        implements: impl,
        docs: docsAssessment,
        tests: testsAssessment,
        observation: { state: 'current', last_seen_scan_id: scanId, reason: 'Current source evidence is available.' },
        evidence: [capabilityEvidence],
      }),
    );
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

  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function applyProduct(registry: Registry, packageText: string | undefined, fallbackName: string): void {
  if (!packageText) {
    registry.product = { name: fallbackName, type: 'unknown', status: 'unknown' };
    return;
  }
  try {
    const pkg = JSON.parse(packageText) as { name?: string; private?: boolean; description?: string };
    registry.product = {
      name: pkg.name ?? fallbackName,
      type: 'typescript-node',
      status: pkg.private ? 'experimental' : 'active',
    };
  } catch {
    registry.product = { name: fallbackName, type: 'unknown', status: 'unknown' };
  }
}
