'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useApiClient } from '@/hooks/useApiClient';
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import React, { ReactNode, useEffect, useState } from 'react';

interface WizardSummaryProps {
  wizardData: any;
  teamAssignments: any;
  contentSelections: any[];
  validationData: any;
  analyticsData: any;
  crossStepValidation: any;
  assignedTo?: Array<{ id: string; name: string; email: string }>; // ✅ ADDED: Use existing resolved data
}

interface User {
  id: string;
  name: string;
  email: string;
}

export const WizardSummary: React.FC<WizardSummaryProps> = ({
  wizardData,
  teamAssignments,
  contentSelections,
  validationData,
  analyticsData,
  crossStepValidation,
  assignedTo = [], // ✅ ADDED: Use existing resolved data
}): ReactNode => {
  const apiClient = useApiClient();
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // ✅ ENHANCED: Use existing resolved data instead of fetching separately
  useEffect(() => {
    if (!teamAssignments) {
      setLoading(false);
      return;
    }

    const userIds = [
      teamAssignments.teamLead,
      teamAssignments.salesRepresentative,
      ...Object.values(teamAssignments.subjectMatterExperts || {}),
    ].filter(Boolean);

    if (userIds.length === 0) {
      setLoading(false);
      return;
    }

    // ✅ FOLLOWING CORE_REQUIREMENTS.md: Use existing resolved data first
    const nameMap: Record<string, string> = {};

    // Map from assignedTo data (already resolved)
    assignedTo.forEach(user => {
      nameMap[user.id] = user.name;
    });

    // For any remaining IDs not found in assignedTo, use fallback
    userIds.forEach(userId => {
      if (!nameMap[userId]) {
        nameMap[userId] = userId.length > 20 ? `User ${userId.substring(0, 8)}...` : `User ${userId}`;
      }
    });

    console.log('🔍 [WizardSummary] Using resolved data:', {
      userIds,
      assignedTo: assignedTo.map(u => ({ id: u.id, name: u.name })),
      nameMap
    });

    setUserNames(nameMap);
    setLoading(false);
  }, [teamAssignments, assignedTo]); // ✅ FIXED: Stable dependencies

  const getUserDisplayName = (userId: string) => {
    if (userNames[userId]) {
      return userNames[userId];
    }
    // Fallback to truncated ID if name not found
    return userId.length > 20 ? `User ${userId.substring(0, 8)}...` : userId;
  };

  if (
    !wizardData &&
    !teamAssignments &&
    !contentSelections &&
    !validationData &&
    !analyticsData &&
    !crossStepValidation
  ) {
    return null;
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-500" />
        Wizard Summary
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1: Basic Information */}
        {wizardData?.step1 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <BuildingOfficeIcon className="h-4 w-4 mr-2 text-blue-500" />
              Basic Information
            </h3>
            <div className="space-y-2 text-sm">
              {wizardData.step1.client?.name && (
                <div>
                  <span className="font-medium">Client:</span>
                  <span className="ml-1 text-gray-600">{wizardData.step1.client.name}</span>
                </div>
              )}
              {wizardData.step1.client?.industry && (
                <div>
                  <span className="font-medium">Industry:</span>
                  <span className="ml-1 text-gray-600">{wizardData.step1.client.industry}</span>
                </div>
              )}
              {wizardData.step1.details?.priority && (
                <div>
                  <span className="font-medium">Priority:</span>
                  <Badge variant="secondary" className="ml-1">
                    {wizardData.step1.details.priority}
                  </Badge>
                </div>
              )}
              {wizardData.step1.details?.dueDate && (
                <div>
                  <span className="font-medium">Due Date:</span>
                  <span className="ml-1 text-gray-600">
                    {new Date(wizardData.step1.details.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Team Assignments */}
        {teamAssignments && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <UserGroupIcon className="h-4 w-4 mr-2 text-green-500" />
              Team Assignments
            </h3>
            <div className="space-y-2 text-sm">
              {teamAssignments.teamLead && (
                <div>
                  <span className="font-medium">Team Lead:</span>
                  <span className="ml-1 text-gray-600">
                    {loading ? 'Loading...' : getUserDisplayName(teamAssignments.teamLead)}
                  </span>
                </div>
              )}
              {teamAssignments.salesRepresentative && (
                <div>
                  <span className="font-medium">Sales Rep:</span>
                  <span className="ml-1 text-gray-600">
                    {loading
                      ? 'Loading...'
                      : getUserDisplayName(teamAssignments.salesRepresentative)}
                  </span>
                </div>
              )}
              {teamAssignments.subjectMatterExperts &&
                Object.keys(teamAssignments.subjectMatterExperts).length > 0 && (
                  <div>
                    <span className="font-medium">SMEs:</span>
                    <div className="ml-2 mt-1">
                      {Object.entries(teamAssignments.subjectMatterExperts).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          {key}:{' '}
                          {typeof value === 'string'
                            ? value.length > 20
                              ? `User ${value.substring(0, 8)}...`
                              : value
                            : String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Step 3: Content Selections */}
        {contentSelections && contentSelections.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <DocumentTextIcon className="h-4 w-4 mr-2 text-purple-500" />
              Content Selections
            </h3>
            <div className="space-y-2 text-sm">
              {contentSelections.map((content, index) => (
                <div key={index}>
                  <div className="font-medium">{content.section}</div>
                  {content.contentId && (
                    <div className="text-xs text-gray-500">ID: {content.contentId}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Step 4: Selected Products */}
        {wizardData?.step4?.products && wizardData.step4.products.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <ShoppingCartIcon className="h-4 w-4 mr-2 text-orange-500" />
              Selected Products
            </h3>
            <div className="space-y-2 text-sm">
              {wizardData.step4.products.map((product: any, index: number) => (
                <div key={index}>
                  <span className="font-medium">Product {index + 1}:</span>
                  <span className="ml-1 text-gray-600">
                    Qty: {product.quantity} x ${product.unitPrice}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Validation Results */}
        {validationData && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <ShieldCheckIcon className="h-4 w-4 mr-2 text-red-500" />
              Validation Results
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Status:</span>
                <Badge
                  variant={validationData.isValid ? 'default' : 'destructive'}
                  className="ml-1"
                >
                  {validationData.isValid ? 'Valid' : 'Invalid'}
                </Badge>
              </div>
              {validationData.completeness !== undefined && (
                <div>
                  <span className="font-medium">Completeness:</span>
                  <span className="ml-1 text-gray-600">{validationData.completeness}%</span>
                </div>
              )}
              {validationData.issues && (
                <div>
                  <span className="font-medium">Issues:</span>
                  <span className="ml-1 text-gray-600">{validationData.issues.length}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics */}
        {analyticsData && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <ChartBarIcon className="h-4 w-4 mr-2 text-indigo-500" />
              Analytics
            </h3>
            <div className="space-y-2 text-sm">
              {analyticsData.wizardCompletionRate !== undefined && (
                <div>
                  <span className="font-medium">Completion Rate:</span>
                  <span className="ml-1 text-gray-600">
                    {Math.round(analyticsData.wizardCompletionRate * 100)}%
                  </span>
                </div>
              )}
              {analyticsData.complexityScore !== undefined && (
                <div>
                  <span className="font-medium">Complexity:</span>
                  <span className="ml-1 text-gray-600">{analyticsData.complexityScore}/5</span>
                </div>
              )}
              {analyticsData.teamSize !== undefined && (
                <div>
                  <span className="font-medium">Team Size:</span>
                  <span className="ml-1 text-gray-600">{analyticsData.teamSize}</span>
                </div>
              )}
              {analyticsData.contentSuggestionsUsed !== undefined && (
                <div>
                  <span className="font-medium">Content Used:</span>
                  <span className="ml-1 text-gray-600">{analyticsData.contentSuggestionsUsed}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cross-Step Validation */}
      {crossStepValidation && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 flex items-center mb-3">
            <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
            Cross-Step Validation
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(crossStepValidation).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2 text-sm">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
