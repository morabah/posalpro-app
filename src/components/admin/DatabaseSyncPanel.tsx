/**
 * PosalPro MVP2 - Database Synchronization Component
 * 
 * Platform Engineering Best Practices:
 * - Separation of concerns: Dedicated component for database sync operations
 * - Error handling with proper UX feedback
 * - Integration with audit logging system
 * - Environment-aware operations (dev/prod detection)
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/forms/Button';
import { CloudArrowUpIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Define proper types for audit log entries
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  user: string;
  type: 'Security' | 'Config' | 'Data' | 'Error' | 'Backup';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  action: string;
  details: string;
  ipAddress: string;
}

interface DatabaseSyncPanelProps {
  className?: string;
  onSyncComplete?: (syncTime: Date) => void;
  onLogCreated?: (logEntry: AuditLogEntry) => void;
}

export default function DatabaseSyncPanel({
  className = '',
  onSyncComplete,
  onLogCreated
}: DatabaseSyncPanelProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Platform-aware environment detection
  const isProduction = process.env.NODE_ENV === 'production';

  /**
   * Initiates database synchronization from local to cloud
   * Following separation of environments best practice
   */
  const syncToCloud = useCallback(async () => {
    try {
      setIsSyncing(true);
      // Use properly typed toast API
      const toastId: string = toast.loading('Initiating database synchronization to cloud...');
      
      const response = await fetch('/api/admin/db-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          direction: 'localToCloud',
          force: false
        }),
      });
      
      // Type the response properly
      interface SyncResponse {
        success?: boolean;
        message?: string;
        error?: string;
        timestamp?: string;
      }
      
      const result = await response.json() as SyncResponse;
      void toast.dismiss(toastId);
      
      if (!response.ok) {
        throw new Error(result.error || 'Database synchronization failed');
      }
      
      // Set last sync time and call parent handlers
      const syncTime = new Date();
      setLastSyncTime(syncTime);
      
      if (onSyncComplete) {
        onSyncComplete(syncTime);
      }
      
      // Create audit log entry with proper typing
      const logEntry: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: syncTime,
        user: 'Current Admin', // Would be populated from session in production
        type: 'Data',
        severity: 'Medium',
        action: 'Database Sync',
        details: 'Local database synchronized to cloud environment',
        ipAddress: 'client',
      };
      
      if (onLogCreated) {
        onLogCreated(logEntry);
      }
      
      void toast.success('Database successfully synchronized to cloud');
    } catch (error: unknown) {
      console.error('Database sync failed:', error);
      // Properly narrow the error type for TypeScript strict mode
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      void toast.error(`Sync failed: ${errorMessage}`);
    } finally {
      setIsSyncing(false);
    }
  }, [onSyncComplete, onLogCreated]);

  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Database Synchronization</h3>
        {isProduction && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <InformationCircleIcon className="w-3 h-3 mr-1" />
            Production
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-500">
          <p>Synchronize your local database changes to the cloud environment.</p>
          <p className="mt-1">Last sync: {lastSyncTime ? lastSyncTime.toLocaleString() : 'Never'}</p>
        </div>
        
        <Button 
          variant="primary"
          size="sm"
          className="w-full flex items-center justify-center"
          onClick={syncToCloud}
          disabled={isSyncing}
        >
          <CloudArrowUpIcon className="h-4 w-4 mr-2" />
          {isSyncing ? 'Syncing...' : 'Sync to Cloud'}
        </Button>
        
        {isProduction && (
          <div className="text-xs text-amber-600 mt-2">
            <p>Note: Some sync operations may be limited in production environment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
