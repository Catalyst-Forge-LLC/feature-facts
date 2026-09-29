import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { applyProduct } from '../src/assemble.ts';
import { emptyRegistry } from '../src/defaults.ts';
import { productTitle } from '../src/product-title.ts';

describe('product title', () => {
  it('uses the site title instead of the workspace package name', () => {
    const root = mkdtempSync(join(tmpdir(), 'ff-title-'));
    mkdirSync(join(root, 'site'));
    writeFileSync(join(root, 'site', 'filepress.config.ts'), "export default {\n  title: 'Efficacy',\n}\n");
    assert.equal(productTitle(root), 'Efficacy');
    const registry = emptyRegistry('scan-test', 'efficacy-workspace');
    applyProduct(registry, JSON.stringify({ name: 'efficacy-workspace', private: true }), 'efficacy', 'Efficacy');
    assert.equal(registry.product.name, 'Efficacy');
    assert.equal(registry.product.status, 'experimental');
  });
});
