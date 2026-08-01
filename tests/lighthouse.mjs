// ── Lighthouse CI Runner ────────────────────────────────
// Launches a headless Chrome on the CDP port, runs Lighthouse
// against the local server, and checks thresholds.

import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { URL } from 'url';

const BASE = 'http://localhost:8080';
const PORT = 9222;

async function main() {
  console.log(`Running Lighthouse against ${BASE} ...\n`);

  const chrome = await launch({
    port: PORT,
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
  });

  let runnerResult;
  try {
    runnerResult = await lighthouse(BASE, {
      extends: 'lighthouse:default',
      settings: {
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        throttling: { rcpThroughput: 0, cpuSlowdownMultiplier: 1 },
      },
    });
  } finally {
    await chrome.kill();
  }

  const categories = runnerResult.lhr.categories;
  const scores = {};
  let failed = false;

  const thresholds = {
    performance: 80,
    accessibility: 95,
    'best-practices': 90,
    seo: 100,
  };

  for (const [key, cat] of Object.entries(categories)) {
    if (!thresholds[key]) continue;
    const score = Math.round(cat.score * 100);
    const threshold = thresholds[key];
    const status = score < threshold ? '❌ FAIL' : '✅ PASS';
    if (score < threshold) failed = true;
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
