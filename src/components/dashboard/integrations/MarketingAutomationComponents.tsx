/**
 * Marketing Automation Components
 * Marketing automation platform integration and campaign management
 */

import { memo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import {
  MegaphoneIcon,
  EnvelopeIcon,
  ChartBarIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  CursorArrowRaysIcon
} from '@heroicons/react/24/outline';
import { MarketingAutomation } from '@/types/dashboard';

const numberFormatter = new Intl.NumberFormat('en-US');

// Marketing Automation Dashboard
export const MarketingAutomationDashboard = memo(
  ({
    campaigns,
    onStartCampaign,
    onPauseCampaign,
    onStopCampaign
  }: {
    campaigns: MarketingAutomation[];
    onStartCampaign: (campaignId: string) => void;
    onPauseCampaign: (campaignId: string) => void;
    onStopCampaign: (campaignId: string) => void;
  }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active':
          return 'text-green-600 bg-green-50 border-green-200';
        case 'paused':
          return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'stopped':
          return 'text-red-600 bg-red-50 border-red-200';
        case 'draft':
          return 'text-gray-600 bg-gray-50 border-gray-200';
        default:
          return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'active':
          return <PlayIcon className="h-4 w-4 text-green-500" />;
        case 'paused':
          return <PauseIcon className="h-4 w-4 text-yellow-500" />;
        case 'stopped':
          return <StopIcon className="h-4 w-4 text-red-500" />;
        case 'draft':
          return <EyeIcon className="h-4 w-4 text-gray-500" />;
        default:
          return <EyeIcon className="h-4 w-4 text-gray-500" />;
      }
    };

    const getActionButton = (campaign: MarketingAutomation) => {
      switch (campaign.status) {
        case 'draft':
          return (
            <button
              onClick={() => onStartCampaign(campaign.id)}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Start
            </button>
          );
        case 'active':
          return (
            <button
              onClick={() => onPauseCampaign(campaign.id)}
              className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Pause
            </button>
          );
        case 'paused':
          return (
            <button
              onClick={() => onStartCampaign(campaign.id)}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Resume
            </button>
          );
        default:
          return null;
      }
    };

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Marketing Automation</h3>
            <p className="text-sm text-gray-600">Campaign management and automation workflows</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Create Campaign
          </button>
        </div>

        <div className="space-y-4">
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              className={`p-4 border rounded-lg ${getStatusColor(campaign.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getStatusIcon(campaign.status)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                    <p className="text-sm text-gray-600">{campaign.type}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>Recipients: {numberFormatter.format(campaign.recipientCount)}</span>
                      <span>Open Rate: {campaign.openRate}%</span>
                      <span>Click Rate: {campaign.clickRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {getActionButton(campaign)}
                  {campaign.status !== 'stopped' && (
                    <button
                      onClick={() => onStopCampaign(campaign.id)}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Stop
                    </button>
                  )}
                  <button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                    View
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-gray-500">Sent:</span>
                  <span className="ml-1 font-medium">{numberFormatter.format(campaign.sentCount)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Opened:</span>
                  <span className="ml-1 font-medium">{numberFormatter.format(campaign.openedCount)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Clicked:</span>
                  <span className="ml-1 font-medium">{numberFormatter.format(campaign.clickedCount)}</span>
                </div>
              </div>
            </div>
          ))}

          {campaigns.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MegaphoneIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No marketing campaigns configured</p>
              <p className="text-sm">Create your first automated marketing campaign</p>
            </div>
          )}
        </div>
      </Card>
    );
  }
);

MarketingAutomationDashboard.displayName = 'MarketingAutomationDashboard';

// Campaign Performance Metrics
export const CampaignPerformanceMetrics = memo(
  ({
    campaign
  }: {
    campaign: MarketingAutomation;
  }) => {
    const metrics = [
      {
        label: 'Open Rate',
        value: `${campaign.openRate}%`,
        icon: <EyeIcon className="h-4 w-4" />,
        color: 'text-blue-600',
      },
      {
        label: 'Click Rate',
        value: `${campaign.clickRate}%`,
        icon: <CursorArrowRaysIcon className="h-4 w-4" />,
        color: 'text-green-600',
      },
      {
        label: 'Conversion Rate',
        value: `${campaign.conversionRate || 0}%`,
        icon: <ChartBarIcon className="h-4 w-4" />,
        color: 'text-purple-600',
      },
      {
        label: 'Revenue Generated',
        value: `$${numberFormatter.format(campaign.revenueGenerated || 0)}`,
        icon: <EnvelopeIcon className="h-4 w-4" />,
        color: 'text-orange-600',
      },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className={`${metric.color}`}>
                {metric.icon}
              </div>
              <span className="text-lg font-semibold">{metric.value}</span>
            </div>
            <div className="text-sm text-gray-600">{metric.label}</div>
          </div>
        ))}
      </div>
    );
  }
);

CampaignPerformanceMetrics.displayName = 'CampaignPerformanceMetrics';

// Automation Workflow Builder
export const AutomationWorkflowBuilder = memo(
  ({
    onSave
  }: {
    onSave: (workflow: any) => void;
  }) => {
    const [workflow, setWorkflow] = useState({
      name: '',
      trigger: 'email_open',
      actions: [],
    });

    const triggers = [
      { value: 'email_open', label: 'Email Opened' },
      { value: 'email_click', label: 'Email Clicked' },
      { value: 'form_submit', label: 'Form Submitted' },
      { value: 'page_visit', label: 'Page Visit' },
      { value: 'time_delay', label: 'Time Delay' },
    ];

    const actions = [
      { value: 'send_email', label: 'Send Email' },
      { value: 'add_tag', label: 'Add Tag' },
      { value: 'remove_tag', label: 'Remove Tag' },
      { value: 'update_field', label: 'Update Field' },
      { value: 'add_to_list', label: 'Add to List' },
    ];

    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Automation Workflow Builder</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workflow Name
            </label>
            <input
              type="text"
              value={workflow.name}
              onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Enter workflow name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trigger
            </label>
            <select
              value={workflow.trigger}
              onChange={(e) => setWorkflow({ ...workflow, trigger: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {triggers.map(trigger => (
                <option key={trigger.value} value={trigger.value}>
                  {trigger.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actions
            </label>
            <div className="space-y-2">
              {workflow.actions.map((action, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <select
                    value={action.type}
                    onChange={(e) => {
                      const newActions = [...workflow.actions];
                      newActions[index] = { ...action, type: e.target.value };
                      setWorkflow({ ...workflow, actions: newActions });
                    }}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  >
                    {actions.map(actionType => (
                      <option key={actionType.value} value={actionType.value}>
                        {actionType.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const newActions = workflow.actions.filter((_, i) => i !== index);
                      setWorkflow({ ...workflow, actions: newActions });
                    }}
                    className="px-2 py-2 text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  setWorkflow({
                    ...workflow,
                    actions: [...workflow.actions, { type: 'send_email', config: {} }],
                  });
                }}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Action
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => onSave(workflow)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Workflow
            </button>
          </div>
        </div>
      </Card>
    );
  }
);

AutomationWorkflowBuilder.displayName = 'AutomationWorkflowBuilder';





