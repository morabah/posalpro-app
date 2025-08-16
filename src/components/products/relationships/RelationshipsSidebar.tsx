'use client';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/Input';
import {
  ChartBarIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';

interface Props {
  productId: string;
  rules: Array<{ id: string; name: string; ruleType: string; status: string; updatedAt: string }>;
  loading?: boolean;
  onAddRule: () => void;
  onRuleSelected: (id: string) => void;
}

export default function RelationshipsSidebar({ rules, loading, onAddRule, onRuleSelected }: Props) {
  const [tab, setTab] = useState<'rules' | 'attributes' | 'compat' | 'history'>('rules');
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'updated'>('updated');

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    const filteredRules = rules.filter(
      r => r.name.toLowerCase().includes(q) || r.ruleType.toLowerCase().includes(q)
    );

    // Sort rules
    return filteredRules.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.ruleType.localeCompare(b.ruleType);
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  }, [rules, filter, sortBy]);

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50 shadow-lg border-gray-200">
      <div className="p-6">
        <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'rules', label: 'Rules', icon: DocumentTextIcon },
            { id: 'attributes', label: 'Attributes', icon: Cog6ToothIcon },
            { id: 'compat', label: 'Matrix', icon: ChartBarIcon },
            { id: 'history', label: 'History', icon: ClockIcon },
          ].map(t => {
            const IconComponent = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as 'rules' | 'attributes' | 'compat' | 'history')}
                className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {tab === 'rules' && (
          <div className="space-y-4">
            {/* Search and Controls */}
            <div className="space-y-3">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Filter rules..."
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="pl-10 bg-white/70 border-gray-300 focus:border-blue-400"
                />
              </div>

              <div className="flex items-center justify-between">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'name' | 'type' | 'updated')}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value="updated">Sort by Updated</option>
                  <option value="name">Sort by Name</option>
                  <option value="type">Sort by Type</option>
                </select>

                <Button
                  onClick={onAddRule}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Rule</span>
                </Button>
              </div>
            </div>

            {/* Rules List */}
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading rules...</span>
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="text-center py-8">
                  <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    {filter ? 'No rules match your search' : 'No rules found for this product'}
                  </p>
                  <Button onClick={onAddRule} size="sm" variant="secondary" className="mt-3">
                    Create First Rule
                  </Button>
                </div>
              )}

              {!loading &&
                filtered.map(r => (
                  <div
                    key={r.id}
                    onClick={() => onRuleSelected(r.id)}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">
                          {r.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                          <Badge className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700">
                            {r.ruleType}
                          </Badge>
                          <span>•</span>
                          <span>{new Date(r.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="ml-2">
                        <Badge
                          className={`text-xs px-2 py-1 ${
                            r.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-800'
                              : r.status === 'DRAFT'
                                ? 'bg-amber-100 text-amber-800'
                                : r.status === 'REVIEW'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {r.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === 'attributes' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Cog6ToothIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">Product Attributes</p>
              <p className="text-xs text-gray-500">Key/value attributes editor coming soon</p>
              <Button size="sm" variant="secondary" className="mt-3">
                Configure Attributes
              </Button>
            </div>
          </div>
        )}

        {tab === 'compat' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">Compatibility Matrix</p>
              <p className="text-xs text-gray-500">Visual compatibility matrix coming soon</p>
              <Button size="sm" variant="secondary" className="mt-3">
                Build Matrix
              </Button>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">Version History</p>
              <p className="text-xs text-gray-500">Timeline and audit trail coming soon</p>
              <Button size="sm" variant="secondary" className="mt-3">
                View Timeline
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
