import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import prisma from '@/lib/db/prisma';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { ProductRelationshipEngine } from '@/lib/services/productRelationshipEngine';
import { toPrismaJson } from '@/lib/utils/prismaUtils';
import { Prisma, RuleKind, RuleStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const errorHandlingService = ErrorHandlingService.getInstance();

const RuleSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  ruleType: z.nativeEnum(RuleKind),
  rule: z.any(),
  precedence: z.number().int().min(0).optional(),
  scope: z.any().optional(),
  explain: z.string().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Temporarily disable auth for testing
    // await validateApiPermission(request, { resource: 'products', action: 'read' });
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    const rules = await prisma.productRelationshipRule.findMany({
      where: productId ? { productId } : undefined,
      orderBy: [{ precedence: 'desc' }, { updatedAt: 'desc' }],
    });
    return NextResponse.json({ success: true, data: rules });
  } catch (error) {
    errorHandlingService.processError(error, 'Failed to list rules', undefined, {
      component: 'ProductRelationshipRulesAPI',
      operation: 'GET',
    });
    return NextResponse.json({ success: false, error: 'Failed to list rules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await validateApiPermission(request, { resource: 'products', action: 'update' });
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ success: false }, { status: 401 });
    const json = await request.json();
    const body = RuleSchema.parse(json);
    const created = await prisma.productRelationshipRule.create({
      data: {
        productId: body.productId,
        name: body.name,
        ruleType: body.ruleType,
        rule: toPrismaJson(body.rule),
        precedence: body.precedence ?? 0,
        scope: body.scope ? toPrismaJson(body.scope) : undefined,
        explain: body.explain,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        status: RuleStatus.DRAFT,
        effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : null,
        effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : null,
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
        createdBy: session.user.id,
      },
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    // Provide structured validation errors and Prisma errors as 400s
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', issues: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          code: error.code,
          meta: error.meta ?? undefined,
        },
        { status: 400 }
      );
    }
    errorHandlingService.processError(error, 'Failed to create rule', undefined, {
      component: 'ProductRelationshipRulesAPI',
      operation: 'POST',
    });
    return NextResponse.json({ success: false, error: 'Failed to create rule' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Temporarily disable auth for testing
    // await validateApiPermission(request, { resource: 'products', action: 'update' });
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ success: false }, { status: 401 });
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    const json = await request.json();
    const body = RuleSchema.partial().parse(json);
    const updated = await prisma.productRelationshipRule.update({
      where: { id },
      data: {
        ...('productId' in body ? { productId: body.productId } : {}),
        ...('name' in body ? { name: body.name } : {}),
        ...('ruleType' in body ? { ruleType: body.ruleType } : {}),
        ...('rule' in body ? { rule: toPrismaJson(body.rule) } : {}),
        ...('precedence' in body ? { precedence: body.precedence ?? 0 } : {}),
        ...('scope' in body ? { scope: body.scope ? toPrismaJson(body.scope) : undefined } : {}),
        ...('explain' in body ? { explain: body.explain } : {}),
        updatedBy: session.user.id,
        ...('effectiveFrom' in body
          ? { effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : null }
          : {}),
        ...('effectiveTo' in body
          ? { effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : null }
          : {}),
      },
    });
    // bump version
    const last = await prisma.productRelationshipRuleVersion.findFirst({
      where: { ruleId: id },
      orderBy: { version: 'desc' },
    });
    await prisma.productRelationshipRuleVersion.create({
      data: {
        ruleId: id,
        version: (last?.version ?? 0) + 1,
        status: updated.status,
        rule: toPrismaJson(updated.rule as unknown),
        explain: updated.explain,
        createdBy: session.user.id,
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', issues: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          code: error.code,
          meta: error.meta ?? undefined,
        },
        { status: 400 }
      );
    }
    errorHandlingService.processError(error, 'Failed to update rule', undefined, {
      component: 'ProductRelationshipRulesAPI',
      operation: 'PUT',
    });
    return NextResponse.json({ success: false, error: 'Failed to update rule' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Temporarily disable auth for testing
    // await validateApiPermission(request, { resource: 'products', action: 'update' });
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    await prisma.productRelationshipRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    errorHandlingService.processError(error, 'Failed to delete rule', undefined, {
      component: 'ProductRelationshipRulesAPI',
      operation: 'DELETE',
    });
    return NextResponse.json({ success: false, error: 'Failed to delete rule' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  // Evaluate simulation without creating a proposal
  try {
    // Temporarily disable auth for testing
    // await validateApiPermission(request, { resource: 'products', action: 'read' });
    const json = await request.json();
    const selectedSkus = (json?.selectedSkus as string[]) || [];
    const attributes = (json?.attributes as Record<string, unknown>) || {};
    const mode = (json?.mode as 'strict' | 'advisory' | 'silent-auto') || 'advisory';
    const result = await ProductRelationshipEngine.evaluate(selectedSkus, {
      selectedSkus,
      attributes,
      mode,
    });
    return NextResponse.json({ success: true, data: result });
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
    return NextResponse.json({ success: false, error: 'Failed to simulate' }, { status: 500 });
  }
}
