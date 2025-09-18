/**
 * DEPRECATED: Use `@/lib/prisma` as the single authoritative Prisma client.
 * This module now re-exports the canonical client to prevent duplication.
 */

export { prisma } from '@/lib/prisma';
export type { PrismaClient } from '@prisma/client';

const _deprecatedNotice = process.env.NODE_ENV === 'development' ? undefined : undefined;
