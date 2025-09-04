'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useEffect, useState } from 'react';

// Bridge imports
import { useProposalBridge } from '@/components/bridges/ProposalManagementBridge';
import { EventEmitters, useEventBridge } from '@/lib/bridges/EventBridge';
import { useUIState } from '@/lib/bridges/StateBridge';

/**
 * Quick Bridge Example - Minimal Integration
 *
 * This component shows the minimal changes needed to start using bridges
 * in your existing code. It demonstrates:
 *
 * 1. Using bridge for API calls
 * 2. Using bridge for state management
 * 3. Using bridge for event handling
 * 4. Using bridge for analytics tracking
 */

export function QuickBridgeExample() {
  // Bridge hooks
  const bridge = useProposalBridge();
  const uiState = useUIState();
  const eventBridge = useEventBridge();

  // Local state (you can keep this for component-specific state)
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load proposals using bridge (replaces useApiClient)
  const loadProposals = async () => {
    setLoading(true);
    try {
      const result = await bridge.fetchProposals({ page: 1, limit: 10 });
      if ((result as any).success) {
        const resultData = result as any;
        setProposals(resultData.data?.proposals || []);
        // Track the action
        bridge.trackAction('proposals_loaded', { count: resultData.data?.proposals?.length || 0 });
      } else {
        // Use bridge for error handling
        bridge.addNotification({
          type: 'error',
          message: 'Failed to load proposals',
        });
      }
    } catch (error) {
      bridge.addNotification({
        type: 'error',
        message: 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create proposal using bridge
  const createProposal = async () => {
    try {
      const result = await bridge.createProposal({
        title: 'Quick Example Proposal',
        client: 'Example Client',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if ((result as any).success) {
        bridge.addNotification({
          type: 'success',
          message: 'Proposal created successfully!',
        });
        // Refresh the list
        loadProposals();
      }
    } catch (error) {
      bridge.addNotification({
        type: 'error',
        message: 'Failed to create proposal',
      });
    }
  };

  // Toggle theme using bridge
  const toggleTheme = () => {
    const newTheme = uiState.theme === 'light' ? 'dark' : 'light';
    bridge.trackAction('theme_toggled', { from: uiState.theme, to: newTheme });
    EventEmitters.ui.themeChanged(newTheme);
  };

  // Subscribe to events for automatic updates
  useEffect(() => {
    const proposalCreatedListener = eventBridge.subscribe(
      'PROPOSAL_CREATED',
      payload => {
        console.log('New proposal created:', payload.proposalId);
        // Automatically refresh the list
        loadProposals();
      },
      { component: 'QuickBridgeExample' }
    );

    return () => {
      eventBridge.unsubscribe('PROPOSAL_CREATED', proposalCreatedListener);
    };
  }, [eventBridge, loadProposals]);

  // Load initial data and track page view
  useEffect(() => {
    loadProposals();
    bridge.trackPageView('quick_bridge_example');
  }, [loadProposals, bridge]);

  return (
    <div className="p-6 space-y-4">
      <Card className="p-4">
        <h2 className="text-xl font-bold mb-4">Quick Bridge Example</h2>

        {/* Current state from bridge */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Current Bridge State:</h3>
          <p>Theme: {uiState.theme}</p>
          <p>Sidebar: {uiState.sidebarCollapsed ? 'Collapsed' : 'Expanded'}</p>
          <p>Notifications: {uiState.notifications.length}</p>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 mb-4">
          <Button onClick={loadProposals} disabled={loading}>
            {loading ? 'Loading...' : 'Load Proposals'}
          </Button>
          <Button onClick={createProposal} variant="outline">
            Create Proposal
          </Button>
          <Button onClick={toggleTheme} variant="outline">
            Toggle Theme ({uiState.theme})
          </Button>
        </div>

        {/* Proposals list */}
        <div className="space-y-2">
          <h3 className="font-semibold">Proposals ({proposals.length}):</h3>
          {proposals.map((proposal: any) => (
            <div key={proposal.id} className="p-2 border rounded">
              <strong>{proposal.title}</strong> - {proposal.client}
            </div>
          ))}
        </div>

        {/* Recent notifications */}
        {uiState.notifications.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Recent Notifications:</h3>
            <div className="space-y-1">
              {uiState.notifications.slice(-3).map(notification => (
                <div
                  key={notification.id}
                  className={`p-2 rounded text-sm ${
                    notification.type === 'error'
                      ? 'bg-red-100 text-red-800'
                      : notification.type === 'success'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {notification.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * Usage Instructions:
 *
 * 1. Wrap this component with bridge providers:
 *
 * ```tsx
 * import { GlobalStateProvider } from '@/lib/bridges/StateBridge';
 * import { ProposalManagementBridge } from '@/components/bridges/ProposalManagementBridge';
 *
 * function App() {
 *   return (
 *     <GlobalStateProvider>
 *       <ProposalManagementBridge>
 *         <QuickBridgeExample />
 *       </ProposalManagementBridge>
 *     </GlobalStateProvider>
 *   );
 * }
 * ```
 *
 * 2. Key benefits you get automatically:
 *    - Centralized error handling with user-friendly notifications
 *    - Analytics tracking for all actions
 *    - Real-time updates when proposals are created elsewhere
 *    - Global state management for theme, sidebar, etc.
 *    - Event-driven communication between components
 *
 * 3. Minimal code changes:
 *    - Replace useApiClient with useProposalBridge
 *    - Replace console.error with bridge.addNotification
 *    - Add bridge.trackAction for analytics
 *    - Subscribe to events for real-time updates
 */
