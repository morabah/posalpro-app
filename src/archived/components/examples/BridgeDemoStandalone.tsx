'use client';

import { useProposalBridge } from '@/components/bridges/ProposalManagementBridge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { EventEmitters, useEventBridge } from '@/lib/bridges/EventBridge';
import { useProposalState, useUIState } from '@/lib/bridges/StateBridge';
import { useCallback, useEffect, useState } from 'react';

/**
 * Standalone Bridge Demo - No API Required
 *
 * This component demonstrates bridge functionality without requiring
 * actual API calls. It shows state management, event handling, and
 * analytics tracking in action.
 */

export function BridgeDemoStandalone() {
  const bridge = useProposalBridge();
  const uiState = useUIState();
  const proposalState = useProposalState();
  const eventBridge = useEventBridge();

  // Local demo state
  const [demoProposals, setDemoProposals] = useState([
    { id: '1', title: 'Demo Proposal 1', client: 'Demo Client A', status: 'active' },
    { id: '2', title: 'Demo Proposal 2', client: 'Demo Client B', status: 'draft' },
    { id: '3', title: 'Demo Proposal 3', client: 'Demo Client C', status: 'submitted' },
  ]);
  const [actionLog, setActionLog] = useState<string[]>([]);

  // Add action to log
  const addToLog = useCallback((action: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActionLog(prev => [`[${timestamp}] ${action}`, ...prev.slice(0, 9)]);
  }, []);

  // Demo: Load proposals (simulated)
  const loadProposals = useCallback(async () => {
    addToLog('Loading proposals...');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    addToLog('Proposals loaded successfully');
    bridge.trackAction('proposals_loaded', { count: demoProposals.length });

    bridge.addNotification({
      type: 'success',
      message: `Loaded ${demoProposals.length} proposals`,
    });
  }, [demoProposals.length, bridge, addToLog]);

  // Demo: Create proposal (simulated)
  const createProposal = useCallback(async () => {
    addToLog('Creating new proposal...');

    const newProposal = {
      id: Date.now().toString(),
      title: `Demo Proposal ${demoProposals.length + 1}`,
      client: `Demo Client ${String.fromCharCode(65 + demoProposals.length)}`,
      status: 'draft' as const,
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    setDemoProposals(prev => [...prev, newProposal]);

    addToLog(`Proposal created: ${newProposal.title}`);
    bridge.trackAction('proposal_created', {
      proposalId: newProposal.id,
      title: newProposal.title,
    });

    bridge.addNotification({
      type: 'success',
      message: 'Proposal created successfully!',
    });

    // Emit event for other components
    EventEmitters.proposal.created(newProposal.id, {
      ...newProposal,
      priority: 'medium',
      dueDate: new Date().toISOString(),
    });
  }, [demoProposals.length, bridge, addToLog]);

  // Demo: Toggle theme
  const toggleTheme = useCallback(() => {
    const newTheme = uiState.theme === 'light' ? 'dark' : 'light';
    addToLog(`Theme changed: ${uiState.theme} → ${newTheme}`);

    bridge.trackAction('theme_toggled', { from: uiState.theme, to: newTheme });
    EventEmitters.ui.themeChanged(newTheme);
  }, [uiState.theme, bridge, addToLog]);

  // Demo: Toggle sidebar
  const toggleSidebar = useCallback(() => {
    addToLog(`Sidebar toggled: ${uiState.sidebarCollapsed ? 'expanded' : 'collapsed'}`);

    bridge.toggleSidebar();
    bridge.trackAction('sidebar_toggled', {
      from: uiState.sidebarCollapsed,
      to: !uiState.sidebarCollapsed,
    });
  }, [uiState.sidebarCollapsed, bridge, addToLog]);

  // Demo: Change filters
  const changeFilters = useCallback(
    (filterType: string, value: string) => {
      const newFilters = { ...proposalState.filters, [filterType]: value };
      addToLog(`Filter changed: ${filterType} = ${value}`);

      bridge.setFilters(newFilters);
      bridge.trackAction('filter_changed', { filterType, value });
    },
    [proposalState.filters, bridge, addToLog]
  );

  // Demo: Add notification
  const addDemoNotification = useCallback(
    (type: 'info' | 'success' | 'warning' | 'error') => {
      const messages = {
        info: 'This is an informational message',
        success: 'Operation completed successfully!',
        warning: 'Please review your input',
        error: 'Something went wrong, please try again',
      };

      addToLog(`Notification added: ${type}`);

      bridge.addNotification({
        type,
        message: messages[type],
      });

      bridge.trackAction('notification_added', { type });
    },
    [bridge, addToLog]
  );

  // Subscribe to events
  useEffect(() => {
    const proposalCreatedListener = eventBridge.subscribe(
      'PROPOSAL_CREATED',
      payload => {
        addToLog(`Event received: PROPOSAL_CREATED (${payload.proposalId})`);
      },
      { component: 'BridgeDemoStandalone' }
    );

    const themeChangedListener = eventBridge.subscribe(
      'THEME_CHANGED',
      payload => {
        addToLog(`Event received: THEME_CHANGED (${payload.theme})`);
      },
      { component: 'BridgeDemoStandalone' }
    );

    return () => {
      eventBridge.unsubscribe('PROPOSAL_CREATED', proposalCreatedListener);
      eventBridge.unsubscribe('THEME_CHANGED', themeChangedListener);
    };
  }, [eventBridge]); // Removed addToLog to prevent infinite loop

  // Track page view
  useEffect(() => {
    bridge.trackPageView('bridge_demo_standalone');
    addToLog('Page view tracked: bridge_demo_standalone');
  }, []); // Empty dependency array to run only once

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">🔗 Bridge Pattern Demo</h1>
        <p className="text-gray-600 mb-6">
          This demo shows bridge functionality in action. Try the buttons below to see real-time
          state management, event handling, and analytics tracking.
        </p>

        {/* Current State Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800">UI State</h3>
            <p className="text-sm">
              Theme: <span className="font-mono">{uiState.theme}</span>
            </p>
            <p className="text-sm">
              Sidebar:{' '}
              <span className="font-mono">
                {uiState.sidebarCollapsed ? 'Collapsed' : 'Expanded'}
              </span>
            </p>
            <p className="text-sm">
              Notifications: <span className="font-mono">{uiState.notifications.length}</span>
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800">Proposal State</h3>
            <p className="text-sm">
              Filters:{' '}
              <span className="font-mono">{Object.keys(proposalState.filters).length}</span>
            </p>
            <p className="text-sm">
              Selected: <span className="font-mono">{proposalState.selectedIds.length}</span>
            </p>
            <p className="text-sm">
              Sort:{' '}
              <span className="font-mono">{Object.keys(proposalState.sortConfig).length}</span>
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-800">Demo Data</h3>
            <p className="text-sm">
              Proposals: <span className="font-mono">{demoProposals.length}</span>
            </p>
            <p className="text-sm">
              Actions: <span className="font-mono">{actionLog.length}</span>
            </p>
            <p className="text-sm">
              Events: <span className="font-mono">Active</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">API Operations (Simulated)</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={loadProposals} variant="outline">
                📥 Load Proposals
              </Button>
              <Button onClick={createProposal} variant="outline">
                ➕ Create Proposal
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">UI Operations</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={toggleTheme} variant="outline">
                🎨 Toggle Theme ({uiState.theme})
              </Button>
              <Button onClick={toggleSidebar} variant="outline">
                📋 Toggle Sidebar ({uiState.sidebarCollapsed ? '→' : '←'})
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Filter Operations</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => changeFilters('status', 'active')} variant="outline" size="sm">
                Filter: Active
              </Button>
              <Button onClick={() => changeFilters('priority', 'high')} variant="outline" size="sm">
                Filter: High Priority
              </Button>
              <Button onClick={() => bridge.setFilters({})} variant="outline" size="sm">
                Clear Filters
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Notification Operations</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => addDemoNotification('info')} variant="outline" size="sm">
                ℹ️ Info
              </Button>
              <Button onClick={() => addDemoNotification('success')} variant="outline" size="sm">
                ✅ Success
              </Button>
              <Button onClick={() => addDemoNotification('warning')} variant="outline" size="sm">
                ⚠️ Warning
              </Button>
              <Button onClick={() => addDemoNotification('error')} variant="outline" size="sm">
                ❌ Error
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Proposals List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Demo Proposals ({demoProposals.length})</h2>
        <div className="space-y-2">
          {demoProposals.map(proposal => (
            <div
              key={proposal.id}
              className="p-3 border rounded-lg flex justify-between items-center"
            >
              <div>
                <strong>{proposal.title}</strong>
                <span className="text-gray-500 ml-2">- {proposal.client}</span>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  proposal.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : proposal.status === 'draft'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-100 text-blue-800'
                }`}
              >
                {proposal.status}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Log */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Action Log (Real-time)</h2>
        <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
          {actionLog.length === 0 ? (
            <p className="text-gray-500 text-sm">No actions yet. Try the buttons above!</p>
          ) : (
            <div className="space-y-1">
              {actionLog.map((action, index) => (
                <div key={index} className="text-sm font-mono text-gray-700">
                  {action}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Notifications Display */}
      {uiState.notifications.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Notifications</h2>
          <div className="space-y-2">
            {uiState.notifications.slice(-3).map(notification => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg ${
                  notification.type === 'error'
                    ? 'bg-red-100 text-red-800'
                    : notification.type === 'success'
                      ? 'bg-green-100 text-green-800'
                      : notification.type === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                }`}
              >
                <div className="font-semibold capitalize">{notification.type}</div>
                <div className="text-sm">{notification.message}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
