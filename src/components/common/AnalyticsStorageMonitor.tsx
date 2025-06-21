/**
 * PosalPro MVP2 - Analytics Storage Monitor
 * Component to monitor and manage analytics storage health
 */

'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { AlertTriangle, CheckCircle, Database, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface StorageInfo {
  eventCount: number;
  hasUser: boolean;
  storageSize: number;
}

export const AnalyticsStorageMonitor: React.FC = () => {
  const { getStorageInfo, clearStorage } = useAnalytics();
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    eventCount: 0,
    hasUser: false,
    storageSize: 0,
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateStorageInfo = () => {
      setStorageInfo(getStorageInfo());
    };

    updateStorageInfo();
    const interval = setInterval(updateStorageInfo, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [getStorageInfo]);

  const handleClearStorage = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all analytics data? This action cannot be undone.'
      )
    ) {
      clearStorage();
      setStorageInfo(getStorageInfo());
    }
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Analytics Storage</span>
            {storageInfo.storageSize < 500000 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {showDetails ? 'Hide' : 'Show'}
          </button>
        </div>

        {showDetails && (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-gray-600">
              <div>Events: {storageInfo.eventCount}</div>
              <div>Size: {Math.round(storageInfo.storageSize / 1024)} KB</div>
              <div
                className={`font-medium ${storageInfo.storageSize < 500000 ? 'text-green-600' : 'text-yellow-600'}`}
              >
                Status: {storageInfo.storageSize < 500000 ? 'Healthy' : 'Needs Cleanup'}
              </div>
            </div>

            {storageInfo.storageSize >= 500000 && (
              <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                Storage is getting full. Consider clearing old data.
              </div>
            )}

            <button
              onClick={handleClearStorage}
              className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear Storage</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
