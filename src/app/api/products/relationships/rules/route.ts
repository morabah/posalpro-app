import { RuleSchema } from '@/features/products/schemas';
import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logInfo } from '@/lib/logger';
import { ProductRelationshipEngine } from '@/lib/services/productRelationshipEngine';
import { toPrismaJson } from '@/lib/utils/prismaUtils';
import { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
import { RuleStatus } from '@prisma/client';
import { z } from 'zod';

const errorHandlingService = ErrorHandlingService.getInstance();

export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'manager'],
    query: z.object({
      productId: z.string().optional(),
    }),
  },
  async ({ query, user }) => {
    try {
      logInfo('Fetching product relationship rules', {
        component: 'ProductRelationshipRulesAPI',
        operation: 'GET',
        userId: user.id,
        productId: query?.productId,
      });

      const rules = await prisma.productRelationshipRule.findMany({
        where: query?.productId ? { productId: query.productId } : undefined,
        orderBy: [{ precedence: 'desc' }, { updatedAt: 'desc' }],
      });

      return ok(rules);
    } catch (error) {
      errorHandlingService.processError(error, 'Failed to list rules', undefined, {
        component: 'ProductRelationshipRulesAPI',
        operation: 'GET',
      });
      throw error;
    }
  }
);

export const POST = createRoute(
  {
    roles: ['admin', 'sales', 'manager'],
    body: RuleSchema,
  },
  async ({ body, user }) => {
    try {
      logInfo('Creating product relationship rule', {
        component: 'ProductRelationshipRulesAPI',
        operation: 'POST',
        userId: user.id,
        productId: body!.productId,
        ruleName: body!.name,
      });

      const created = await prisma.productRelationshipRule.create({
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
      });

      // Create initial version
      await prisma.productRelationshipRuleVersion.create({
        data: {
          ruleId: created.id,
          version: 1,
          status: RuleStatus.DRAFT,
          rule: toPrismaJson(created.rule as unknown),
          explain: created.explain,
          createdBy: user.id,
        },
      });

      return ok(created, 201);
    } catch (error) {
      errorHandlingService.processError(error, 'Failed to create rule', undefined, {
        component: 'ProductRelationshipRulesAPI',
        operation: 'POST',
      });
      throw error;
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
    try {
      logInfo('Updating product relationship rule', {
        component: 'ProductRelationshipRulesAPI',
        operation: 'PUT',
        userId: user.id,
        ruleId: query!.id,
      });

      const updated = await prisma.productRelationshipRule.update({
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
      });

      // bump version
      const last = await prisma.productRelationshipRuleVersion.findFirst({
        where: { ruleId: query!.id },
        orderBy: { version: 'desc' },
      });
      await prisma.productRelationshipRuleVersion.create({
        data: {
          ruleId: query!.id,
          version: (last?.version ?? 0) + 1,
          status: updated.status,
          rule: toPrismaJson(updated.rule as unknown),
          explain: updated.explain,
          createdBy: user.id,
        },
      });

      return ok(updated);
    } catch (error) {
      errorHandlingService.processError(error, 'Failed to update rule', undefined, {
        component: 'ProductRelationshipRulesAPI',
        operation: 'PUT',
      });
      throw error;
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
    try {
      logInfo('Deleting product relationship rule', {
        component: 'ProductRelationshipRulesAPI',
        operation: 'DELETE',
        userId: user.id,
        ruleId: query!.id,
      });

      await prisma.productRelationshipRule.delete({ where: { id: query!.id } });

      return ok({ message: 'Rule deleted successfully' });
    } catch (error) {
      errorHandlingService.processError(error, 'Failed to delete rule', undefined, {
        component: 'ProductRelationshipRulesAPI',
        operation: 'DELETE',
      });
      throw error;
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
    try {
      logInfo('Evaluating product configuration simulation', {
        component: 'ProductRelationshipRulesAPI',
        operation: 'PATCH',
        userId: user.id,
        selectedSkusCount: body!.selectedSkus?.length || 0,
        mode: body!.mode,
      });

      const result = await ProductRelationshipEngine.evaluate(body!.selectedSkus || [], {
        selectedSkus: body!.selectedSkus || [],
        attributes: body!.attributes || {},
        mode: body!.mode || 'advisory',
      });

      return ok(result);
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
      throw error;
    }
  }
);
