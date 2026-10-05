#!/usr/bin/env node
// Checks that openapi.json and openapi.yaml are valid, describe the same
// document, and that every local $ref resolves. Exits 1 on any problem.
import { readFileSync } from 'node:fs';
import { JSON_PATH, YAML_PATH, YAML, deref, readJson } from './lib/spec.mjs';

const errors = [];
const fail = (msg) => errors.push(msg);

let fromJson;
let fromYaml;
try {
  fromJson = readJson(JSON_PATH);
} catch (err) {
  fail(`openapi.json is not valid JSON: ${err.message}`);
}
try {
  const doc = YAML.parseDocument(readFileSync(YAML_PATH, 'utf8'));
  if (doc.errors.length) doc.errors.forEach((e) => fail(`openapi.yaml: ${e.message}`));
  fromYaml = doc.toJS();
} catch (err) {
  fail(`openapi.yaml is not valid YAML: ${err.message}`);
}

if (fromJson && fromYaml) {
  if (JSON.stringify(fromJson) !== JSON.stringify(fromYaml)) {
    fail('openapi.json and openapi.yaml differ. Run `npm run sync` or `node scripts/sync.mjs --rebuild`.');
  }
  if (!/^3\.1\.\d+$/.test(String(fromJson.openapi))) fail(`expected OpenAPI 3.1.x, found ${fromJson.openapi}`);
  if (!fromJson.info?.title || !fromJson.info?.version) fail('info.title and info.version are required');

  const refs = new Set();
  (function walk(node) {
    if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === 'object') {
      if (typeof node.$ref === 'string') refs.add(node.$ref);
      Object.values(node).forEach(walk);
    }
  })(fromJson);
  for (const ref of refs) if (deref(fromJson, { $ref: ref }) === undefined) fail(`unresolved reference ${ref}`);

  const ids = new Map();
  for (const [path, item] of Object.entries(fromJson.paths ?? {})) {
    for (const [method, op] of Object.entries(item)) {
      if (!['get', 'put', 'post', 'patch', 'delete', 'head', 'options'].includes(method)) continue;
      if (!op.operationId) fail(`${method.toUpperCase()} ${path} has no operationId`);
      else if (ids.has(op.operationId)) fail(`duplicate operationId ${op.operationId}`);
      else ids.set(op.operationId, `${method} ${path}`);
    }
  }
  if (errors.length === 0) {
    console.log(`ok: OpenAPI ${fromJson.openapi}, ${Object.keys(fromJson.paths).length} paths, ${ids.size} operations, ${refs.size} distinct references, JSON and YAML agree.`);
  }
}

if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`);
  process.exit(1);
}
