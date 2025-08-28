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

interface WizardStep1 {
  client?: { name?: string; industry?: string };
  details?: { priority?: string; dueDate?: string | number | Date };
}

interface WizardStep3 {
  selectedContent?: RawContent[];
}

interface WizardData {
  step1?: WizardStep1 & {
    value?: number; // Estimated value from step 1
  };
  step3?: WizardStep3;
  // Enhanced step4 with actual product details
  step4?: {
    products?: Array<{
      id: string;
      name: string;
      quantity?: number;
      unitPrice?: number;
      totalPrice?: number;
      category?: string;
      included?: boolean;
    }>;
    totalValue?: number; // Actual calculated value from step 4
  };
  step5?: {
    sections?: Array<{ title?: string; description?: string }>;
  };
}

interface TeamAssignments {
  teamLead?: string;
  salesRepresentative?: string;
  subjectMatterExperts?: Record<string, string>;
}

interface RawContent {
  item?: { id?: string; title?: string };
  contentId?: string;
  id?: string;
  title?: string;
  section?: string;
  assignedTo?: string;
}

interface ValidationData {
  isValid?: boolean;
  completeness?: number;
  issues?: unknown[];
}

interface AnalyticsData {
  wizardCompletionRate?: number;
  complexityScore?: number;
  teamSize?: number;
  contentSuggestionsUsed?: number;
}

interface WizardSummaryProps {
  wizardData?: WizardData | null;
  teamAssignments?: TeamAssignments | null;
  contentSelections: RawContent[];
  validationData?: ValidationData | null;
  analyticsData?: AnalyticsData | null;
  crossStepValidation?: Record<string, unknown> | null;
  assignedTo?: Array<{ id: string; name: string; email: string }>;
}



