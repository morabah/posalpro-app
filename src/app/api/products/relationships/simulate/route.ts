import { NextRequest, NextResponse } from 'next/server';
import { ProductRelationshipsSimulateSchema } from '@/features/products/schemas';
import { z } from 'zod';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';

import { ProductRelationshipEngine } from '@/lib/services/productRelationshipEngine';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { ErrorCodes, StandardError } from '@/lib/errors';

const errorHandlingService = ErrorHandlingService.getInstance();

// Request body schema coming from ProductSimulator (centralized)
const BodySchema = ProductRelationshipsSimulateSchema;

// Map engine actions to frontend simulator shape
function mapEngineToSimulatorShape(
  engineResult: Awaited<ReturnType<typeof ProductRelationshipEngine.evaluate>>,
  mode: 'validate' | 'simulate'
) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  for (const a of engineResult.actions) {
    switch (a.type) {
      case 'exclude': {
        if (a.level === 'block') {
          errors.push(`Incompatible with selection: ${a.sku}${a.reason ? ` — ${a.reason}` : ''}`);
        } else {
          warnings.push(`Potential incompatibility: ${a.sku}${a.reason ? ` — ${a.reason}` : ''}`);
        }
        break;
      }
      case 'require': {
        const qty = a.quantity != null ? ` x${a.quantity}` : '';
        warnings.push(`Requires ${a.sku}${qty}${a.reason ? ` — ${a.reason}` : ''}`);
        break;
      }
      case 'choose': {
        warnings.push(
          `Selection required for ${a.group}: choose one of [${a.options.join(', ')}]${a.reason ? ` — ${a.reason}` : ''}`
        );
        break;
      }
      case 'add': {
        // Treat auto-adds as recommendations in simulator UI
        recommendations.push(`Add ${a.sku}${a.reason ? ` — ${a.reason}` : ''}`);
        break;
      }
      case 'recommend': {
        recommendations.push(`Consider ${a.sku}${a.reason ? ` — ${a.reason}` : ''}`);
        break;
      }
    }
  }

  // If user chose "simulate", we still apply same validity logic; recommendations are displayed
  const valid = errors.length === 0;

  return { valid, errors, warnings, recommendations };
}

export async function POST(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'ProductRelationshipsSimulateAPI',
    operation: 'POST',
  });

  try {
    // Enforce permissions similar to rules API (read permission sufficient for simulation)
    await validateApiPermission(request, { resource: 'products', action: 'read' });

    const json = await withAsyncErrorHandler(
      () => request.json(),
      'Failed to parse request body',
      { component: 'ProductRelationshipsSimulateAPI', operation: 'POST' }
    );
    const { skus, mode, attributes } = BodySchema.parse(json);

    // Map simulator modes to engine modes
    const engineMode: 'strict' | 'advisory' | 'silent-auto' = mode === 'validate' ? 'strict' : 'advisory';

    const engineResult = await withAsyncErrorHandler(
      () =>
        ProductRelationshipEngine.evaluate(skus, {
          selectedSkus: skus,
          attributes: attributes || {},
          mode: engineMode,
        }),
      'Failed to evaluate product relationships',
      { component: 'ProductRelationshipsSimulateAPI', operation: 'POST' }
    );

    const mapped = mapEngineToSimulatorShape(engineResult, mode);

    return errorHandler.createSuccessResponse(
      mapped,
      'Product relationships simulated successfully'
    );
  } catch (error) {
    // Handle specialized ZodError with detailed validation feedback
    if (error instanceof z.ZodError) {
      const validationError = new StandardError({
        message: 'Validation error',
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        cause: error,
        metadata: {
          component: 'ProductRelationshipsSimulateAPI',
          operation: 'POST',
          validationErrors: error.issues,
        },
      });

      const errorResponse = errorHandler.createErrorResponse(
        validationError,
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400
      );
      return errorResponse;
    }

    // Handle all other errors with the generic error handler
    const systemError = errorHandlingService.processError(
      error,
      'Failed to simulate product relationships',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      {
        component: 'ProductRelationshipsSimulateAPI',
        operation: 'POST',
      }
    );

    const errorResponse = errorHandler.createErrorResponse(
      systemError,
      'Failed to simulate product relationships',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500
    );
    return errorResponse;
  }
}
