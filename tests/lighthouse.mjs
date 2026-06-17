// ── Lighthouse CI Runner (local) ────────────────────────
// Runs Lighthouse against the local server and checks thresholds

import lighthouse from 'lighthouse';
import { URL } from 'url';

const BASE = 'http://localhost:8080';

async function main() {
  console.log(`Running Lighthouse against ${BASE} ...\n`);

  const runnerResult = await lighthouse(BASE, {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      throttling: { rcpThroughput: 0, cpuSlowdownMultiplier: 1 },
    },
  });

  const categories = runnerResult.lhr.categories;
  const scores = {};
  let failed = false;

  const thresholds = {
    performance: 95,
    accessibility: 95,
    'best-practices': 95,
    seo: 100,
  };

  for (const [key, cat] of Object.entries(categories)) {
    const score = Math.round(cat.score * 100);
    const threshold = thresholds[key];
    const status = threshold && score < threshold ? '❌ FAIL' : '✅ PASS';
    if (threshold && score < threshold) failed = true;
    scores[key] = score;
    console.log(`${status} ${cat.title}: ${score}/100`);
  }

  console.log('\nDone.');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});