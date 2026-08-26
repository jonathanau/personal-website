#!/usr/bin/env node
/**
 * Content validator self-test.
 *
 * Runs the generator's collectContent() against intentionally broken fixture
 * directories (each must be rejected with the expected message) and against
 * the real content/ directory (must pass). Exits non-zero on any failure.
 *
 * No npm dependencies.
 */

import { strict as assert } from 'node:assert';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectContent } from '../scripts/build-content.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FIXTURES = join(ROOT, 'tests', 'fixtures');

/** [fixtureDir, substring the validation error must contain] */
const rejectionCases = [
  ['bad-slug', 'slug must be lowercase'],
  ['missing-title', '`title` must be a non-empty string'],
  ['http-url', 'must be an https:// URL'],
  ['duplicate-title', 'duplicate title "same title"'],
  ['empty-body', 'body (description) must not be empty'],
];

let failures = 0;

for (const [dir, expectedSubstring] of rejectionCases) {
  const name = `rejects ${dir}`;
  try {
    collectContent(join(FIXTURES, dir));
    console.error(`✗ ${name}: expected ValidationError, got success`);
    failures++;
  } catch (err) {
    try {
      assert.match(err.message, new RegExp(expectedSubstring.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      console.log(`✓ ${name}`);
    } catch (assertErr) {
      console.error(`✗ ${name}: error message did not mention "${expectedSubstring}":\n  ${err.message.split('\n')[0]}`);
      failures++;
    }
  }
}

try {
  collectContent(join(ROOT, 'content'));
  console.log('✓ accepts real content/');
} catch (err) {
  console.error(`✗ accepts real content/: unexpected failure:\n${err.message}`);
  failures++;
}

if (failures > 0) {
  console.error(`\n${failures} content-validator test(s) failed`);
  process.exit(1);
}
console.log('\nAll content-validator tests passed');
