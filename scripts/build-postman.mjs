#!/usr/bin/env node
// Generates postman/aveecare.postman_collection.json (Postman Collection v2.1)
// from openapi.json: one folder per tag, one request per operation, bearer
// authentication through the {{AVEECARE_API_KEY}} variable and the API origin
// in {{baseUrl}}. Run it through `npm run postman` or `node scripts/sync.mjs --rebuild`.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { JSON_PATH, POSTMAN_PATH, deref, readJson } from './lib/spec.mjs';

const METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const spec = readJson(JSON_PATH);
const baseUrl = spec.servers?.[0]?.url ?? 'https://api.aveecare.com';

/** Postman uses :name for a path variable. */
const toPostmanPath = (path) => path.split('/').filter(Boolean).map((seg) => seg.replace(/^\{(.+)\}$/, ':$1'));

const textOf = (...parts) => parts.filter(Boolean).join('\n\n');

const exampleOf = (schema) => {
  const s = deref(spec, schema);
  if (!s) return undefined;
  if (s.example !== undefined) return s.example;
  if (Array.isArray(s.enum)) return s.enum.find((v) => v !== null);
  if (s.default !== undefined) return s.default;
  if (s.type === 'object' && s.properties) return bodyFor(s, false);
  if (s.type === 'array') {
    const item = exampleOf(s.items ?? {});
    return item === undefined ? [] : [item];
  }
  return undefined;
};

/** A small, valid-looking request body: the required fields, or the first few documented fields. */
const bodyFor = (schema, top = true) => {
  const s = deref(spec, schema);
  if (!s?.properties) return {};
  const required = new Set(s.required ?? []);
  const entries = Object.entries(s.properties).filter(([, v]) => !deref(spec, v)?.readOnly);
  const chosen = entries.filter(([k]) => required.has(k));
  const picked = top && chosen.length === 0 ? entries.slice(0, 3) : chosen;
  const body = {};
  for (const [key, value] of picked) {
    const ex = exampleOf(value);
    if (ex !== undefined) body[key] = ex;
  }
  return body;
};

const paramDefault = (param) => {
  const ex = param.example ?? exampleOf(param.schema ?? {});
  return ex === undefined ? '' : String(ex);
};

const buildRequest = (path, method, op, pathParams) => {
  const params = [...pathParams, ...(op.parameters ?? [])].map((p) => deref(spec, p)).filter(Boolean);
  const query = params
    .filter((p) => p.in === 'query')
    .map((p) => ({
      key: p.name,
      value: paramDefault(p),
      description: p.description,
      // Required parameters are on by default so the request works as imported.
      disabled: !p.required,
    }));
  const variable = params
    .filter((p) => p.in === 'path')
    .map((p) => ({ key: p.name, value: paramDefault(p), description: p.description }));
  const header = [{ key: 'Accept', value: 'application/json' }];
  for (const p of params.filter((x) => x.in === 'header')) {
    // Postman fills {{$guid}} with a fresh UUID for every send.
    header.push({ key: p.name, value: p.name.toLowerCase() === 'idempotency-key' ? '{{$guid}}' : paramDefault(p), description: p.description });
  }

  const request = {
    method: method.toUpperCase(),
    header,
    url: {
      raw: `{{baseUrl}}/${toPostmanPath(path).join('/')}${query.some((q) => !q.disabled) ? `?${query.filter((q) => !q.disabled).map((q) => `${q.key}=${q.value}`).join('&')}` : ''}`,
      host: ['{{baseUrl}}'],
      path: toPostmanPath(path),
      ...(query.length ? { query } : {}),
      ...(variable.length ? { variable } : {}),
    },
    description: textOf(op.description, op['x-aveecare-scope'] ? `Required key scope: \`${op['x-aveecare-scope']}\`.` : ''),
  };
  const media = deref(spec, op.requestBody)?.content?.['application/json'];
  if (media) {
    request.header.push({ key: 'Content-Type', value: 'application/json' });
    request.body = {
      mode: 'raw',
      raw: JSON.stringify(media.example ?? bodyFor(media.schema), null, 2),
      options: { raw: { language: 'json' } },
    };
  }
  return request;
};

const folders = new Map();
for (const tag of spec.tags ?? []) folders.set(tag.name, { name: tag.name, description: tag.description, item: [] });

for (const [path, item] of Object.entries(spec.paths)) {
  for (const method of METHODS) {
    const op = item[method];
    if (!op) continue;
    const tag = op.tags?.[0] ?? 'Other';
    if (!folders.has(tag)) folders.set(tag, { name: tag, item: [] });
    folders.get(tag).item.push({
      name: op.summary ?? `${method.toUpperCase()} ${path}`,
      request: buildRequest(path, method, op, item.parameters ?? []),
      response: [],
    });
  }
}

const collection = {
  info: {
    name: `AveeCare API v${spec.info.version}`,
    description: textOf(
      'The AveeCare REST API for home care agencies. Generated from the public OpenAPI specification.',
      'Set the `AVEECARE_API_KEY` collection variable to a key from Settings → API Keys in AveeCare. Change `baseUrl` only to point at a sandbox.',
      'Docs: https://www.aveecare.com/docs/api',
    ),
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth: {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{AVEECARE_API_KEY}}', type: 'string' }],
  },
  variable: [
    { key: 'baseUrl', value: baseUrl, type: 'string' },
    { key: 'AVEECARE_API_KEY', value: '', type: 'secret' },
  ],
  item: [...folders.values()].filter((f) => f.item.length > 0),
};

mkdirSync(dirname(POSTMAN_PATH), { recursive: true });
writeFileSync(POSTMAN_PATH, `${JSON.stringify(collection, null, 2)}\n`);
const requests = collection.item.reduce((n, f) => n + f.item.length, 0);
console.log(`wrote postman/aveecare.postman_collection.json (${collection.item.length} folders, ${requests} requests)`);
