/**
 * Real-time Updates Components
 * Live data updates and WebSocket simulation
 */

import { memo, useEffect, useState } from 'react';

interface RealTimeUpdate {
  type: string;
  timestamp: string;
  data: {
    metrics?: {
      totalRevenue?: number;
      winRate?: number;
      activeProposals?: number;
    };
    alerts?: Array<{
      id: number;
      type: string;
      message: string;
      timestamp: string;
    }>;
  };
}

// Real-time Updates Hook
export const useRealTimeUpdates = (enabled: boolean, onDataUpdate: (data: RealTimeUpdate) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!enabled) return;

    // Simulate WebSocket connection
    const interval = setInterval(() => {
      setIsConnected(true);
      setLastUpdate(new Date());

      // Simulate real-time data updates
      const mockUpdate: RealTimeUpdate = {
        type: 'dashboard_update',
        timestamp: new Date().toISOString(),
        data: {
          metrics: {
            totalRevenue: Math.floor(Math.random() * 1000000) + 2000000,
            winRate: Math.floor(Math.random() * 20) + 80,
            activeProposals: Math.floor(Math.random() * 50) + 100,
          },
          alerts: [
            {
              id: Date.now(),
              type: 'info',
              message: 'New high-value proposal received',
              timestamp: new Date().toISOString(),
            },
          ],
        },
      };

      onDataUpdate(mockUpdate);
    }, 30000); // Update every 30 seconds

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [enabled, onDataUpdate]);

  return { isConnected, lastUpdate };
};

// Live Updates Indicator
export const LiveUpdatesIndicator = memo(
  ({ isConnected, lastUpdate }: { isConnected: boolean; lastUpdate: Date }) => {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <div
          className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
        ></div>
        <span className={isConnected ? 'text-green-600' : 'text-gray-500'}>
          {isConnected ? 'Live' : 'Offline'}
        </span>
        <span className="text-gray-400">Last update: {lastUpdate.toLocaleTimeString()}</span>
      </div>
    );
  }
);

LiveUpdatesIndicator.displayName = 'LiveUpdatesIndicator';
