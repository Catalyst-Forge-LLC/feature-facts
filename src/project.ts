import { basename } from 'node:path';
import { ADAPTERS, RULE_SET, SCHEMA_VERSION, TOOL_NAME, TOOL_VERSION } from './version.ts';
import { canonicalJson, omitGenerated, sha256Json, findingId } from './hash.ts';
import type {
  Config,
  Feature,
  LabelFrontmatter,
  Manifest,
  Registry,
  Rollup,
  Surface,
} from './types.ts';

export function eligibleConfirmed(features: Feature[], target: 'internal' | 'public'): Feature[] {
  return features.filter((feature) => {
    if (feature.recognition !== 'confirmed') return false;
    if (feature.lifecycle === 'retired') return false;
    if (target === 'public' && feature.publication.scope !== 'public') return false;
    return true;
  });
}

export function compactAssessment(assessment: Feature['docs']): string {
  if (assessment.state === 'assessed') return assessment.result;
  if (assessment.state === 'partial') return 'partial';
  if (assessment.state === 'not-applicable') return 'not-applicable';
  if (assessment.state === 'undisclosed') return 'undisclosed';
  return 'unknown';
}

function rollup(features: Feature[], key: 'docs' | 'tests'): Rollup {
  const empty: Rollup = {
    eligible: 0,
    assessed: 0,
    with_links: 0,
    without_links: 0,
    partial: 0,
    unassessed: 0,
    not_applicable: 0,
    undisclosed: 0,
  };
  for (const feature of features) {
    const item = feature[key];
    empty.eligible += 1;
    if (item.state === 'assessed' && item.result === 'linked-evidence') {
      empty.assessed += 1;
      empty.with_links += 1;
    } else if (item.state === 'assessed' && item.result === 'no-linked-evidence') {
      empty.assessed += 1;
      empty.without_links += 1;
    } else if (item.state === 'partial') empty.partial += 1;
    else if (item.state === 'not-applicable') empty.not_applicable += 1;
    else if (item.state === 'undisclosed') empty.undisclosed += 1;
    else empty.unassessed += 1;
  }
  return empty;
}

export function projectLabel(registry: Registry, config: Config, date: string): LabelFrontmatter {
  const target = config.publication.target;
  const eligible = eligibleConfirmed(registry.features, target);
  const selectedIds = config.curation.selected_ids;
  const rows: LabelFrontmatter['features'] = [];
  const diagnostics: string[] = [];

  for (const id of selectedIds) {
    const feature = registry.features.find((item) => item.id === id);
    if (!feature || feature.recognition !== 'confirmed' || feature.lifecycle === 'retired') {
      diagnostics.push(id);
      continue;
    }
    if (target === 'public' && feature.publication.scope !== 'public') {
      diagnostics.push(id);
      continue;
    }
    const name = config.curation.overrides[id]?.name ?? feature.name;
    rows.push({
      id: feature.id,
      name,
      lifecycle: feature.lifecycle,
      availability: feature.availability.state,
      conditions: feature.availability.conditions,
      maturity: feature.maturity,
      documentation: compactAssessment(feature.docs),
      tests: compactAssessment(feature.tests),
      evidence_state: feature.observation.state,
    });
  }

  const selection_state = rows.length
    ? 'curated'
    : eligible.length
      ? 'not-curated'
      : registry.features.length === 0
        ? 'not-curated'
        : 'no-eligible-features';
  const empty_reason = rows.length
    ? undefined
    : selectedIds.length && diagnostics.length
      ? 'Approved selection contains IDs that are not eligible for this publication target. Identities were preserved; nothing was silently substituted.'
      : eligible.length || registry.features.length === 0
        ? 'Curation has not been approved. The scanner does not select rows.'
        : 'No confirmed non-retired capabilities are eligible for this publication target.';

  const unlabeled = eligible.filter((feature) => !rows.some((row) => row.id === feature.id)).length;
  const draft: LabelFrontmatter = {
    feature_facts_version: SCHEMA_VERSION,
    mode: 'map-backed',
    audience: target,
    name: registry.product.name,
    type: registry.product.type,
    status: registry.product.status,
    ...(registry.product.license ? { license: registry.product.license } : {}),
    selection_state,
    ...(empty_reason ? { empty_reason } : {}),
    features: rows,
    basis: {
      kind: 'registry',
      summary: 'Curated capabilities within the declared survey and publication scope.',
    },
    ...(target === 'internal' && config.publication.map_link ? { map: config.publication.map_link } : {}),
    generated: {
      date,
      generator: TOOL_NAME,
      generator_version: TOOL_VERSION,
      projection_fingerprint: '',
    },
  };

  if (config.publication.include_counts) {
    draft.counts = {
      scope: 'eligible-confirmed-active',
      registered: eligible.length,
      selected: rows.length,
      unlabeled,
    };
  }
  if (config.publication.include_assessments) {
    draft.assessments = { docs: rollup(eligible, 'docs'), tests: rollup(eligible, 'tests') };
  }

  const fingerprint = sha256Json(omitGenerated(draft as unknown as Record<string, unknown>));
  draft.generated = {
    date,
    generator: TOOL_NAME,
    generator_version: TOOL_VERSION,
    projection_fingerprint: fingerprint,
  };
  return draft;
}

