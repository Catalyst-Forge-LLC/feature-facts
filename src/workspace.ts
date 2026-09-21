import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Config, LabelFrontmatter, Manifest, Registry, Surface } from './types.ts';
import { defaultConfig } from './defaults.ts';
import { dumpYaml, loadYaml, parseFrontmatter, readText, renderFrontmatter, writeIfChanged } from './yaml-io.ts';
import { sha256Bytes } from './hash.ts';

export interface Workspace {
  root: string;
  registerDir: string;
  configPath: string;
  featuresPath: string;
  featuresJsonPath: string;
  surfacesPath: string;
  manifestPath: string;
  gapsPath: string;
  docsIndexPath: string;
  testIndexPath: string;
  featuresMdPath: string;
  labelPath: string;
}

export function workspaceAt(root: string): Workspace {
  const registerDir = resolve(root, '.featurefacts');
  return {
    root,
    registerDir,
    configPath: resolve(registerDir, 'config.yaml'),
    featuresPath: resolve(registerDir, 'features.yaml'),
    featuresJsonPath: resolve(registerDir, 'features.json'),
    surfacesPath: resolve(registerDir, 'surfaces.json'),
    manifestPath: resolve(registerDir, 'manifest.json'),
    gapsPath: resolve(registerDir, 'gaps.yaml'),
    docsIndexPath: resolve(registerDir, 'docs-index.json'),
    testIndexPath: resolve(registerDir, 'test-index.json'),
    featuresMdPath: resolve(registerDir, 'FEATURES.md'),
    labelPath: resolve(root, 'FEATURE_FACTS.md'),
  };
}

export function loadConfig(ws: Workspace): Config {
  if (!existsSync(ws.configPath)) return defaultConfig();
  return loadYaml<Config>(ws.configPath);
}

export function loadRegistry(ws: Workspace): Registry | null {
  if (!existsSync(ws.featuresPath)) return null;
  return loadYaml<Registry>(ws.featuresPath);
}

export function loadLabel(ws: Workspace): { data: LabelFrontmatter; body: string } | null {
  if (!existsSync(ws.labelPath)) return null;
  const parsed = parseFrontmatter(readText(ws.labelPath));
  return { data: parsed.data as unknown as LabelFrontmatter, body: parsed.body };
}

export function writeJson(path: string, value: unknown): boolean {
  return writeIfChanged(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function writeYaml(path: string, value: unknown): boolean {
  return writeIfChanged(path, dumpYaml(value));
}

export function writeLabel(ws: Workspace, data: LabelFrontmatter, body: string): boolean {
  return writeIfChanged(ws.labelPath, renderFrontmatter(data as unknown as Record<string, unknown>, body));
}

export function artifactDigest(path: string): { path: string; sha256: string } {
  return {
    path: path.replace(/\\/g, '/'),
    sha256: sha256Bytes(readText(path)),
  };
}

export function loadSurfaces(ws: Workspace): Surface[] {
  if (!existsSync(ws.surfacesPath)) return [];
  const parsed = JSON.parse(readText(ws.surfacesPath)) as { surfaces?: Surface[] };
  return parsed.surfaces ?? [];
}

export function loadManifest(ws: Workspace): Manifest | null {
  if (!existsSync(ws.manifestPath)) return null;
  return JSON.parse(readText(ws.manifestPath)) as Manifest;
}
