/**
 * PosalPro MVP2 - RFP Parser Interface
 * Based on RFP_PARSER_SCREEN.md wireframe specifications
 *
 * User Stories: US-4.2
 * Hypothesis Coverage: H6 (Automated Requirement Extraction - 30% improvement)
 * Component Traceability: DocumentProcessor, RequirementTable, ComplianceTracker, AIAnalysisPanel
 */

'use client';

import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { StandardError } from '@/lib/errors/StandardError';
import { ApiResponse } from '@/types/api';
import {
  ArchiveBoxIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

interface Requirement {
  id: string;
  text: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  compliance: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  notes?: string;
}

interface RFPAnalysis {
  id: string;
  fileName: string;
  requirements: Requirement[];
  complianceScore: number;
  totalRequirements: number;
  compliantCount: number;
  partialCount: number;
  nonCompliantCount: number;
}

export default function RFPParserPage() {
  const apiClient = useApiClient();
  const { handleAsyncError } = useErrorHandler();
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<RFPAnalysis | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<ApiResponse<RFPAnalysis>>('/api/rfp/upload', formData);

      if (response.success && response.data) {
        setAnalysis(response.data);
      }
    } catch (error) {
      handleAsyncError(
        new StandardError({
          message: 'Failed to upload and analyze RFP document',
          code: ErrorCodes.DATA.QUERY_FAILED,
          metadata: {
            component: 'RFPParserPage',
            operation: 'POST',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      );
    } finally {
      setUploading(false);
    }
  };

  const getComplianceIcon = (compliance: string) => {
    switch (compliance) {
      case 'compliant':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'partial':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case 'non_compliant':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <ArchiveBoxIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">RFP Parser</h1>
              <p className="mt-2 text-gray-600">
                Upload RFP documents to extract requirements and assess compliance
              </p>
            </div>
            <div className="flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <ChartBarIcon className="w-4 h-4 mr-2" />
                Export Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        {!analysis && (
          <div className="bg-white shadow-sm rounded-lg p-8 mb-8">
            <div className="text-center">
              <ArchiveBoxIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-900 mb-2">Upload RFP Document</h2>
              <p className="text-gray-600 mb-6">
                Upload a PDF, DOC, or DOCX file to extract requirements and analyze compliance
              </p>

              <div className="max-w-md mx-auto">
                <label className="block">
                  <span className="sr-only">Choose RFP file</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.rtf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </label>

                {uploading && (
                  <div className="mt-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Analyzing document...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-8">
            {/* Document Info */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{analysis.fileName}</h2>
                  <p className="text-sm text-gray-500">
                    {analysis.totalRequirements} requirements extracted • {analysis.complianceScore}
                    % compliance
                  </p>
                </div>
                <div className="flex space-x-4 text-sm">
                  <span className="text-green-600">{analysis.compliantCount} compliant</span>
                  <span className="text-yellow-600">{analysis.partialCount} partial</span>
                  <span className="text-red-600">{analysis.nonCompliantCount} non-compliant</span>
                </div>
              </div>
            </div>

            {/* Requirements Table */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Extracted Requirements</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Section
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requirement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analysis.requirements.map(requirement => (
                      <tr key={requirement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {requirement.category}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-md">
                            <p className="truncate">{requirement.text}</p>
                            {requirement.notes && (
                              <p className="text-xs text-gray-500 mt-1">{requirement.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(requirement.priority)}`}
                          >
                            {requirement.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getComplianceIcon(requirement.compliance)}
                            <span className="ml-2 text-sm text-gray-900 capitalize">
                              {requirement.compliance.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Analysis Panel */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">AI Analysis & Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                    <h4 className="font-medium text-yellow-800">Attention Required</h4>
                  </div>
                  <p className="text-sm text-yellow-700 mt-2">
                    {analysis.nonCompliantCount} requirements have no clear compliance plan
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                    <h4 className="font-medium text-green-800">Good Coverage</h4>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    {analysis.compliantCount} requirements have matching solution components
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
