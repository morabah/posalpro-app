// Transaction Template for Migration from Bridge Pattern
// Multi-step writes with rollback safety and idempotency

import { db } from '@/lib/db';

// ====================
// Basic Transaction Pattern
// ====================

export async function update__ENTITY__WithActivity(id: string, data: any, activityType: string) {
  return await db.$transaction(async tx => {
    const updated = await tx.__RESOURCE__.update({
      where: { id },
      data,
    });

    await tx.activity.create({
      data: {
        type: activityType,
        __RESOURCE__Id: id,
        payload: data,
        createdAt: new Date(),
      },
    });

    return updated;
  });
}

// ====================
// External System Integration (Outbox Pattern)
// ====================

export async function create__ENTITY__WithOutbox(data: any) {
  const idemKey = crypto.randomUUID();

  return await db.$transaction(async tx => {
    const created = await tx.__RESOURCE__.create({ data });

    await tx.outbox.create({
      data: {
        topic: '__RESOURCE___created',
        key: created.id,
        body: JSON.stringify(created),
        idemKey,
      },
    });

    return created;
  });
}

// ====================
// Bulk Operations with Transactions
// ====================

export async function bulkUpdate__ENTITY__s(ids: string[], data: any, activityType: string) {
  return await db.$transaction(async tx => {
    const updated = await tx.__RESOURCE__.updateMany({
      where: { id: { in: ids } },
      data,
    });

    // Create activity records for each updated item
    await Promise.all(
      ids.map(id =>
        tx.activity.create({
          data: {
            type: activityType,
            __RESOURCE__Id: id,
            payload: data,
            createdAt: new Date(),
          },
        })
      )
    );

    return updated;
  });
}

// ====================
// Complex Multi-Table Operations
// ====================

export async function transfer__ENTITY__Ownership(
  __RESOURCE__Id: string,
  newOwnerId: string,
  transferReason: string
) {
  return await db.$transaction(async tx => {
    // Update the __RESOURCE__ owner
    const updated__ENTITY__ = await tx.__RESOURCE__.update({
      where: { id: __RESOURCE__Id },
      data: { ownerId: newOwnerId },
    });

    // Create ownership transfer record
    await tx.ownershipTransfer.create({
      data: {
        __RESOURCE__Id,
        previousOwnerId: updated__ENTITY__.ownerId,
        newOwnerId,
        reason: transferReason,
        transferredAt: new Date(),
      },
    });

    // Create activity record
    await tx.activity.create({
      data: {
        type: 'OWNERSHIP_TRANSFERRED',
        __RESOURCE__Id,
        payload: {
          previousOwnerId: updated__ENTITY__.ownerId,
          newOwnerId,
          reason: transferReason,
        },
        createdAt: new Date(),
      },
    });

    return updated__ENTITY__;
  });
}
