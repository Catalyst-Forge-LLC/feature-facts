import { createHash } from 'node:crypto';

export function sha256Bytes(bytes: Uint8Array | Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function sha256Json(value: unknown): string {
  return sha256Bytes(canonicalJson(value));
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sortValue);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    const item = obj[key];
    if (item === undefined) continue;
    out[key] = sortValue(item);
  }
  return out;
}

export function omitGenerated(frontmatter: Record<string, unknown>): Record<string, unknown> {
  const { generated: _generated, ...rest } = frontmatter;
  return rest;
}

export function kebabId(raw: string): string {
  let cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  if (!cleaned || !/^[a-z]/.test(cleaned)) {
    cleaned = `id-${cleaned || 'unnamed'}`.replace(/-{2,}/g, '-');
  }
  cleaned = cleaned.slice(0, 64).replace(/-+$/g, '');
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(cleaned)) {
    return `id-${sha256Bytes(raw).slice(0, 12)}`;
  }
  return cleaned;
}

export function scanIdFor(parts: string[]): string {
  return `scan-${sha256Bytes(parts.join('\0')).slice(0, 12)}`;
}

export function findingId(featureId: string, ruleId: string): string {
  return `gap-${sha256Json([featureId, ruleId]).slice(0, 24)}`;
}
