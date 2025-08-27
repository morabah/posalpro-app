// Database transaction patterns for customer operations
import { prisma as db } from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';

// Multi-step write with rollback safety
export async function updateCustomerWithActivity(
  customerId: string,
  updateData: any,
  activityData: any,
  userId: string
) {
  try {
    const result = await db.$transaction(async tx => {
      // Step 1: Update customer
      const customer = await tx.customer.update({
        where: { id: customerId },
        data: updateData,
        select: { id: true, name: true, status: true, updatedAt: true },
      });

      // Step 2: Create activity record
      const activity = await tx.activity.create({
        data: {
          type: 'CUSTOMER_UPDATED',
          customerId: customerId,
          userId: userId,
          payload: activityData,
          createdAt: new Date(),
        },
      });

      return { customer, activity };
    });

    logInfo('customer_transaction_success', {
      operation: 'updateCustomerWithActivity',
      customerId,
      userId,
    });

    return result;
  } catch (error) {
    logError('customer_transaction_error', {
      operation: 'updateCustomerWithActivity',
      customerId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Bulk operations with transactions
export async function bulkUpdateCustomers(customerIds: string[], updateData: any, userId: string) {
  try {
    const result = await db.$transaction(async tx => {
      // Step 1: Update all customers
      const updatedCustomers = await tx.customer.updateMany({
        where: { id: { in: customerIds } },
        data: updateData,
      });

      // Step 2: Create bulk activity record
      const activity = await tx.activity.create({
        data: {
          type: 'CUSTOMERS_BULK_UPDATED',
          userId: userId,
          payload: {
            customerIds,
            updateData,
            count: updatedCustomers.count,
          },
          createdAt: new Date(),
        },
      });

      return { updatedCustomers, activity };
    });

    logInfo('customer_bulk_transaction_success', {
      operation: 'bulkUpdateCustomers',
      customerCount: customerIds.length,
      userId,
    });

    return result;
  } catch (error) {
    logError('customer_bulk_transaction_error', {
      operation: 'bulkUpdateCustomers',
      customerCount: customerIds.length,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Complex multi-table operations
export async function createCustomerWithRelations(
  customerData: any,
  contactData: any[],
  userId: string
) {
  try {
    const result = await db.$transaction(async tx => {
      // Step 1: Create customer
      const customer = await tx.customer.create({
        data: {
          ...customerData,
          createdBy: userId,
        },
        select: { id: true, name: true, status: true, createdAt: true },
      });

      // Step 2: Create contact records
      const contacts = await Promise.all(
        contactData.map(contact =>
          tx.contact.create({
            data: {
              ...contact,
              customerId: customer.id,
              createdBy: userId,
            },
          })
        )
      );

      // Step 3: Create activity record
      const activity = await tx.activity.create({
        data: {
          type: 'CUSTOMER_CREATED',
          customerId: customer.id,
          userId: userId,
          payload: {
            customerData,
            contactCount: contacts.length,
          },
          createdAt: new Date(),
        },
      });

      return { customer, contacts, activity };
    });

    logInfo('customer_creation_transaction_success', {
      operation: 'createCustomerWithRelations',
      customerId: result.customer.id,
      contactCount: result.contacts.length,
      userId,
    });

    return result;
  } catch (error) {
    logError('customer_creation_transaction_error', {
      operation: 'createCustomerWithRelations',
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Outbox pattern for external system integration
export async function createCustomerWithOutbox(
  customerData: any,
  userId: string,
  externalSystemId: string
) {
  try {
    const idempotencyKey = crypto.randomUUID();

    const result = await db.$transaction(async tx => {
      // Step 1: Create customer
      const customer = await tx.customer.create({
        data: {
          ...customerData,
          createdBy: userId,
        },
        select: { id: true, name: true, status: true, createdAt: true },
      });

      // Step 2: Create outbox entry for external system
      const outboxEntry = await tx.outbox.create({
        data: {
          topic: 'customer_created',
          key: customer.id,
          body: JSON.stringify({
            customerId: customer.id,
            customerData,
            externalSystemId,
          }),
          idempotencyKey,
          status: 'pending',
          createdAt: new Date(),
        },
      });

      // Step 3: Create activity record
      const activity = await tx.activity.create({
        data: {
          type: 'CUSTOMER_CREATED_WITH_OUTBOX',
          customerId: customer.id,
          userId: userId,
          payload: {
            customerData,
            outboxId: outboxEntry.id,
            externalSystemId,
          },
          createdAt: new Date(),
        },
      });

      return { customer, outboxEntry, activity };
    });

    logInfo('customer_outbox_transaction_success', {
      operation: 'createCustomerWithOutbox',
      customerId: result.customer.id,
      outboxId: result.outboxEntry.id,
      userId,
    });

    return result;
  } catch (error) {
    logError('customer_outbox_transaction_error', {
      operation: 'createCustomerWithOutbox',
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Aggregation queries with transactions
export async function getCustomerStatsWithActivity(userId: string) {
  try {
    const result = await db.$transaction(async tx => {
      // Step 1: Get customer statistics
      const stats = await tx.customer.aggregate({
        _count: { id: true },
        _sum: { totalRevenue: true },
        where: { status: 'ACTIVE' },
      });

      // Step 2: Get recent activity
      const recentActivity = await tx.activity.findMany({
        where: {
          type: { in: ['CUSTOMER_CREATED', 'CUSTOMER_UPDATED', 'CUSTOMER_DELETED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          customerId: true,
          createdAt: true,
        },
      });

      return { stats, recentActivity };
    });

    logInfo('customer_stats_transaction_success', {
      operation: 'getCustomerStatsWithActivity',
      userId,
    });

    return result;
  } catch (error) {
    logError('customer_stats_transaction_error', {
      operation: 'getCustomerStatsWithActivity',
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
