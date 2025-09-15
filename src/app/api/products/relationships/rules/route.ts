
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';

import { RuleSchema } from '@/features/products/schemas';
import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import { prisma } from '@/lib/prisma';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logInfo } from '@/lib/logger';
import { ProductRelationshipEngine } from '@/lib/services/productRelationshipEngine';
import { toPrismaJson } from '@/lib/utils/prismaUtils';
import { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
import { RuleStatus } from '@prisma/client';
import { z } from 'zod';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

export const dynamic = 'force-dynamic';

const errorHandlingService = ErrorHandlingService.getInstance();

export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'manager'],
    query: z.object({
      productId: z.string().optional(),
    }),
  },
  async ({ query, user }) => {
    const errorHandler = getErrorHandler({
      component: 'ProductRelationshipRulesAPI',
      operation: 'GET',
    });

    try {
      logInfo('Fetching product relationship rules', {
        component: 'ProductRelationshipRulesAPI',
        operation: 'GET',
        userId: user.id,
        productId: query?.productId,
      });

      const rules = await withAsyncErrorHandler(
        () =>
          prisma.productRelationshipRule.findMany({
            where: query?.productId ? { productId: query.productId } : undefined,
            orderBy: [{ precedence: 'desc' }, { updatedAt: 'desc' }],
          }),
        'Failed to fetch product relationship rules',
        { component: 'ProductRelationshipRulesAPI', operation: 'GET' }
      );

      return errorHandler.createSuccessResponse(rules, 'Product relationship rules retrieved successfully');
    } catch (error) {
      errorHandlingService.processError(error, 'Failed to list rules', undefined, {
        component: 'ProductRelationshipRulesAPI',
        operation: 'GET',
      });
      throw error; // Let the createRoute wrapper handle the response
    }
  }
);

export const POST = createRoute(
  {
    roles: ['admin', 'sales', 'manager'],
    body: RuleSchema,
  },
  async ({ body, user }) => {
    const errorHandler = getErrorHandler({
      component: 'ProductRelationshipRulesAPI',
      operation: 'POST',
    });

    try {
      logInfo('Creating product relationship rule', {
        component: 'ProductRelationshipRulesAPI',
        operation: 'POST',
        userId: user.id,
        productId: body!.productId,
        ruleName: body!.name,
      });

      const created = await withAsyncErrorHandler(
        () =>
          prisma.productRelationshipRule.create({
            data: {
              productId: body!.productId,
              name: body!.name,
              ruleType: body!.ruleType,
              rule: toPrismaJson(body!.rule),
              precedence: body!.precedence ?? 0,
              scope: body!.scope ? toPrismaJson(body!.scope) : undefined,
              explain: body!.explain,
              createdBy: user.id,
              updatedBy: user.id,
              status: RuleStatus.DRAFT,
              effectiveFrom: body!.effectiveFrom ? new Date(body!.effectiveFrom) : null,
              effectiveTo: body!.effectiveTo ? new Date(body!.effectiveTo) : null,
            },
          }),
        'Failed to create product relationship rule',
        { component: 'ProductRelationshipRulesAPI', operation: 'POST' }
      );

      // Create initial version
      await withAsyncErrorHandler(
        () =>
          prisma.productRelationshipRuleVersion.create({
            data: {
              ruleId: created.id,
              version: 1,
              status: RuleStatus.DRAFT,
              rule: toPrismaJson(created.rule as unknown),
              explain: created.explain,
              createdBy: user.id,
            },
          }),
        'Failed to create initial rule version',
        { component: 'ProductRelationshipRulesAPI', operation: 'POST' }
      );

      return errorHandler.createSuccessResponse(created, 'Product relationship rule created successfully');
    } catch (error) {
      errorHandlingService.processError(error, 'Failed to create rule', undefined, {
        component: 'ProductRelationshipRulesAPI',
        operation: 'POST',
      });
      throw error; // Let the createRoute wrapper handle the response
    }
  }
);

