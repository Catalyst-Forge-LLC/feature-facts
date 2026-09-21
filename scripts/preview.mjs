#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('..', import.meta.url)));
const site = join(root, 'site');
const NAME = 'featurefacts-preview';
const DEFAULT_PORT = 8767;

function claimPort() {
  return new Promise((resolve) => {
    const child = spawn('localslip', ['claim', NAME, '--port', String(DEFAULT_PORT), '--or-next'], {
      windowsHide: true,
    });
    let out = '';
    child.stdout.on('data', (chunk) => {
      out += chunk;
    });
    child.on('error', () => resolve(DEFAULT_PORT));
    child.on('close', () => {
      const match = out.match(/(\d{4,5})/);
      resolve(match ? Number(match[1]) : DEFAULT_PORT);
    });
  });
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
};

const port = Number(process.env.PORT) || (await claimPort());
const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
  let path = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = join(site, path.replace(/^\/+/, ''));
  if (!file.startsWith(site) || !existsSync(file)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`FeatureFacts preview http://127.0.0.1:${port} (${NAME})\n`);
});
