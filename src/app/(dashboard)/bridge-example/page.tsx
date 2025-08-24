import { ProposalManagementBridge } from '@/components/bridges/ProposalManagementBridge';
import { BridgeDemoStandalone } from '@/components/examples/BridgeDemoStandalone';
import { GlobalStateProvider } from '@/lib/bridges/StateBridge';

export default function BridgeExamplePage() {
  return (
    <GlobalStateProvider>
      <ProposalManagementBridge>
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto py-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Bridge Pattern Demo</h1>
              <p className="text-gray-600">
                This page demonstrates how bridge patterns work in PosalPro. Try the actions below
                to see real-time state management, event handling, and analytics tracking in action.
              </p>
            </div>

            <BridgeDemoStandalone />

            <div className="mt-8 p-6 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">What's Happening Behind the Scenes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold text-green-600 mb-2">✅ Automatic Features:</h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Error handling with user notifications</li>
                    <li>• Analytics tracking for all actions</li>
                    <li>• Real-time state synchronization</li>
                    <li>• Event-driven communication</li>
                    <li>• API response caching</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-600 mb-2">🔧 Bridge Methods Used:</h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>
                      • <code>bridge.fetchProposals()</code> - API calls
                    </li>
                    <li>
                      • <code>bridge.createProposal()</code> - Data creation
                    </li>
                    <li>
                      • <code>bridge.trackAction()</code> - Analytics
                    </li>
                    <li>
                      • <code>bridge.addNotification()</code> - User feedback
                    </li>
                    <li>
                      • <code>EventEmitters</code> - Event system
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProposalManagementBridge>
    </GlobalStateProvider>
  );
}