export const PUT = createRoute(
  {
    roles: ['admin', 'sales', 'manager'],
    query: z.object({
      id: z.string().min(1, 'Rule ID is required'),
    }),
    body: RuleSchema.partial(),
  },
  async ({ query, body, user }) => {
    const errorHandler = getErrorHandler({
      component: 'ProductRelationshipRulesAPI',
      operation: 'PUT',
    });

    try {
      logInfo('Updating product relationship rule', {
        component: 'ProductRelationshipRulesAPI',
        operation: 'PUT',
        userId: user.id,
        ruleId: query!.id,
      });

      const updated = await withAsyncErrorHandler(
        () =>
          prisma.productRelationshipRule.update({
            where: { id: query!.id },
            data: {
              ...('productId' in body! ? { productId: body!.productId } : {}),
              ...('name' in body! ? { name: body!.name } : {}),
              ...('ruleType' in body! ? { ruleType: body!.ruleType } : {}),
              ...('rule' in body! ? { rule: toPrismaJson(body!.rule) } : {}),
              ...('precedence' in body! ? { precedence: body!.precedence ?? 0 } : {}),
              ...('scope' in body!
                ? { scope: body!.scope ? toPrismaJson(body!.scope) : undefined }
                : {}),
              ...('explain' in body! ? { explain: body!.explain } : {}),
              updatedBy: user.id,
              ...('effectiveFrom' in body!
                ? { effectiveFrom: body!.effectiveFrom ? new Date(body!.effectiveFrom) : null }
                : {}),
              ...('effectiveTo' in body!
                ? { effectiveTo: body!.effectiveTo ? new Date(body!.effectiveTo) : null }
                : {}),
            },
          }),
        'Failed to update product relationship rule',
        { component: 'ProductRelationshipRulesAPI', operation: 'PUT' }
      );

      // bump version
      const last = await withAsyncErrorHandler(
        () =>
          prisma.productRelationshipRuleVersion.findFirst({
            where: { ruleId: query!.id },
            orderBy: { version: 'desc' },
          }),
        'Failed to find last rule version',
        { component: 'ProductRelationshipRulesAPI', operation: 'PUT' }
      );

      await withAsyncErrorHandler(
        () =>
          prisma.productRelationshipRuleVersion.create({
            data: {
              ruleId: query!.id,
              version: (last?.version ?? 0) + 1,
              status: updated.status,
              rule: toPrismaJson(updated.rule as unknown),
              explain: updated.explain,
              createdBy: user.id,
            },
          }),
        'Failed to create new rule version',
        { component: 'ProductRelationshipRulesAPI', operation: 'PUT' }
      );

      return errorHandler.createSuccessResponse(updated, 'Product relationship rule updated successfully');
    } catch (error) {
      errorHandlingService.processError(error, 'Failed to update rule', undefined, {
        component: 'ProductRelationshipRulesAPI',
        operation: 'PUT',
      });
      throw error; // Let the createRoute wrapper handle the response
    }
  }
);

export const DELETE = createRoute(
  {
    roles: ['admin', 'sales', 'manager'],
    query: z.object({
      id: z.string().min(1, 'Rule ID is required'),
    }),
  },
  async ({ query, user }) => {
    const errorHandler = getErrorHandler({
      component: 'ProductRelationshipRulesAPI',
      operation: 'DELETE',
    });

    try {
      logInfo('Deleting product relationship rule', {
        component: 'ProductRelationshipRulesAPI',
        operation: 'DELETE',
        userId: user.id,
        ruleId: query!.id,
      });

      await withAsyncErrorHandler(
        () => prisma.productRelationshipRule.delete({ where: { id: query!.id } }),
        'Failed to delete product relationship rule',
        { component: 'ProductRelationshipRulesAPI', operation: 'DELETE' }
      );

      return errorHandler.createSuccessResponse(
        { message: 'Rule deleted successfully' },
        'Product relationship rule deleted successfully'
      );
    } catch (error) {
      errorHandlingService.processError(error, 'Failed to delete rule', undefined, {
        component: 'ProductRelationshipRulesAPI',
        operation: 'DELETE',
      });
      throw error; // Let the createRoute wrapper handle the response
    }
  }
);

export const PATCH = createRoute(
  {
    roles: ['admin', 'sales', 'manager'],
    body: z.object({
      selectedSkus: z.array(z.string()).optional().default([]),
      attributes: z.record(z.unknown()).optional().default({}),
      mode: z.enum(['strict', 'advisory', 'silent-auto']).optional().default('advisory'),
    }),
  },
  async ({ body, user }) => {
    const errorHandler = getErrorHandler({
      component: 'ProductRelationshipRulesAPI',
      operation: 'PATCH',
    });

    try {
      logInfo('Evaluating product configuration simulation', {
        component: 'ProductRelationshipRulesAPI',
        operation: 'PATCH',
        userId: user.id,
        selectedSkusCount: body!.selectedSkus?.length || 0,
        mode: body!.mode,
      });

      const result = await withAsyncErrorHandler(
        () =>
          ProductRelationshipEngine.evaluate(body!.selectedSkus || [], {
            selectedSkus: body!.selectedSkus || [],
            attributes: body!.attributes || {},
            mode: body!.mode || 'advisory',
          }),
        'Failed to simulate product configuration',
        { component: 'ProductRelationshipRulesAPI', operation: 'PATCH' }
      );

      return errorHandler.createSuccessResponse(result, 'Product configuration simulation completed successfully');
    } catch (error) {
      errorHandlingService.processError(
        error,
        'Failed to simulate product configuration',
        undefined,
        {
          component: 'ProductRelationshipRulesAPI',
          operation: 'PATCH',
        }
      );
      throw error; // Let the createRoute wrapper handle the response
    }
  }
);
