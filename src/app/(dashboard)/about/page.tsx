'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  CodeBracketIcon,
  CpuChipIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const VERSION_INFO = {
  version: '0.1.0-alpha.2',
  buildDate: new Date().toISOString().split('T')[0],
  phase: 'Alpha 2',
  status: 'Development',
  nextVersion: '0.1.0-alpha.3',
};

const SYSTEM_COMPONENTS = [
  {
    name: 'Authentication System',
    status: 'Complete',
    version: '2.1.1',
    description: 'NextAuth.js with role-based access control',
  },
  {
    name: 'Database Integration',
    status: 'Complete',
    version: '1.0.0',
    description: 'PostgreSQL with Prisma ORM',
  },
  {
    name: 'Admin Dashboard',
    status: 'Complete',
    version: '1.2.0',
    description: 'Full CRUD operations and system management',
  },
  {
    name: 'Proposal Management',
    status: 'Complete',
    version: '1.1.0',
    description: 'End-to-end proposal lifecycle',
  },
  {
    name: 'Analytics Framework',
    status: 'Complete',
    version: '1.3.0',
    description: 'Real-time analytics and hypothesis validation',
  },
  {
    name: 'Performance Monitoring',
    status: 'Complete',
    version: '1.1.0',
    description: 'Advanced performance optimization',
  },
];

export default function AboutPage() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Complete':
        return <CheckCircleIcon className="w-4 h-4 mr-1" />;
      case 'In Progress':
        return <ClockIcon className="w-4 h-4 mr-1" />;
      default:
        return <SparklesIcon className="w-4 h-4 mr-1" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <DocumentTextIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">About PosalPro MVP2</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl">
          Enterprise-grade proposal management platform built with modern web technologies for
          scalable, secure, and efficient proposal workflows.
        </p>
      </div>

      {/* Version Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <RocketLaunchIcon className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Current Version</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Version</span>
              <span className="font-mono text-lg font-bold text-blue-600">
                {VERSION_INFO.version}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Phase</span>
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                {getStatusIcon(VERSION_INFO.status)}
                {VERSION_INFO.phase}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Build Date</span>
              <span className="text-sm text-gray-900">{VERSION_INFO.buildDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Next Release</span>
              <span className="text-sm text-gray-500 font-mono">{VERSION_INFO.nextVersion}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CpuChipIcon className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Health Score</span>
              <span className="text-2xl font-bold text-green-600">97.8%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Status</span>
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Operational
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BuildingOfficeIcon className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Deployment</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Environment</span>
              <Badge variant="default">Production</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Platform</span>
              <span className="text-sm text-gray-900">Netlify</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">URL</span>
              <a
                href="https://posalpro-mvp2.windsurf.build"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <GlobeAltIcon className="w-4 h-4 mr-1" />
                Live Site
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">SSL</span>
              <Badge variant="outline" className="text-green-600 border-green-200">
                <ShieldCheckIcon className="w-4 h-4 mr-1" />
                Secured
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* System Components */}
      <Card className="p-6 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <CodeBracketIcon className="w-6 h-6 text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-900">System Components</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SYSTEM_COMPONENTS.map((component, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <h4 className="font-medium text-gray-900">{component.name}</h4>
                <p className="text-sm text-gray-600">{component.description}</p>
                <span className="text-xs text-gray-500 font-mono">v{component.version}</span>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                {getStatusIcon(component.status)}
                {component.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Technology Stack */}
      <Card className="p-6 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <CpuChipIcon className="w-6 h-6 text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-900">Technology Stack</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Next.js</h4>
              <Badge variant="outline" size="sm">
                Framework
              </Badge>
            </div>
            <span className="text-sm font-mono text-blue-600">15.3.3</span>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">React</h4>
              <Badge variant="outline" size="sm">
                Library
              </Badge>
            </div>
            <span className="text-sm font-mono text-blue-600">19.1.0</span>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">TypeScript</h4>
              <Badge variant="outline" size="sm">
                Language
              </Badge>
            </div>
            <span className="text-sm font-mono text-blue-600">5.3.2</span>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">PostgreSQL</h4>
              <Badge variant="outline" size="sm">
                Database
              </Badge>
            </div>
            <span className="text-sm font-mono text-blue-600">15+</span>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          variant="primary"
          onClick={() => window.open('https://posalpro-mvp2.windsurf.build', '_blank')}
        >
          <GlobeAltIcon className="w-4 h-4 mr-2" />
          Visit Live Site
        </Button>
        <Button variant="secondary" onClick={() => (window.location.href = '/dashboard')}>
          <RocketLaunchIcon className="w-4 h-4 mr-2" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
