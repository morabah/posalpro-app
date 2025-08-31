/**
 * Proposal API Formatter
 * Utility to format Prisma Proposal objects into the application's ProposalData type.
 */

import type { ProposalData } from '@/lib/entities/proposal';
import { Priority, ProposalStatus } from '@/types/enums';
import type { Customer, CustomerContact, Proposal, User } from '@prisma/client';

// This is the type of the proposal object returned by Prisma when including relations
export type PrismaProposalWithRelations = Proposal & {
  creator: User;
  assignedTo: User[];
  customer: Customer & {
    contacts: CustomerContact[];
  };
};

export function formatProposal(proposal: PrismaProposalWithRelations): ProposalData {
  const primaryContact =
    proposal.customer.contacts.find(c => c.isPrimary) || proposal.customer.contacts[0];

  return {
    id: proposal.id,
    title: proposal.title,
    description: proposal.description ?? '',
    customerId: proposal.customerId,
    customerName: proposal.customer.name,
    customerContact: {
      name: primaryContact.name,
      email: primaryContact.email,
      phone: primaryContact.phone ?? undefined,
    },
    projectType: proposal.projectType as ProposalData['projectType'],
    estimatedValue: Number(proposal.value ?? 0),
    currency: proposal.currency,
    deadline: proposal.dueDate ?? new Date(),
    priority: proposal.priority as Priority,
    tags: proposal.tags,
    status: proposal.status as ProposalStatus,
    createdBy: proposal.creator.id,
    assignedTo: proposal.assignedTo.map(a => a.id),
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
    submittedAt: proposal.submittedAt ?? undefined,
    approvedAt: proposal.approvedAt ?? undefined,
    version: proposal.version,
  };
}
