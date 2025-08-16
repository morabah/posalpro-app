#!/usr/bin/env node
// CI bundle budget checker with two strategies:
// 1) Try parsing Webpack Analyzer HTML (legacy)
// 2) Fallback to robust Next.js manifests: app-build-manifest + build-manifest

const fs = require('fs');
const path = require('path');

const NEXT_DIR = path.join(__dirname, '..', '.next');
const REPORT = path.join(NEXT_DIR, 'analyze', 'client.html');
const APP_BUILD_MANIFEST = path.join(NEXT_DIR, 'app-build-manifest.json');
const BUILD_MANIFEST = path.join(NEXT_DIR, 'build-manifest.json');
const STATIC_DIR = path.join(NEXT_DIR, 'static');
const LIMIT_KB = Number(process.env.BUNDLE_LIMIT_KB || 300); // Client first-load target per route
const MONITORED_ROUTES = [
  '/',
  '/dashboard',
  '/auth/login',
  '/auth/register',
  '/products',
  '/proposals',
  '/customers',
];

function parseAnalyzerHtml() {
  try {
    if (!fs.existsSync(REPORT)) return [];
    const html = fs.readFileSync(REPORT, 'utf8');
    // Very brittle in latest analyzer; keep as best-effort
    const routeRegex = /<tr>[\s\S]*?<td[^>]*>\s*([^<]+)\s*<\/td>[\s\S]*?<td[^>]*>\s*([\d.]+)\s*kB\s*<\/td>[\s\S]*?<\/tr>/g;
    const results = [];
    let m;
    while ((m = routeRegex.exec(html)) !== null) {
      const route = m[1].trim();
      const kb = parseFloat(m[2]);
      if (!isNaN(kb)) results.push({ route, kb });
    }
    return results;
  } catch {
    return [];
  }
}

function getFileSizeKb(relPath) {
  // relPath is like "static/chunks/....js" or "static/css/....css"
  const full = path.join(NEXT_DIR, relPath);
  if (!fs.existsSync(full)) return 0;
  const stat = fs.statSync(full);
  return Math.round((stat.size / 1024) * 100) / 100; // 2 decimals
}

function parseFromManifests() {
  if (!fs.existsSync(APP_BUILD_MANIFEST) || !fs.existsSync(BUILD_MANIFEST)) {
    return [];
  }
  const appManifest = JSON.parse(fs.readFileSync(APP_BUILD_MANIFEST, 'utf8'));
  const buildManifest = JSON.parse(fs.readFileSync(BUILD_MANIFEST, 'utf8'));

  const rootMainFiles = new Set(buildManifest.rootMainFiles || []);

  const results = [];
  const pages = appManifest.pages || {};

  for (const [key, files] of Object.entries(pages)) {
    // focus only on app router page entries (contain '/page' or '/route' etc.)
    if (!Array.isArray(files)) continue;
    // Normalize route label for output
    const route = key.replace(/\/(page|route)$/i, '');
    // Normalize known app router groups to friendly paths
    const normalized = route
      .replace(/^\/_not-found$/, '/_not-found')
      .replace(/^\/(dashboard)\/dashboard$/, '/dashboard')
      .replace(/^\/(dashboard)\/products$/, '/products')
      .replace(/^\/(dashboard)\/proposals$/, '/proposals')
      .replace(/^\/(dashboard)\/customers$/, '/customers')
      .replace(/^\/(dashboard)\/content$/, '/content')
      .replace(/^\/(dashboard)\/settings$/, '/settings')
      .replace(/^\/(dashboard)\/about$/, '/about')
      .replace(/^\/(dashboard)\/profile$/, '/profile')
      .replace(/^\/(dashboard)\/coordination$/, '/coordination')
      .replace(/^\/(dashboard)\/validation$/, '/validation')
      .replace(/^\/(dashboard)\/sme$/, '/sme')
      .replace(/^\/(dashboard)\/workflows$/, '/workflows')
      .replace(/^\/page$/, '/');

    // First-load = rootMainFiles + page-specific files
    const uniqueFiles = new Set([...rootMainFiles, ...files]);
    let totalKb = 0;
    for (const f of uniqueFiles) {
      // Only count JS and CSS assets under static/
      if (typeof f === 'string' && (f.endsWith('.js') || f.endsWith('.css'))) {
        totalKb += getFileSizeKb(f);
      }
    }
    // Only keep monitored primary routes for first-load budget
    if (MONITORED_ROUTES.includes(normalized)) {
      results.push({ route: normalized, kb: Math.round(totalKb * 100) / 100 });
    }
  }
  return results.sort((a, b) => b.kb - a.kb);
}

function main() {
  let rows = parseAnalyzerHtml();
  if (!rows.length) {
    rows = parseFromManifests();
  }
  if (!rows.length) {
    console.error('Bundle budget check: Unable to derive route sizes from analyzer or manifests.');
    process.exit(2);
  }

  const offenders = rows.filter(r => r.kb > LIMIT_KB);
  if (offenders.length) {
    console.error(`Bundle budget exceeded (> ${LIMIT_KB}KB) on ${offenders.length} route(s):`);
    offenders.slice(0, 20).forEach(o => console.error(` - ${o.route}: ${o.kb}KB`));
    // Provide top 10 largest for visibility
    const top = rows.slice(0, 10).map(r => ` - ${r.route}: ${r.kb}KB`).join('\n');
    console.error('Top routes by first-load size:\n' + top);
    process.exit(1);
  }
  console.log('Bundle budgets OK. All routes under limit.');
}

main();
