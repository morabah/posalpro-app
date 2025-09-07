// Server DB Service Template (Prisma-backed)
// Purpose: Encapsulate all business logic and database access for __ENTITY__
// Location: src/lib/services/__RESOURCE__Service.ts
// Notes:
// - Routes MUST call these methods; no Prisma or raw SQL in routes.
// - Centralize normalization (Decimal → number, nulls), transactions, and error mapping here.

import { prisma } from '@/lib/db/prisma';
import { ErrorCodes, StandardError } from '@/lib/errors';
import type { Prisma } from '@prisma/client';

export type __ENTITY__Filters = Partial<{
  search: string;
  status: string;
  category: string;
  sortBy: 'createdAt' | 'updatedAt' | 'name' | 'id';
  sortOrder: 'asc' | 'desc';
  cursor: string | null;
  limit: number;
}>;

export class __ENTITY__Service {
  // Example: cursor-based list
  async get__ENTITY__s(filters: __ENTITY__Filters = {}) {
    const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);
    const orderBy: Array<Record<string, Prisma.SortOrder>> = [
      { [filters.sortBy || 'createdAt']: (filters.sortOrder || 'desc') as Prisma.SortOrder },
    ];
    if ((filters.sortBy || 'createdAt') !== 'id') orderBy.push({ id: filters.sortOrder || 'desc' });

    const where: Prisma.Enumerable<Prisma.__ENTITY__WhereInput> | any = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        // Add entity-specific fields here
      ];
    }
    if ((filters as any).status) where.status = (filters as any).status;
    if ((filters as any).category) where.category = (filters as any).category;

    const rows = await prisma.__RESOURCE__.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const hasNext = rows.length > limit;
    const items = hasNext ? rows.slice(0, limit) : rows;
    const nextCursor = hasNext ? rows[limit - 1].id : null;
    return { items, nextCursor };
  }

  async get__ENTITY__(id: string) {
    const item = await prisma.__RESOURCE__.findUnique({
      where: { id },
      select: { id: true, name: true, status: true, createdAt: true, updatedAt: true },
    });
    if (!item) {
      throw new StandardError({
        message: '__ENTITY__ not found',
        code: ErrorCodes.DATA.NOT_FOUND,
        metadata: { component: '__ENTITY__Service', operation: 'get__ENTITY__', id },
      });
    }
    return item;
  }

  async create__ENTITY__(data: any) {
    // Add domain validations and FK checks as needed
    return prisma.__RESOURCE__.create({
      data: { ...data },
      select: { id: true, name: true, status: true, createdAt: true, updatedAt: true },
    });
  }

  async update__ENTITY__(id: string, data: any) {
    try {
      return await prisma.__RESOURCE__.update({
        where: { id },
        data: { ...data },
        select: { id: true, name: true, status: true, updatedAt: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new StandardError({
          message: '__ENTITY__ not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          cause: error,
          metadata: { component: '__ENTITY__Service', operation: 'update__ENTITY__', id },
        });
      }
      throw new StandardError({
        message: 'Failed to update __ENTITY__',
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: { component: '__ENTITY__Service', operation: 'update__ENTITY__', id },
      });
    }
  }

  async delete__ENTITY__(id: string, opts?: { deletedBy?: string }) {
    // Prefer soft-delete; adapt to your domain
    await prisma.__RESOURCE__.update({
      where: { id },
      data: { status: 'INACTIVE', deletedAt: new Date(), updatedBy: opts?.deletedBy },
    });
  }
}

// Export singleton (match existing pattern under src/lib/services)
export const __ENTITY__ServiceInstance = new __ENTITY__Service();

