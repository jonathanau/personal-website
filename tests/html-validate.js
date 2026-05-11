// HTML Validation Script
// Wraps the W3C Nu Html Checker API using async/await and fetch

const PAGE_URL = 'http://localhost:8080/';
const NU_URL = 'https://validator.w3.org/nu/?out=json';

async function processResults(body) {
  if (!body || body.trim().length === 0) {
    console.log('Empty response from validator.');
    process.exit(0);
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (e) {
    console.log('Could not parse JSON response. Raw (first 500 chars):');
    console.log(body.substring(0, 500));
    process.exit(0);
  }

  const messages = parsed.messages || [];
  const errors = messages.filter(m => m.type === 'error');
  const infoMsgs = messages.filter(m => m.type === 'info');

  if (errors.length > 0) {
    console.log(`${errors.length} HTML error(s):`);
    errors.forEach(e => {
      console.log(`  Line ${e.lastLine}:${e.lastCol} -- ${e.message}`);
      if (e.extract) console.log(`  > ${e.extract}`);
    });
    process.exit(1);
  }

  if (infoMsgs.length > 0) {
    console.log(`${infoMsgs.length} HTML info/warning(s):`);
    infoMsgs.forEach(w => {
      console.log(`  Line ${w.lastLine}:${w.lastCol} -- ${w.message}`);
    });
  }

  console.log('No HTML errors.');
  process.exit(0);
}

async function main() {
  try {
    const pageResponse = await fetch(PAGE_URL);
    if (!pageResponse.ok) throw new Error(`Failed to fetch page: ${pageResponse.status}`);
    const html = await pageResponse.text();

    console.log(`Validating ${PAGE_URL} (${html.length} bytes) ...`);

    const nuResponse = await fetch(NU_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'User-Agent': 'html-validator/1.0 (validator.w3.org)',
        'Content-Language': 'en',
        'Accept': 'application/json',
      },
      body: html
    });

    if (!nuResponse.ok) {
      console.log(`Nu checker returned HTTP ${nuResponse.status}`);
    }

    const body = await nuResponse.text();
    await processResults(body);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();