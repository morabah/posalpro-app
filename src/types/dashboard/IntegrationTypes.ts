/**
 * Integration Types and Interfaces
 * Type definitions for external integrations
 */

export interface CRMIntegration {
  type: 'salesforce' | 'hubspot' | 'pipedrive';
  connected: boolean;
  lastSync: Date;
  syncStatus: 'idle' | 'syncing' | 'error';
  dataPoints: {
    leads: number;
    opportunities: number;
    deals: number;
    contacts: number;
  };
}

export interface MarketingAutomation {
  type: 'marketo' | 'pardot' | 'mailchimp';
  connected: boolean;
  campaigns: Array<{
    id: string;
    name: string;
    status: 'active' | 'paused' | 'completed';
    performance: {
      sent: number;
      opened: number;
      clicked: number;
      converted: number;
    };
  }>;
}

export interface AutomatedReport {
  id: string;
  name: string;
  schedule: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  lastGenerated: Date;
  nextGeneration: Date;
  status: 'active' | 'paused' | 'error';
  format: 'pdf' | 'excel' | 'email';
}

