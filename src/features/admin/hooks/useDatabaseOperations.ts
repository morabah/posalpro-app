/**
 * PosalPro MVP2 - Admin Database Operations Hook
 * Feature-based database operations using React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Feature-based imports
import { adminService } from '@/services/adminService';
import { qk } from '@/features/admin/keys';
import { logDebug, logInfo, logError } from '@/lib/logger';

// Types
export interface DatabaseStatus {
  isOnline: boolean;
  latency: number;
  health: string;
  timestamp: string;
}

export interface DatabaseSyncData {
  itemsSynced: number;
  conflicts: number;
  errors: string[];
}

export interface DatabaseBackupData {
  backupId: string;
  size: number;
  timestamp: string;
}

/**
 * Hook for fetching database status
 */
export function useAdminDatabaseStatus() {
  const query = useQuery({
    queryKey: qk.admin.database.status,
    queryFn: async (): Promise<DatabaseStatus> => {
      logDebug('Fetching database status', {
        component: 'useAdminDatabaseStatus',
        operation: 'fetch',
      });

      const result = await adminService.getDatabaseStatus();

      if (!result.ok) {
        throw new Error(result.message || 'Failed to fetch database status');
      }

      logInfo('Database status fetched successfully', {
        component: 'useAdminDatabaseStatus',
        operation: 'fetch',
      });

      return result.data || {
        isOnline: false,
        latency: 0,
        health: 'unknown',
        timestamp: new Date().toISOString(),
      };
    },
    staleTime: 15000,
    gcTime: 60000,
    refetchOnWindowFocus: false,
    refetchInterval: 30000,
    retry: 2,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for database synchronization
 */
export function useDatabaseSync() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      logDebug('Starting database sync', {
        component: 'useDatabaseSync',
        operation: 'sync',
      });

      const result = await adminService.syncDatabase({ 
        direction: 'bidirectional',
        includeConflictDetection: true,
        generateReport: false
      });

      if (!result.ok) {
        throw new Error(result.message || 'Failed to sync database');
      }

      logInfo('Database sync completed successfully', {
        component: 'useDatabaseSync',
        operation: 'sync',
      });

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.database.status });
    },
  });

  return {
    sync: mutation.mutateAsync,
    isSyncing: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook for database backup
 */
export function useDatabaseBackup() {
  const mutation = useMutation({
    mutationFn: async () => {
      logDebug('Starting database backup', {
        component: 'useDatabaseBackup',
        operation: 'backup',
      });

      // Note: backupDatabase method not implemented in adminService yet
      throw new Error('Database backup functionality not yet implemented');
    },
  });

  return {
    backup: mutation.mutateAsync,
    isBackingUp: mutation.isPending,
    error: mutation.error,
  };
}
