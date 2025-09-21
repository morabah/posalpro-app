#!/usr/bin/env tsx

/*
 * PosalPro CLI - Cookie Jar Implementation
 *
 * Minimal persistent cookie jar for session management
 */

import fs from 'node:fs';
import path from 'node:path';

export class CookieJar {
  private cookies: Map<string, string> = new Map();
  private storageFile: string;

  constructor(storageFile: string) {
    this.storageFile = storageFile;
    this.loadFromDisk();
  }

  getAllCookies(): Map<string, string> {
    return new Map(this.cookies);
  }

  replaceCookies(cookies: Iterable<[string, string]>) {
    this.cookies = new Map(cookies);
    this.saveToDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const data = JSON.parse(raw) as { cookies?: Record<string, string> };
        if (data.cookies) {
          this.cookies = new Map(Object.entries(data.cookies));
        }
      }
    } catch {
      // Ignore errors when loading cookies
    }
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const data = { cookies: Object.fromEntries(this.cookies.entries()) };
      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2));
    } catch {
      // Ignore errors when saving cookies
    }
  }

  setFromSetCookie(headers: string[] | undefined) {
    if (!headers || headers.length === 0) return;
    const lines: string[] = [];
    // Some runtimes return multiple cookies in a single header line.
    // Robustly split combined Set-Cookie lines while respecting Expires commas.
    for (const raw of headers) {
      lines.push(...this.splitCombinedSetCookie(raw));
    }
    for (const line of lines) {
      const [pair] = line.split(';');
      const eq = pair.indexOf('=');
      if (eq <= 0) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (name && value) {
        this.cookies.set(name, value);
      }
    }
    this.saveToDisk();
  }

  // Split a possibly combined Set-Cookie header string into individual cookie strings.
  // Handles commas inside Expires attribute (e.g., Expires=Wed, 11 Sep 2024 12:00:00 GMT).
  private splitCombinedSetCookie(headerLine: string): string[] {
    // If header already looks like a single cookie (no comma), short-circuit.
    if (!headerLine.includes(',')) return [headerLine];

    const result: string[] = [];
    let inExpires = false;
    let start = 0;
    for (let i = 0; i < headerLine.length; i++) {
      const ch = headerLine[i];
      // Detect start of Expires attribute (case-insensitive)
      if (!inExpires && headerLine.slice(i).toLowerCase().startsWith('expires=')) {
        inExpires = true;
        i += 'expires='.length - 1;
        continue;
      }
      if (inExpires) {
        // Expires attribute ends at the next semicolon or end of string
        if (ch === ';') {
          inExpires = false;
        }
        continue;
      }
      if (ch === ',') {
        // Comma that is not part of Expires → cookie separator
        const segment = headerLine.slice(start, i).trim();
        if (segment) result.push(segment);
        start = i + 1;
      }
    }
    const tail = headerLine.slice(start).trim();
    if (tail) result.push(tail);
    return result;
  }

  getCookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  clear() {
    this.cookies.clear();
    this.saveToDisk();
  }
}

// Helper to normalize access to multiple Set-Cookie headers across runtimes
export function extractSetCookieList(headers: Headers): string[] {
  const anyHeaders: any = headers as any;
  // Node 20+ undici
  if (typeof anyHeaders.getSetCookie === 'function') {
    try {
      const arr = anyHeaders.getSetCookie();
      if (Array.isArray(arr)) return arr as string[];
    } catch {
      // Ignore errors
    }
  }
  // Undici raw()
  if (typeof anyHeaders.raw === 'function') {
    try {
      const raw = anyHeaders.raw();
      if (raw && Array.isArray(raw['set-cookie'])) return raw['set-cookie'] as string[];
    } catch {
      // Ignore errors
    }
  }
  // Fallback single header
  const single = headers.get('set-cookie');
  return single ? [single] : [];
}
