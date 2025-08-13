/**
 * PosalPro MVP2 - Validation Rules API
 * Phase 9/10: Validation Dashboard & Mobile Performance Integration
 * Component Traceability Matrix: US-3.3, H8
 */

import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { ErrorHandlingService } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.3'],
  acceptanceCriteria: ['AC-3.3.1', 'AC-3.3.2'],
  methods: ['getValidationRules()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-003'],
};

interface ValidationRule {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  lastRun: Date;
  detectedIssues: number;
  performance: number;
}

/**
 * GET /api/validation/rules
 * Returns validation rules configuration for the dashboard
 */
export async function GET(request: NextRequest) {
  const errorHandlingService = ErrorHandlingService.getInstance();

  try {
    await validateApiPermission(request, { resource: 'validation', action: 'read' });
    // Simulate comprehensive validation rules
    // In production, this would query actual validation rules from the database
    const validationRules: ValidationRule[] = [
      {
        id: 'rule-001',
        name: 'Technical Configuration Validator',
        type: 'configuration',
        enabled: true,
        lastRun: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        detectedIssues: 3,
        performance: 94.2, // 94.2% accuracy
      },
      {
        id: 'rule-002',
        name: 'License Compliance Checker',
        type: 'license',
        enabled: true,
        lastRun: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        detectedIssues: 2,
        performance: 97.8, // 97.8% accuracy
      },
      {
        id: 'rule-003',
        name: 'Performance Threshold Validator',
        type: 'technical',
        enabled: true,
        lastRun: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        detectedIssues: 1,
        performance: 89.5, // 89.5% accuracy
      },
      {
        id: 'rule-004',
        name: 'Data Privacy Compliance (GDPR)',
        type: 'compliance',
        enabled: true,
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        detectedIssues: 1,
        performance: 96.1, // 96.1% accuracy
      },
      {
        id: 'rule-005',
        name: 'Integration Compatibility Validator',
        type: 'technical',
        enabled: true,
        lastRun: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        detectedIssues: 0,
        performance: 92.3, // 92.3% accuracy
      },
      {
        id: 'rule-006',
        name: 'Security Standards Compliance',
        type: 'security',
        enabled: true,
        lastRun: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        detectedIssues: 2,
        performance: 95.7, // 95.7% accuracy
      },
      {
        id: 'rule-007',
        name: 'API Documentation Validator',
        type: 'documentation',
        enabled: false, // Disabled for optimization
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        detectedIssues: 0,
        performance: 87.4, // 87.4% accuracy
      },
      {
        id: 'rule-008',
        name: 'Resource Allocation Validator',
        type: 'resource',
        enabled: true,
        lastRun: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
        detectedIssues: 1,
        performance: 91.8, // 91.8% accuracy
      },
      {
        id: 'rule-009',
        name: 'Quality Assurance Standards',
        type: 'quality',
        enabled: true,
        lastRun: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        detectedIssues: 0,
        performance: 93.6, // 93.6% accuracy
      },
      {
        id: 'rule-010',
        name: 'Deployment Readiness Checker',
        type: 'deployment',
        enabled: true,
        lastRun: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        detectedIssues: 2,
        performance: 96.9, // 96.9% accuracy
      },
    ];

    return NextResponse.json({
      success: true,
      data: validationRules,
      message: 'Validation rules retrieved successfully',
      componentMapping: COMPONENT_MAPPING,
    });
  } catch (error) {
    const processedError = errorHandlingService.processError(
      error,
      'Failed to retrieve validation rules'
    );

    return NextResponse.json(
      {
        success: false,
        error: errorHandlingService.getUserFriendlyMessage(processedError),
        componentMapping: COMPONENT_MAPPING,
      },
      { status: 500 }
    );
  }
}
