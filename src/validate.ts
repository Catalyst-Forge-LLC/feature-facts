import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv2020 } from 'ajv/dist/2020.js';
import * as ajvFormats from 'ajv-formats';

const addFormats = (ajvFormats as unknown as { default?: (ajv: Ajv2020) => void }).default ??
  (ajvFormats as unknown as (ajv: Ajv2020) => void);

const schemaDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'schemas');

const SCHEMA_FILES = [
  'common.schema.json',
  'config.schema.json',
  'feature-record.schema.json',
  'registry.schema.json',
  'surfaces.schema.json',
  'manifest.schema.json',
  'gaps.schema.json',
  'docs-index.schema.json',
  'test-index.schema.json',
  'feature-facts-label.schema.json',
  'detector-result.schema.json',
] as const;

let cached: Ajv2020 | null = null;

function loadAjv(): Ajv2020 {
  if (cached) return cached;
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateSchema: false,
  });
  addFormats(ajv);
  for (const file of SCHEMA_FILES) {
    const schema = JSON.parse(readFileSync(join(schemaDir, file), 'utf8')) as object;
    ajv.addSchema(schema);
  }
  cached = ajv;
  return ajv;
}

const IDS: Record<string, string> = {
  config: 'https://featurefacts.dev/schema/v0.2.0/config.schema.json',
  registry: 'https://featurefacts.dev/schema/v0.2.0/registry.schema.json',
  surfaces: 'https://featurefacts.dev/schema/v0.2.0/surfaces.schema.json',
  manifest: 'https://featurefacts.dev/schema/v0.2.0/manifest.schema.json',
  gaps: 'https://featurefacts.dev/schema/v0.2.0/gaps.schema.json',
  docs: 'https://featurefacts.dev/schema/v0.2.0/docs-index.schema.json',
  tests: 'https://featurefacts.dev/schema/v0.2.0/test-index.schema.json',
  label: 'https://featurefacts.dev/schema/v0.2.0/feature-facts-label.schema.json',
};

export function validateSchema(kind: keyof typeof IDS, data: unknown): string[] {
  const ajv = loadAjv();
  const validate = ajv.getSchema(IDS[kind]);
  if (!validate) return [`missing schema ${kind}`];
  const ok = validate(data);
  if (ok) return [];
  return (validate.errors ?? []).map((err) => `${err.instancePath || '/'} ${err.message ?? 'invalid'}`);
}
