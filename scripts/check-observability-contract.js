#!/usr/bin/env node
// Quick local contract checks for observability headers
// Verifies: x-request-id echoed and Server-Timing present on selected endpoints

const http = require('http');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const PATHS = ['/api/observability/metrics', '/api/proposals/list'];

function get(url) {
  return new Promise((resolve, reject) => {
    const reqId = `obs-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const req = http.get(url, { headers: { 'x-request-id': reqId } }, res => {
      const serverTiming = res.headers['server-timing'];
      const echoed = res.headers['x-request-id'];
      resolve({ status: res.statusCode, serverTiming, echoed, reqId });
    });
    req.on('error', reject);
  });
}

async function main() {
  let failed = false;
  for (const p of PATHS) {
    const url = `${BASE}${p}`;
    try {
      const { status, serverTiming, echoed, reqId } = await get(url);
      if (!serverTiming) {
        console.error(`[FAIL] ${p}: missing Server-Timing`);
        failed = true;
      }
      if (!echoed || echoed !== reqId) {
        console.error(`[FAIL] ${p}: x-request-id not echoed`);
        failed = true;
      }
      if (status && status >= 500) {
        console.error(`[FAIL] ${p}: status ${status}`);
        failed = true;
      }
      console.log(`[OK] ${p}: Server-Timing and x-request-id present`);
    } catch (e) {
      console.error(`[ERROR] ${p}:`, e.message);
      failed = true;
    }
  }
  process.exit(failed ? 1 : 0);
}

main();
