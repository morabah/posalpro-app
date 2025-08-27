/**
 * PosalPro MVP2 - Infinite Proposals List Example
 * Demonstrates usage of infinite query hooks with the InfiniteScrollList component
 * Shows proper implementation of infinite scrolling with filters and search
 */

import React, { useState, useMemo } from 'react';
import { useInfiniteProposals } from '@/hooks/useInfiniteProposals';
import { InfiniteScrollList } from '@/components/ui/InfiniteScrollList';

interface ProposalItemProps {
  id: string;
  title: string;
  status: string;
  priority: string;
  value: number;
  createdAt: string;
  customerId?: string;
  assignedTo?: string;
}

export function InfiniteProposalsList() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');

  // Debounced search to avoid excessive API calls
  const debouncedSearch = useMemo(() => {
    const timeoutId = setTimeout(() => search, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const proposalsQuery = useInfiniteProposals({
    search: search,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    status: status || undefined,
    priority: priority || undefined,
  });

  const renderProposalItem = (proposal: ProposalItemProps, index: number) => (
    <div className="border rounded-lg p-4 mb-3 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-gray-900">{proposal.title}</h3>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
            proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {proposal.status}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            proposal.priority === 'high' ? 'bg-red-100 text-red-800' :
            proposal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {proposal.priority}
          </span>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>Value: ${proposal.value.toLocaleString()}</span>
        <span>Created: {new Date(proposal.createdAt).toLocaleDateString()}</span>
      </div>
      
      {proposal.assignedTo && (
        <div className="mt-2 text-sm text-gray-500">
          Assigned to: {proposal.assignedTo}
        </div>
      )}
    </div>
  );

  const loadingComponent = (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Loading proposals...</span>
    </div>
  );

  const errorComponent = (
    <div className="flex items-center justify-center py-8 text-red-600">
      <span>Failed to load proposals. Please try again.</span>
    </div>
  );

  const emptyComponent = (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span>No proposals found</span>
      {(search || status || priority) && (
        <button 
          onClick={() => {
            setSearch('');
            setStatus('');
            setPriority('');
          }}
          className="mt-2 text-blue-600 hover:text-blue-800 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Proposals</h1>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search proposals..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Infinite Scroll List */}
      <InfiniteScrollList
        query={proposalsQuery}
        renderItem={renderProposalItem}
        loadingComponent={loadingComponent}
        errorComponent={errorComponent}
        emptyComponent={emptyComponent}
        className="space-y-3"
        loadMoreThreshold={300}
      />
    </div>
  );
}
