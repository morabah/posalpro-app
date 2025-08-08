#!/usr/bin/env node
// Fast CI guard: parse .next/analyze/client.html for route first-load sizes and fail if any > 300KB
// Non-blocking locally; intended for CI usage

const fs = require('fs');
const path = require('path');

const REPORT = path.join(__dirname, '..', '.next', 'analyze', 'client.html');
const LIMIT_KB = 300;

function parseClientReport(html) {
  // Heuristic: find table rows with route and first-load kB
  const routeRegex = /<tr>[\s\S]*?<td[^>]*>\s*([^<]+)\s*<\/td>[\s\S]*?<td[^>]*>\s*([\d.]+)\s*kB\s*<\/td>[\s\S]*?<\/tr>/g;
  const results = [];
  let m;
  while ((m = routeRegex.exec(html)) !== null) {
    const route = m[1].trim();
    const kb = parseFloat(m[2]);
    if (!isNaN(kb)) {
      results.push({ route, kb });
    }
  }
  return results;
}

function main() {
  if (!fs.existsSync(REPORT)) {
    console.error(`Analyzer report not found: ${REPORT}. Run ANALYZE=true next build first.`);
    process.exit(2);
  }
  const html = fs.readFileSync(REPORT, 'utf8');
  const rows = parseClientReport(html);
  if (!rows.length) {
    console.error('No routes parsed from analyzer report.');
    process.exit(2);
  }
  const offenders = rows.filter(r => r.kb > LIMIT_KB);
  if (offenders.length) {
    console.error(`Bundle budget exceeded (> ${LIMIT_KB}KB):`);
    offenders.forEach(o => console.error(` - ${o.route}: ${o.kb}KB`));
    process.exit(1);
  }
  console.log('Bundle budgets OK.');
}

main();