export const WizardSummary: React.FC<WizardSummaryProps> = ({
  wizardData = null,
  teamAssignments = null,
  contentSelections,
  validationData = null,
  analyticsData = null,
  crossStepValidation = null,
  assignedTo = [], // ✅ ADDED: Use existing resolved data
}): ReactNode => {
  const apiClient = useApiClient();
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Normalize and dedupe content selections
  interface ContentItem {
    id?: string;
    title?: string;
    section?: string;
    assignedTo?: string;
  }

  const rawSelections: ContentItem[] = (wizardData?.step3?.selectedContent?.length
    ? wizardData.step3.selectedContent
    : contentSelections ?? [])
    .map((c: RawContent) => ({
      id: c?.item?.id || c?.contentId || c?.id,
      title: c?.item?.title || c?.title || c?.section,
      section: c?.section,
      assignedTo: c?.assignedTo,
    }));

  const dedupedSelections = (() => {
    const map = new Map<string, { item: ContentItem; count: number; assignees: Set<string> }>();
    for (const c of rawSelections) {
      // Prefer grouping by title+section when available to avoid visual duplicates with different IDs
      const titleKey = (c.title ?? '').trim();
      const sectionKey = (c.section ?? '').trim();
      const key = (titleKey && sectionKey) ? `${titleKey}::${sectionKey}` : (c.id || `${titleKey}::${sectionKey}`);
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        if (c.assignedTo) existing.assignees.add(c.assignedTo);
      } else {
        map.set(key, {
          item: c,
          count: 1,
          assignees: new Set(c.assignedTo ? [c.assignedTo] : []),
        });
      }
    }
    return Array.from(map.values()).map(({ item, count, assignees }) => ({
      ...item,
      count,
      assignees: Array.from(assignees),
    }));
  })();

  // ✅ ENHANCED: Use existing resolved data instead of fetching separately
  useEffect(() => {
    if (!teamAssignments) {
      setLoading(false);
      return;
    }

    const userIds = (
      [
        teamAssignments.teamLead,
        teamAssignments.salesRepresentative,
        ...Object.values(teamAssignments.subjectMatterExperts || {}),
      ] as Array<string | undefined>
    ).filter((id): id is string => typeof id === 'string' && id.length > 0);

    if (userIds.length === 0) {
      setLoading(false);
      return;
    }

    // ✅ FOLLOWING CORE_REQUIREMENTS.md: Use existing resolved data first
    (async () => {
      const nameMap: Record<string, string> = {};

      // Map from assignedTo data (already resolved)
      assignedTo.forEach(user => {
        nameMap[user.id] = user.name;
      });

      const unresolved = userIds.filter((id) => !nameMap[id]);

      // Fallback: fetch unresolved user names in one request if possible
      if (unresolved.length > 0) {
        try {
          const query = encodeURIComponent(unresolved.join(','));
          const res: unknown = await apiClient.get(`users?ids=${query}`);
          const users: Array<{ id: string; name?: string; email?: string }> = (() => {
            if (res && typeof res === 'object') {
              const dataVal = (res as { data?: unknown }).data;
              if (Array.isArray((res as { users?: unknown }).users)) {
                return (res as { users: Array<{ id: string; name?: string; email?: string }> }).users;
              }
              if (dataVal && typeof dataVal === 'object' && Array.isArray((dataVal as { users?: unknown }).users)) {
                return (dataVal as { users: Array<{ id: string; name?: string; email?: string }> }).users;
              }
            }
            return [];
          })();
          users.forEach(u => {
            if (u?.id) nameMap[u.id] = u.name || u.email || `User ${u.id.substring(0, 8)}...`;
          });
        } catch {
          // Graceful fallback to truncated IDs
          unresolved.forEach((userId) => {
            nameMap[userId] = userId.length > 20 ? `User ${userId.substring(0, 8)}...` : `User ${userId}`;
          });
        }
      }

      setUserNames(nameMap);
      setLoading(false);
    })();
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
                          {typeof value === 'string' ? getUserDisplayName(value) : String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Step 3: Content Selections */}
        {dedupedSelections.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <DocumentTextIcon className="h-4 w-4 mr-2 text-purple-500" />
              Content Selections
            </h3>
            <div className="space-y-2 text-sm">
              {dedupedSelections.map((c: { title?: string; section?: string; id?: string; count?: number; assignees?: string[] }, index: number) => {
                const title = c.title || 'Selected Content';
                const section = c.section || undefined;
                const id = c.id;
                const count = c.count ?? 0;
                const assignees: string[] = c.assignees ?? [];
                return (
                  <div key={`csel-${index}`} className="flex items-start justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <span>{title}</span>
                        {count > 1 && (
                          <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-[11px] leading-5 text-gray-700">
                            x{count}
                          </span>
                        )}
                      </div>
                      {section && (
                        <div className="text-xs text-gray-600">{section}</div>
                      )}
                      {assignees.length > 0 && (
                        <div className="text-[11px] text-gray-500">
                          Assigned: {assignees.map((uid) => (loading ? 'Loading…' : getUserDisplayName(uid))).join(', ')}
                        </div>
                      )}
                      {id && (
                        <div className="text-[11px] text-gray-500">ID: {id}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Sections & Assignments */}
        {Array.isArray(wizardData?.step5?.sections) && wizardData!.step5!.sections!.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <DocumentTextIcon className="h-4 w-4 mr-2 text-blue-500" />
              Sections & Assignments
            </h3>
            <div className="space-y-2 text-sm">
              {wizardData!.step5!.sections!.map((s: { title?: string; hours?: number; priority?: unknown; status?: unknown; assignedTo?: string | string[] }, index: number) => {
                const assignee = s?.assignedTo;
                const assignees: string[] = Array.isArray(assignee)
                  ? assignee.filter(Boolean)
                  : (assignee ? [assignee] : []);
                return (
                  <div key={`sec-${index}`} className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{s?.title || 'Untitled Section'}</div>
                      {assignees.length > 0 && (
                        <div className="text-[11px] text-gray-500">
                          Assigned: {assignees.map((uid) => (loading ? 'Loading…' : getUserDisplayName(uid))).join(', ')}
                        </div>
                      )}
                      <div className="flex gap-3 text-[11px] text-gray-500">
                        {typeof s?.hours === 'number' && <span>Hours: {s.hours}</span>}
                        {s?.priority !== undefined && <span>Priority: {String(s.priority)}</span>}
                        {s?.status !== undefined && <span>Status: {String(s.status)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Step 4: Product Selections */}
        {wizardData?.step4?.products && wizardData.step4.products.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <ShoppingCartIcon className="h-4 w-4 mr-2 text-purple-500" />
              Products Selected
            </h3>
            <div className="space-y-2 text-sm">
              {wizardData.step4.products
                .filter(product => product.included !== false) // Only show included products
                .map((product, index) => (
                <div key={product.id || index} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{product.name || `Product ${index + 1}`}</span>
                    {product.category && (
                      <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {product.category}
                      </span>
                    )}
                    <div className="text-xs text-gray-600 mt-1">
                      Qty: {product.quantity || 1} x ${(product.unitPrice || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-gray-900">
                      ${(product.totalPrice || (product.quantity || 1) * (product.unitPrice || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proposal Value Display Logic */}
        {(() => {
          const hasProducts = wizardData?.step4?.products?.some(p => p.included !== false) &&
                             wizardData.step4.products.length > 0;
          const step4Total = wizardData?.step4?.totalValue || 0;
          const step1EstimatedValue = wizardData?.step1?.value || 0;

          // Logic: If no products and step4 total is 0, show estimated value from step1
          // Otherwise, show actual value from step4
          const shouldShowEstimated = !hasProducts && step4Total === 0 && step1EstimatedValue > 0;
          const displayValue = shouldShowEstimated ? step1EstimatedValue : step4Total;

          if (displayValue > 0) {
            return (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <ChartBarIcon className="h-4 w-4 mr-2 text-green-500" />
                  Proposal Value
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-green-800">
                        {shouldShowEstimated ? 'Estimated Value' : 'Total Value'}
                      </span>
                      {shouldShowEstimated && (
                        <p className="text-xs text-green-600 mt-1">
                          Based on initial estimate (no products selected)
                        </p>
                      )}
                      {!shouldShowEstimated && hasProducts && (
                        <p className="text-xs text-green-600 mt-1">
                          Calculated from selected products
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-green-700">
                        ${displayValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

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
            {Object.entries(crossStepValidation).map(([key, _value]) => (
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
