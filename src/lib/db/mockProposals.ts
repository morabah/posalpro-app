/**
 * PosalPro MVP2 - Mock Proposals Database
 * Shared in-memory database for proposal data during development
 * In production, this would be replaced with actual database operations
 */

// Shared mock database instance
class MockProposalsDB {
  private static instance: MockProposalsDB;
  private proposals = new Map<string, any>();

  private constructor() {}

  public static getInstance(): MockProposalsDB {
    if (!MockProposalsDB.instance) {
      MockProposalsDB.instance = new MockProposalsDB();
    }
    return MockProposalsDB.instance;
  }

  // Create proposal
  create(id: string, proposal: any): void {
    this.proposals.set(id, proposal);
    console.log(`[MockDB] Created proposal: ${id} - ${proposal.title}`);
  }

  // Get proposal by ID
  get(id: string): any | null {
    const proposal = this.proposals.get(id);
    if (proposal) {
      console.log(`[MockDB] Retrieved proposal: ${id} - ${proposal.title}`);
    } else {
      console.log(`[MockDB] Proposal not found: ${id}`);
    }
    return proposal || null;
  }

  // Update proposal
  update(id: string, updates: any): any | null {
    const existing = this.proposals.get(id);
    if (!existing) {
      console.log(`[MockDB] Cannot update - proposal not found: ${id}`);
      return null;
    }

    const updated = { ...existing, ...updates };
    this.proposals.set(id, updated);
    console.log(`[MockDB] Updated proposal: ${id} - ${updated.title}`);
    return updated;
  }

  // Delete proposal
  delete(id: string): boolean {
    const deleted = this.proposals.delete(id);
    if (deleted) {
      console.log(`[MockDB] Deleted proposal: ${id}`);
    } else {
      console.log(`[MockDB] Cannot delete - proposal not found: ${id}`);
    }
    return deleted;
  }

  // Get all proposals
  getAll(): any[] {
    const proposals = Array.from(this.proposals.values());
    console.log(`[MockDB] Retrieved ${proposals.length} proposals`);
    return proposals;
  }

  // Filter proposals
  filter(predicate: (proposal: any) => boolean): any[] {
    const all = this.getAll();
    const filtered = all.filter(predicate);
    console.log(`[MockDB] Filtered ${filtered.length} proposals from ${all.length} total`);
    return filtered;
  }

  // Clear all proposals (for testing)
  clear(): void {
    this.proposals.clear();
    console.log(`[MockDB] Cleared all proposals`);
  }

  // Get count
  count(): number {
    return this.proposals.size;
  }
}

// Export singleton instance
export const mockProposalsDB = MockProposalsDB.getInstance();

// Generate mock proposal ID
export const generateProposalId = () =>
  `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Export for testing
export { MockProposalsDB };
