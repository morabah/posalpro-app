import { encode } from 'next-auth/jwt';
import { getAuthSecret } from '@/lib/auth/secret';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvLocal() {
  try {
    const p = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]+)"?\s*$/i);
        if (m) {
          const key = m[1];
          const val = m[2].trim();
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  } catch {
    // ignore
  }
}

async function main() {
  // Ensure local env is loaded when running outside Next.js
  if (!process.env.NEXTAUTH_SECRET && !process.env.JWT_SECRET) {
    loadEnvLocal();
  }
  const secret = getAuthSecret();
  // Minimal token payload consistent with our callbacks
  const token = {
    id: 'test-user-id',
    sub: 'test-user-id',
    email: 'admin@posalpro.com',
    name: 'System Administrator',
    department: 'IT',
    tenantId: 'tenant_default',
    roles: ['System Administrator'],
    permissions: ['admin:*', 'users:read', 'roles:read', 'proposals:read'],
    sessionId: 'test-session-123',
  } as any;

  const jwt = await encode({ token, secret, maxAge: 24 * 60 * 60 });
  // Write only the token to stdout for easy capture
  process.stdout.write(jwt);
}

main().catch(err => {
  console.error('Failed to generate token', err);
  process.exit(1);
});
