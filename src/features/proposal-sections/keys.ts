export const sectionKeys = {
  all: ['proposal-sections'] as const,
  byProposal: (proposalId: string) => [...sectionKeys.all, proposalId] as const,
};

