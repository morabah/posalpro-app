/**
 * CRM Integration Components
 * External CRM system integration and data synchronization
 */

import { memo, useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CRMIntegration } from '@/types/dashboard';

// CRM Integration Panel
export const CRMIntegrationPanel = memo(
  ({
    integrations,
    onSync,
    onConfigure
  }: {
    integrations: CRMIntegration[];
    onSync: (integrationId: string) => void;
    onConfigure: (integrationId: string) => void;
  }) => {
    const [syncing, setSyncing] = useState<string | null>(null);

    const handleSync = async (integrationId: string) => {
      setSyncing(integrationId);
      try {
        await onSync(integrationId);
      } finally {
        setSyncing(null);
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'connected':
          return 'text-green-600 bg-green-50 border-green-200';
        case 'disconnected':
          return 'text-red-600 bg-red-50 border-red-200';
        case 'syncing':
          return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        default:
          return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'connected':
          return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
        case 'disconnected':
          return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
        case 'syncing':
          return <ArrowPathIcon className="h-5 w-5 text-yellow-500 animate-spin" />;
        default:
          return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
      }
    };

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">CRM Integrations</h3>
            <p className="text-sm text-gray-600">Connect and sync with external CRM systems</p>
          </div>
          <button
            onClick={() => onConfigure('new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Integration
          </button>
        </div>

        <div className="space-y-4">
          {integrations.map(integration => (
            <div
              key={integration.id}
              className={`p-4 border rounded-lg ${getStatusColor(integration.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getStatusIcon(integration.status)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{integration.name}</h4>
                    <p className="text-sm text-gray-600">{integration.type}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>Last sync: {integration.lastSync}</span>
                      <span>Records: {integration.recordCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSync(integration.id)}
                    disabled={syncing === integration.id}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {syncing === integration.id ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      'Sync Now'
                    )}
                  </button>
                  <button
                    onClick={() => onConfigure(integration.id)}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Configure
                  </button>
                </div>
              </div>

              {integration.error && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  Error: {integration.error}
                </div>
              )}
            </div>
          ))}

          {integrations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No CRM integrations configured</p>
              <p className="text-sm">Connect your CRM system to sync customer data</p>
            </div>
          )}
        </div>
      </Card>
    );
  }
);

CRMIntegrationPanel.displayName = 'CRMIntegrationPanel';

// CRM Data Sync Status
export const CRMDataSyncStatus = memo(
  ({
    syncStatus,
    lastSyncTime,
    nextSyncTime,
    recordCount
  }: {
    syncStatus: 'syncing' | 'completed' | 'failed' | 'pending';
    lastSyncTime: string;
    nextSyncTime: string;
    recordCount: number;
  }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'syncing':
          return 'text-yellow-600 bg-yellow-50';
        case 'completed':
          return 'text-green-600 bg-green-50';
        case 'failed':
          return 'text-red-600 bg-red-50';
        case 'pending':
          return 'text-gray-600 bg-gray-50';
        default:
          return 'text-gray-600 bg-gray-50';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'syncing':
          return <ArrowPathIcon className="h-4 w-4 animate-spin" />;
        case 'completed':
          return <CheckCircleIcon className="h-4 w-4" />;
        case 'failed':
          return <ExclamationTriangleIcon className="h-4 w-4" />;
        case 'pending':
          return <ArrowPathIcon className="h-4 w-4" />;
        default:
          return <ArrowPathIcon className="h-4 w-4" />;
      }
    };

    return (
      <div className={`p-3 rounded-lg border ${getStatusColor(syncStatus)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(syncStatus)}
            <span className="text-sm font-medium capitalize">{syncStatus}</span>
          </div>
          <div className="text-xs text-gray-500">
            {recordCount.toLocaleString()} records
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          <div>Last sync: {lastSyncTime}</div>
          <div>Next sync: {nextSyncTime}</div>
        </div>
      </div>
    );
  }
);

CRMDataSyncStatus.displayName = 'CRMDataSyncStatus';

// CRM Configuration Modal
export const CRMConfigurationModal = memo(
  ({
    isOpen,
    onClose,
    integration,
    onSave
  }: {
    isOpen: boolean;
    onClose: () => void;
    integration?: CRMIntegration;
    onSave: (config: Partial<CRMIntegration>) => void;
  }) => {
    const [config, setConfig] = useState({
      name: integration?.name || '',
      type: integration?.type || 'salesforce',
      apiKey: integration?.apiKey || '',
      apiSecret: integration?.apiSecret || '',
      baseUrl: integration?.baseUrl || '',
      syncInterval: integration?.syncInterval || 3600,
    });

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {integration ? 'Edit CRM Integration' : 'Add CRM Integration'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            onSave(config);
            onClose();
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Integration Name
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CRM Type
                </label>
                <select
                  value={config.type}
                  onChange={(e) => setConfig({ ...config, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="salesforce">Salesforce</option>
                  <option value="hubspot">HubSpot</option>
                  <option value="pipedrive">Pipedrive</option>
                  <option value="zoho">Zoho CRM</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Secret
                </label>
                <input
                  type="password"
                  value={config.apiSecret}
                  onChange={(e) => setConfig({ ...config, apiSecret: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base URL
                </label>
                <input
                  type="url"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="https://api.example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sync Interval (seconds)
                </label>
                <input
                  type="number"
                  value={config.syncInterval}
                  onChange={(e) => setConfig({ ...config, syncInterval: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="300"
                  max="86400"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {integration ? 'Update' : 'Add'} Integration
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
);

CRMConfigurationModal.displayName = 'CRMConfigurationModal';






