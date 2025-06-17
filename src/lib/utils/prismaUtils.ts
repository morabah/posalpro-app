/**
 * PosalPro MVP2 - Prisma Utility Functions
 * Helper functions for working with Prisma types
 */

import { Prisma } from '@prisma/client';

/**
 * Safely converts a Record<string, unknown> to Prisma.InputJsonValue
 * Handles the TypeScript type compatibility issues with Prisma JSON fields
 * 
 * @param data Any object that needs to be stored in a Prisma JSON field
 * @returns The same data but with the correct Prisma.InputJsonValue type
 */
export function toPrismaJson<T>(data: T): Prisma.InputJsonValue {
  return data as unknown as Prisma.InputJsonValue;
}

/**
 * Safely converts a Prisma JSON value back to a specific TypeScript type
 * 
 * @param jsonData Data retrieved from a Prisma JSON field
 * @returns The data cast to the specified type
 */
export function fromPrismaJson<T>(jsonData: Prisma.JsonValue | null | undefined): T | undefined {
  if (jsonData === null || jsonData === undefined) {
    return undefined;
  }
  return jsonData as unknown as T;
}

/**
 * Type guard to check if an object is a valid JSON object
 * Useful for validating data before storing in Prisma JSON fields
 * 
 * @param value Value to check
 * @returns Boolean indicating if the value is a valid JSON object
 */
export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Safely handles RelationshipCondition and other complex types for Prisma JSON fields
 * 
 * @param condition The condition object to convert
 * @returns A Prisma-compatible JSON value
 */
export function relationshipConditionToPrisma(
  condition: Record<string, unknown> | undefined
): Prisma.InputJsonValue | undefined {
  if (!condition) {
    return undefined;
  }
  return toPrismaJson(condition);
}
