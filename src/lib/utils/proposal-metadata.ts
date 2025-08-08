/**
 * PosalPro MVP2 - Proposal Metadata Utilities
 * Type-safe metadata validation and processing
 * Component Traceability: US-5.1, US-5.2, H4, H7
 */

import {
  enhancedProposalMetadataSchema,
  statusHistoryEntrySchema,
} from '@/lib/validation/schemas/proposal';
import { ProposalMetadata, ProposalStatus, StatusHistoryEntry } from '@/types/entities/proposal';

/**
 * Type guard to check if data is valid proposal metadata
 */
export function isValidProposalMetadata(data: unknown): data is ProposalMetadata {
  try {
    enhancedProposalMetadataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard to check if data is a valid status history entry
 */
export function isValidStatusHistoryEntry(data: unknown): data is StatusHistoryEntry {
  try {
    statusHistoryEntrySchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely validate and extract proposal metadata
 */
export function validateMetadata(metadata: unknown): ProposalMetadata | null {
  if (!metadata) return null;

  try {
    return enhancedProposalMetadataSchema.parse(metadata);
  } catch {
    return null;
  }
}

/**
 * Safely extract status history from metadata
 */
export function extractStatusHistory(metadata: unknown): StatusHistoryEntry[] {
  const validatedMetadata = validateMetadata(metadata);
  return validatedMetadata?.statusHistory || [];
}

/**
 * Create a new status history entry
 */
export function createStatusHistoryEntry(
  from: ProposalStatus,
  to: ProposalStatus,
  changedBy: string,
  notes?: string,
  reason?: string
): StatusHistoryEntry {
  return {
    from,
    to,
    notes,
    changedAt: new Date().toISOString(),
    changedBy,
    reason,
  };
}

/**
 * Merge existing metadata with new status history entry
 */
export function mergeMetadataWithStatusHistory(
  existingMetadata: unknown,
  newEntry: StatusHistoryEntry
): ProposalMetadata {
  const validatedMetadata = validateMetadata(existingMetadata) || { statusHistory: [] };

  return {
    ...validatedMetadata,
    statusHistory: [...validatedMetadata.statusHistory, newEntry],
    lastModifiedBy: newEntry.changedBy,
    lastModifiedAt: new Date().toISOString(),
  };
}