export function projectIndexes(features: Feature[], scanId: string) {
  const docs = {
    schemaVersion: SCHEMA_VERSION,
    scan_id: scanId,
    kind: 'docs' as const,
    assessments: features.map((feature) => ({
      feature_id: feature.id,
      assessment: feature.docs,
    })),
  };
  const tests = {
    schemaVersion: SCHEMA_VERSION,
    scan_id: scanId,
    kind: 'tests' as const,
    assessments: features.map((feature) => ({
      feature_id: feature.id,
      assessment: feature.tests,
    })),
  };
  return { docs, tests };
}

export function projectGaps(features: Feature[], scanId: string) {
  const gaps = [];
  for (const feature of features) {
    if (feature.recognition !== 'confirmed' || feature.lifecycle === 'retired') continue;
    for (const [rule, kind, assessment] of [
      ['docs-linked-evidence', 'no-linked-docs', feature.docs],
      ['tests-linked-evidence', 'no-linked-tests', feature.tests],
    ] as const) {
      if (assessment.state !== 'assessed' || assessment.result !== 'no-linked-evidence') continue;
      const id = findingId(feature.id, rule);
      const basis = sha256Json([
        feature.id,
        rule,
        '0.2.0',
        assessment,
        feature.evidence.map((item) => item.id),
        assessment.adapter_ids,
      ]);
      gaps.push({
        id,
        feature_id: feature.id,
        rule_id: rule,
        rule_version: '0.2.0',
        kind,
        severity: 'warn',
        applicability: 'applicable',
        reason: `${rule} found an assessed capability with no accepted links.`,
        evidence_ids: feature.evidence.map((item) => item.id),
        adapter_ids: assessment.adapter_ids,
        text: `${feature.name} has no linked ${kind === 'no-linked-docs' ? 'documentation' : 'test'} evidence.`,
        suggested_action: 'Add an explicit association or record a waiver against this basis.',
        basis_fingerprint: basis,
        disposition: { state: 'open', reason: 'No matching waiver is in force.' },
      });
    }
  }
  gaps.sort((a, b) => a.id.localeCompare(b.id));
  return { schemaVersion: SCHEMA_VERSION, scan_id: scanId, gaps };
}

export function sourceFingerprint(files: Manifest['scope']['files'], exclusions: Manifest['scope']['exclusions']): string {
  return sha256Json({
    files: files.map((file) => ({ path: file.path, sha256: file.sha256, bytes: file.bytes })).sort((a, b) => a.path.localeCompare(b.path)),
    exclusions: [...exclusions].sort((a, b) => a.path.localeCompare(b.path) || a.reason.localeCompare(b.reason)),
  });
}

export function configFingerprint(config: Config): string {
  return sha256Json({
    include: config.include,
    exclude: config.exclude,
    adapters: config.adapters,
    externals: config.externals,
    safety: config.safety,
  });
}

export function adapterFingerprint(): string {
  return sha256Json(
    Object.values(ADAPTERS)
      .map((adapter) => ({ id: adapter.id, version: adapter.version, kind: adapter.kind }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  );
}

export function buildManifest(args: {
  scanId: string;
  generatedAt: string;
  status: Manifest['status'];
  config: Config;
  files: Manifest['scope']['files'];
  exclusions: Manifest['scope']['exclusions'];
  adapters: Manifest['adapters'];
  registry: Registry;
  projection: string;
  artifacts: Manifest['artifacts'];
  diagnostics: Manifest['diagnostics'];
  ecosystems: string[];
}): Manifest {
  return {
    schemaVersion: SCHEMA_VERSION,
    scan_id: args.scanId,
    tool: TOOL_NAME,
    tool_version: TOOL_VERSION,
    generated_at: args.generatedAt,
    root: '.',
    status: args.status,
    scope: {
      include: args.config.include,
      exclude: args.config.exclude,
      supported_ecosystems: args.ecosystems,
      files: args.files,
      exclusions: args.exclusions,
    },
    adapters: args.adapters,
    rules_version: `${RULE_SET.rule_set}@${RULE_SET.version}`,
    fingerprints: {
      source: sourceFingerprint(args.files, args.exclusions),
      config: configFingerprint(args.config),
      adapters: adapterFingerprint(),
      rules: sha256Json(RULE_SET),
      registry: sha256Json(args.registry),
      projection: args.projection,
    },
    artifacts: args.artifacts,
    diagnostics: args.diagnostics,
  };
}

export function productNameFromRoot(root: string): string {
  return basename(root) || 'unnamed-product';
}

export { canonicalJson };
