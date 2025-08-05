/**
 * PosalPro MVP2 - RFP Parser Main Page
 * Based on RFP_PARSER_SCREEN.md wireframe specifications
 *
 * User Stories: US-4.2
 * Hypothesis Coverage: H6 (Automated Requirement Extraction - 30% improvement)
 * Component Traceability: DocumentProcessor, RequirementTable, ComplianceTracker
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
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface RFPDocument {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  requirementsCount?: number;
  complianceScore?: number;
}

export default function RFPMainPage() {
  const apiClient = useApiClient();
  const { handleAsyncError } = useErrorHandler();
  const [documents, setDocuments] = useState<RFPDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<ApiResponse<RFPDocument[]>>('/api/rfp/documents');
        if (response.success && response.data) {
          setDocuments(response.data);
        }
      } catch (error) {
        handleAsyncError(
          new StandardError({
            message: 'Failed to load RFP documents',
            code: ErrorCodes.DATA.QUERY_FAILED,
            metadata: {
              component: 'RFPMainPage',
              operation: 'GET',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [apiClient, handleAsyncError]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">RFP Parser</h1>
              <p className="mt-2 text-gray-600">
                Upload and analyze RFP documents to extract requirements and assess compliance
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/rfp/parser"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Upload RFP
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/rfp/parser"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <ArchiveBoxIcon className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Upload & Parse</h3>
                <p className="text-sm text-gray-600">Upload new RFP documents for analysis</p>
              </div>
            </div>
          </Link>

          <Link
            href="/rfp/analysis"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Analysis Tools</h3>
                <p className="text-sm text-gray-600">Advanced analysis and insights</p>
              </div>
            </div>
          </Link>

          <Link
            href="/content/search"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <MagnifyingGlassIcon className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Search Content</h3>
                <p className="text-sm text-gray-600">Find relevant content for proposals</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Documents */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent RFP Documents</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="px-6 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <ArchiveBoxIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No RFP documents yet</h3>
                <p className="text-gray-600 mb-4">
                  Upload your first RFP document to start extracting requirements and analyzing
                  compliance.
                </p>
                <Link
                  href="/rfp/parser"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Upload First RFP
                </Link>
              </div>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DocumentTextIcon className="w-8 h-8 text-gray-400 mr-4" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{doc.fileName}</h3>
                        <p className="text-sm text-gray-500">
                          {doc.fileType.toUpperCase()} • {(doc.fileSize / 1024 / 1024).toFixed(1)}{' '}
                          MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {doc.requirementsCount && (
                        <span className="text-sm text-gray-500">
                          {doc.requirementsCount} requirements
                        </span>
                      )}
                      {doc.complianceScore && (
                        <span className="text-sm text-gray-500">
                          {Math.round(doc.complianceScore)}% compliance
                        </span>
                      )}
                      <Link
                        href={`/rfp/parser/${doc.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Analysis
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
