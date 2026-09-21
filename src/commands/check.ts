import { existsSync } from 'node:fs';
import { enumerateTree } from '../safety.ts';
import { adapterFingerprint, configFingerprint, projectLabel, sourceFingerprint } from '../project.ts';
import { sha256Json } from '../hash.ts';
import { RULE_SET } from '../version.ts';
import { validateSchema } from '../validate.ts';
import { renderLabelBody } from '../render.ts';
import {
  loadConfig,
  loadLabel,
  loadManifest,
  loadRegistry,
  loadSurfaces,
  workspaceAt,
} from '../workspace.ts';
import { loadYaml, readText } from '../yaml-io.ts';

export interface CheckResult {
  exit: 0 | 1 | 2 | 3;
  messages: string[];
}

export function checkCommand(root: string, mode: 'full' | 'projection' = 'full'): CheckResult {
  const ws = workspaceAt(root);
  const messages: string[] = [];
  let contract = false;
  let stale = false;
  let operational = false;

  try {
    const config = loadConfig(ws);
    const registry = loadRegistry(ws);
    const label = loadLabel(ws);
    if (!registry || !label) {
      return { exit: 3, messages: ['Register or label is missing. Run featurefacts init.'] };
    }
    const surfaces = { schemaVersion: '0.2.0', scan_id: registry.scan_id, surfaces: loadSurfaces(ws) };

    const checks: Array<[Parameters<typeof validateSchema>[0], unknown, string]> = [
      ['config', config, ws.configPath],
      ['registry', registry, ws.featuresPath],
      ['surfaces', surfaces, ws.surfacesPath],
      ['label', label.data, ws.labelPath],
    ];
    if (existsSync(ws.docsIndexPath)) checks.push(['docs', JSON.parse(readText(ws.docsIndexPath)), ws.docsIndexPath]);
    if (existsSync(ws.testIndexPath)) checks.push(['tests', JSON.parse(readText(ws.testIndexPath)), ws.testIndexPath]);
    if (existsSync(ws.gapsPath)) checks.push(['gaps', loadYaml(ws.gapsPath), ws.gapsPath]);
    if (existsSync(ws.manifestPath)) checks.push(['manifest', JSON.parse(readText(ws.manifestPath)), ws.manifestPath]);

    for (const [kind, data, path] of checks) {
      const errors = validateSchema(kind, data);
      if (errors.length) {
        contract = true;
        messages.push(`${path}: ${errors.join('; ')}`);
      }
    }

    const projected = projectLabel(registry, config, label.data.generated.date);
    if (projected.generated.projection_fingerprint !== label.data.generated.projection_fingerprint) {
      stale = true;
      messages.push('Label projection fingerprint does not match the current register and config.');
    }
    if (label.body.trim() !== renderLabelBody(projected).trim()) {
      stale = true;
      messages.push('Label body does not match the current projection.');
    }

    if (mode === 'full') {
      const ctx = enumerateTree(root, config);
      const source = sourceFingerprint(ctx.files, ctx.exclusions.filter((item) => item.path && item.path !== '.'));
      const manifest = loadManifest(ws);
      if (!manifest) {
        stale = true;
        messages.push('Manifest is missing; source freshness cannot pass.');
      } else {
        if (manifest.fingerprints.source !== source) {
          stale = true;
          messages.push('Source fingerprint is stale.');
        }
        if (manifest.fingerprints.config !== configFingerprint(config)) {
          stale = true;
          messages.push('Config fingerprint is stale.');
        }
        if (manifest.fingerprints.adapters !== adapterFingerprint()) {
          stale = true;
          messages.push('Adapter fingerprint is stale.');
        }
        if (manifest.fingerprints.rules !== sha256Json(RULE_SET)) {
          stale = true;
          messages.push('Rules fingerprint is stale.');
        }
      }
    } else {
      messages.push('Source freshness was not assessed (--projection). A matching stale map and label can still fail a full check.');
    }

    if (config.publication.target === 'public' && label.data.map) {
      contract = true;
      messages.push('Public labels must not link to the private register.');
    }
  } catch (error) {
    operational = true;
    messages.push(error instanceof Error ? error.message : String(error));
  }

  const exit = operational ? 3 : contract ? 2 : stale ? 1 : 0;
  if (!messages.length) messages.push(mode === 'projection' ? 'Projection check passed.' : 'Check passed.');
  return { exit, messages };
}
