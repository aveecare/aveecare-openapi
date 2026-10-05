// Shared helpers for the maintenance scripts. Node 18+, plus the `yaml` package.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const JSON_PATH = join(ROOT, 'openapi.json');
export const YAML_PATH = join(ROOT, 'openapi.yaml');
export const POSTMAN_PATH = join(ROOT, 'postman', 'aveecare.postman_collection.json');

export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

/** The canonical JSON form: two-space indent and a trailing newline. */
export const toJsonText = (spec) => `${JSON.stringify(spec, null, 2)}\n`;

/** The YAML form of the spec. Long descriptions stay on one line each. */
export const toYamlText = (spec) => YAML.stringify(spec, { lineWidth: 0, aliasDuplicateObjects: false });

export const writeSpecFiles = (spec) => {
  writeFileSync(JSON_PATH, toJsonText(spec));
  writeFileSync(YAML_PATH, toYamlText(spec));
};

/** Resolves a local `#/...` reference. */
export const deref = (spec, node) => {
  let cur = node;
  const seen = new Set();
  while (cur && typeof cur === 'object' && typeof cur.$ref === 'string') {
    if (seen.has(cur.$ref) || !cur.$ref.startsWith('#/')) return undefined;
    seen.add(cur.$ref);
    cur = cur.$ref
      .slice(2)
      .split('/')
      .map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'))
      .reduce((acc, key) => (acc == null ? undefined : acc[key]), spec);
  }
  return cur;
};

export { YAML };
