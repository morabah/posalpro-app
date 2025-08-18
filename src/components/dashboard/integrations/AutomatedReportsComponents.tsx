/**
 * Automated Reports Components
 * Automated report generation and scheduling
 */

import { memo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import {
  DocumentChartBarIcon,
  ClockIcon,
  EnvelopeIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { AutomatedReport } from '@/types/dashboard';

// Automated Reports Manager
export const AutomatedReportsManager = memo(
  ({
    reports,
    onCreateReport,
    onEditReport,
    onDeleteReport,
    onToggleReport
  }: {
    reports: AutomatedReport[];
    onCreateReport: () => void;
    onEditReport: (reportId: string) => void;
    onDeleteReport: (reportId: string) => void;
    onToggleReport: (reportId: string) => void;
  }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active':
          return 'text-green-600 bg-green-50 border-green-200';
        case 'inactive':
          return 'text-gray-600 bg-gray-50 border-gray-200';
        case 'error':
          return 'text-red-600 bg-red-50 border-red-200';
        default:
          return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'active':
          return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
        case 'inactive':
          return <ClockIcon className="h-4 w-4 text-gray-500" />;
        case 'error':
          return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
        default:
          return <ClockIcon className="h-4 w-4 text-gray-500" />;
      }
    };

    const getFrequencyLabel = (frequency: string) => {
      switch (frequency) {
        case 'daily':
          return 'Daily';
        case 'weekly':
          return 'Weekly';
        case 'monthly':
          return 'Monthly';
        case 'quarterly':
          return 'Quarterly';
        default:
          return frequency;
      }
    };

    const getFormatIcon = (format: string) => {
      switch (format) {
        case 'pdf':
          return <DocumentChartBarIcon className="h-4 w-4" />;
        case 'excel':
          return <DocumentChartBarIcon className="h-4 w-4" />;
        case 'email':
          return <EnvelopeIcon className="h-4 w-4" />;
        default:
          return <DocumentChartBarIcon className="h-4 w-4" />;
      }
    };

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Automated Reports</h3>
            <p className="text-sm text-gray-600">Schedule and manage automated report generation</p>
          </div>
          <button
            onClick={onCreateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Report
          </button>
        </div>

        <div className="space-y-4">
          {reports.map(report => (
            <div
              key={report.id}
              className={`p-4 border rounded-lg ${getStatusColor(report.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getStatusIcon(report.status)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{report.name}</h4>
                    <p className="text-sm text-gray-600">{report.description}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {getFrequencyLabel(report.frequency)}
                      </span>
                      <span className="flex items-center">
                        {getFormatIcon(report.format)}
                        <span className="ml-1 uppercase">{report.format}</span>
                      </span>
                      <span>Recipients: {report.recipients.length}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onToggleReport(report.id)}
                    className={`px-3 py-1.5 text-sm rounded-md ${
                      report.status === 'active'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {report.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => onEditReport(report.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteReport(report.id)}
                    className="p-1.5 text-red-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-500">Last Generated:</span>
                  <div className="font-medium">{report.lastGenerated || 'Never'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Next Run:</span>
                  <div className="font-medium">{report.nextRun || 'Not scheduled'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Success Rate:</span>
                  <div className="font-medium">{report.successRate || 0}%</div>
                </div>
                <div>
                  <span className="text-gray-500">Total Runs:</span>
                  <div className="font-medium">{report.totalRuns || 0}</div>
                </div>
              </div>

              {report.error && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  Error: {report.error}
                </div>
              )}
            </div>
          ))}

          {reports.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <DocumentChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No automated reports configured</p>
              <p className="text-sm">Create your first automated report schedule</p>
            </div>
          )}
        </div>
      </Card>
    );
  }
);

AutomatedReportsManager.displayName = 'AutomatedReportsManager';

// Report Configuration Modal
export const ReportConfigurationModal = memo(
  ({
    isOpen,
    onClose,
    report,
    onSave
  }: {
    isOpen: boolean;
    onClose: () => void;
    report?: AutomatedReport;
    onSave: (config: Partial<AutomatedReport>) => void;
  }) => {
    const [config, setConfig] = useState({
      name: report?.name || '',
      description: report?.description || '',
      frequency: report?.frequency || 'weekly',
      format: report?.format || 'pdf',
      recipients: report?.recipients || [],
      schedule: report?.schedule || {
        dayOfWeek: 1,
        time: '09:00',
        timezone: 'UTC',
      },
      dataSources: report?.dataSources || [],
      filters: report?.filters || {},
    });

    const [newRecipient, setNewRecipient] = useState('');

    if (!isOpen) return null;

    const addRecipient = () => {
      if (newRecipient && !config.recipients.includes(newRecipient)) {
        setConfig({
          ...config,
          recipients: [...config.recipients, newRecipient],
        });
        setNewRecipient('');
      }
    };

    const removeRecipient = (email: string) => {
      setConfig({
        ...config,
        recipients: config.recipients.filter(r => r !== email),
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {report ? 'Edit Report' : 'Create Automated Report'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Name
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
                  Frequency
                </label>
                <select
                  value={config.frequency}
                  onChange={(e) => setConfig({ ...config, frequency: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <select
                  value={config.format}
                  onChange={(e) => setConfig({ ...config, format: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={config.schedule.time}
                  onChange={(e) => setConfig({
                    ...config,
                    schedule: { ...config.schedule, time: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipients
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="email"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                />
                <button
                  type="button"
                  onClick={addRecipient}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="space-y-1">
                {config.recipients.map((email, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{email}</span>
                    <button
                      type="button"
                      onClick={() => removeRecipient(email)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
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
                {report ? 'Update' : 'Create'} Report
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
);

ReportConfigurationModal.displayName = 'ReportConfigurationModal';

// Report Execution History
export const ReportExecutionHistory = memo(
  ({
    reportId,
    executions
  }: {
    reportId: string;
    executions: Array<{
      id: string;
      timestamp: string;
      status: 'success' | 'failed' | 'running';
      duration: number;
      error?: string;
    }>;
  }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'success':
          return 'text-green-600 bg-green-50';
        case 'failed':
          return 'text-red-600 bg-red-50';
        case 'running':
          return 'text-yellow-600 bg-yellow-50';
        default:
          return 'text-gray-600 bg-gray-50';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'success':
          return <CheckCircleIcon className="h-4 w-4" />;
        case 'failed':
          return <ExclamationTriangleIcon className="h-4 w-4" />;
        case 'running':
          return <ClockIcon className="h-4 w-4 animate-spin" />;
        default:
          return <ClockIcon className="h-4 w-4" />;
      }
    };

    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Execution History</h3>

        <div className="space-y-3">
          {executions.map(execution => (
            <div
              key={execution.id}
              className={`p-3 border rounded-lg ${getStatusColor(execution.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(execution.status)}
                  <div>
                    <div className="font-medium capitalize">{execution.status}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(execution.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {execution.duration}ms
                </div>
              </div>

              {execution.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {execution.error}
                </div>
              )}
            </div>
          ))}

          {executions.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No execution history available
            </div>
          )}
        </div>
      </Card>
    );
  }
);

ReportExecutionHistory.displayName = 'ReportExecutionHistory';


