// Centralized Prisma client re-export
// Ensures all imports of '@/lib/prisma' and '@/lib/db/prisma' share the same instance
export { prisma as default, prisma } from '@/lib/db/prisma';
