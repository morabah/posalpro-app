/**
 * Shared Proposal Types with Relations
 * Used across components that need access to proposal relations
 */

import type { Proposal } from '@/features/proposals/schemas';

// Extended Proposal type that includes relations returned by the API
export interface ProposalWithRelations extends Omit<Proposal, 'customer' | 'products'> {
  products: Array<{
    id: string;
    productId: string;
    name: string; // Add name property for compatibility
    quantity: number;
    unitPrice: number;
    total: number;
    product?: {
      id: string;
      name: string;
      category: string[];
    } | null;
  }>;
  customer: {
    id: string;
    name: string;
    email: string | null;
    industry: string | null;
  } | null;
  // Add missing properties that components expect
  teamMembers?: Array<{
    id: string;
    name: string;
    role: string;
    email?: string;
  }>;
  stage?: string;
  riskLevel?: string;
}

// Type guard to check if a proposal has relations
export function isProposalWithRelations(proposal: any): proposal is ProposalWithRelations {
  return proposal && typeof proposal === 'object' && 'products' in proposal;
}
