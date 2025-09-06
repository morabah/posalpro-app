import { decode } from 'next-auth/jwt';
import { getAuthSecret } from '@/lib/auth/secret';

async function main() {
  const token = process.argv[2];
  if (!token) {
    console.error('Usage: tsx scripts/decode-nextauth-token.ts <JWT>');
    process.exit(1);
  }
  try {
    const decoded = await decode({ token, secret: getAuthSecret() });
    if (!decoded) {
      console.error('Decoded token is null');
      process.exit(2);
    }
    console.log(JSON.stringify({
      sub: (decoded as any).sub,
      id: (decoded as any).id,
      email: (decoded as any).email,
      roles: (decoded as any).roles,
      hasSessionId: Boolean((decoded as any).sessionId),
    }));
  } catch (e) {
    console.error('DECODE_ERROR', (e as Error)?.message || e);
    process.exit(3);
  }
}

main();

