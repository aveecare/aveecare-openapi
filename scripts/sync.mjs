#!/usr/bin/env node
// Maintainers copy the published spec here.
//
//   node scripts/sync.mjs <path-or-url-to-openapi.json>   copy a new spec in
//   node scripts/sync.mjs --rebuild                       regenerate the YAML and Postman files from openapi.json
//
// The specification is generated and published by AveeCare; this repository
// mirrors it. Never edit openapi.json or openapi.yaml by hand: fix the source
// and sync again. The script validates the document, writes openapi.json and
// openapi.yaml, and rebuilds the Postman collection.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { JSON_PATH, readJson, writeSpecFiles } from './lib/spec.mjs';

const arg = process.argv[2];
if (!arg || arg === '--help' || arg === '-h') {
  console.error('usage: node scripts/sync.mjs <path-or-url-to-openapi.json> | --rebuild');
  process.exit(arg ? 0 : 2);
}

let spec;
if (arg === '--rebuild') {
  spec = readJson(JSON_PATH);
} else if (/^https:\/\//.test(arg)) {
  const res = await fetch(arg, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    console.error(`could not download ${arg}: HTTP ${res.status}`);
    process.exit(1);
  }
  spec = await res.json();
} else {
  spec = JSON.parse(readFileSync(resolve(arg), 'utf8'));
}

if (!/^3\.1\.\d+$/.test(String(spec.openapi)) || !spec.paths || !spec.info?.version) {
  console.error('that file is not an OpenAPI 3.1 document with paths and info.version');
  process.exit(1);
}

writeSpecFiles(spec);
const run = (script) => {
  const r = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url))], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
run('./build-postman.mjs');
run('./validate.mjs');
console.log(`synced AveeCare API ${spec.info.version}. Review the diff, then run \`npm run lint\` and commit.`);
