'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useApiClient } from '@/hooks/useApiClient';
import useErrorHandler from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
const GraphMap = dynamic(() => import('../../../../components/products/relationships/GraphMap'), {
  ssr: false,
});
const InlineTestPanel = dynamic(
  () => import('../../../../components/products/relationships/InlineTestPanel'),
  { ssr: false }
);
const ProductSimulator = dynamic(
  () => import('../../../../components/products/relationships/ProductSimulator'),
  { ssr: false }
);
const RelationshipsSidebar = dynamic(
  () => import('../../../../components/products/relationships/RelationshipsSidebar'),
  { ssr: false }
);
const RuleBuilder = dynamic(
  () => import('../../../../components/products/relationships/RuleBuilder'),
  { ssr: false }
);

import {
  ArrowPathIcon,
  BeakerIcon,
  ChartBarIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';

type RuleStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'DEPRECATED';

interface ProductSummary {
  id: string;
  name: string;
  sku: string;
  status?: 'Active' | 'Draft' | 'Deprecated';
}

interface ProductRelationshipRuleDTO {
  id: string;
  productId: string;
  name: string;
  ruleType: string;
  status: RuleStatus;
  rule: unknown;
  precedence: number;
  explain?: string | null;
  updatedAt: string;
  createdAt: string;
}

const STATUS_TO_BADGE: Record<string, { color: string; label: string }> = {
  Active: { color: 'bg-green-100 text-green-800', label: 'Active' },
  Draft: { color: 'bg-amber-100 text-amber-800', label: 'Draft' },
  Deprecated: { color: 'bg-gray-100 text-gray-800', label: 'Deprecated' },
};

export default function RelationshipsWorkspacePage() {
  const apiClient = useApiClient();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { handleAsyncError } = useErrorHandler();

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null);
  const [rules, setRules] = useState<ProductRelationshipRuleDTO[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'matrix' | 'list'>('visual');
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Contextual canvas view: show graph by default, switch to builder for add/edit
  const [canvasView, setCanvasView] = useState<'graph' | 'builder'>('graph');
  const [builderInitial, setBuilderInitial] = useState<ProductRelationshipRuleDTO | null>(null);

  // Load products (basic id, sku, name)
  useEffect(() => {
    // mount-only
    (async () => {
      try {
        const res = await apiClient.get<{
          success: boolean;
          data: { products: ProductSummary[]; total?: number; page?: number; limit?: number };
        }>('/products?fields=id,sku,name,status&limit=100');
        const list: ProductSummary[] = (res.data.products || []).map(p => ({
          id: String(p.id),
          sku: String(p.sku),
          name: String(p.name),
          status: p.status ?? 'Active',
        }));
        setProducts(list);
        if (list.length > 0) {
          setSelectedProductId(list[0].id);
          setSelectedProduct(list[0]);
        }
      } catch (error) {
        handleAsyncError(error, 'Failed to load products', {
          component: 'RelationshipsWorkspacePage',
          phase: 'loadProducts',
        });
      }
    })();
  }, [apiClient, handleAsyncError]);

  const loadRules = useCallback(
    async (productId: string) => {
      setLoading(true);
      try {
        const res = await apiClient.get<{ success: boolean; data: ProductRelationshipRuleDTO[] }>(
          `/products/relationships/rules?productId=${encodeURIComponent(productId)}`
        );
        setRules(res.data || []);
        analytics(
          'relationships_rules_loaded',
          { productId, count: res.data.length || 0 },
          'medium'
        );
      } catch (error) {
        handleAsyncError(error, 'Failed to load rules', {
          component: 'RelationshipsWorkspacePage',
          phase: 'loadRules',
        });
      } finally {
        setLoading(false);
      }
    },
    [apiClient, analytics, handleAsyncError]
  );

  // Load rules when product changes
  useEffect(() => {
    if (!selectedProductId) return;
    void loadRules(selectedProductId);
  }, [selectedProductId, loadRules]);

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [products, search]);

  const onRefresh = useCallback(() => {
    if (!selectedProductId) return;
    analytics('relationships_refresh', { productId: selectedProductId }, 'medium');
    void loadRules(selectedProductId);
  }, [analytics, selectedProductId, loadRules]);

  const onChangeProduct = useCallback(
    (id: string) => {
      const p = products.find(x => x.id === id) || null;
      setSelectedProductId(id);
      setSelectedProduct(p);
    },
    [products]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Cog6ToothIcon className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Product Relationships
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Author rules, test configurations, and visualize dependencies
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('visual')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'visual'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <EyeIcon className="w-4 h-4 mr-1 inline" /> Visual
                </button>
                <button
                  onClick={() => setViewMode('matrix')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'matrix'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ChartBarIcon className="w-4 h-4 mr-1 inline" /> Matrix
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List
                </button>
              </div>
              <Button
                variant="secondary"
                onClick={() => analytics('relationships_import_click', {}, 'low')}
                className="flex items-center hover:bg-blue-50 border-blue-200"
              >
                <DocumentArrowUpIcon className="w-4 h-4 mr-2" /> Import
              </Button>
              <Button
                variant="secondary"
                onClick={() => analytics('relationships_export_click', {}, 'low')}
                className="flex items-center hover:bg-green-50 border-green-200"
              >
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button
                variant="secondary"
                onClick={() => analytics('relationships_share_click', {}, 'low')}
                className="flex items-center hover:bg-purple-50 border-purple-200"
              >
                <ShareIcon className="w-4 h-4 mr-2" /> Share
              </Button>
              <Button
                onClick={onRefresh}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex items-center shadow-lg hover:shadow-xl transition-all"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Product Picker Row */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-lg hover:shadow-xl transition-all">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Cog6ToothIcon className="w-5 h-5 text-blue-600" />
                <label className="text-sm font-semibold text-gray-800">Select Product</label>
              </div>
              <div className="space-y-3">
                <Select
                  value={selectedProductId}
                  onChange={onChangeProduct}
                  options={filteredProducts.map(p => ({
                    label: `${p.name} (${p.sku})`,
                    value: p.id,
                  }))}
                  aria-label="Product Picker"
                  className="w-full"
                />
                {selectedProduct && (
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${STATUS_TO_BADGE[selectedProduct.status || 'Active'].color} px-3 py-1 rounded-full text-xs font-medium`}
                    >
                      {STATUS_TO_BADGE[selectedProduct.status || 'Active'].label}
                    </Badge>
                    <span className="text-xs text-gray-500">SKU: {selectedProduct.sku}</span>
                  </div>
                )}
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="bg-white/70 border-blue-200 focus:border-blue-400"
                />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-white to-green-50 border-green-200 shadow-lg hover:shadow-xl transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-800">Active Rules</div>
                <ChartBarIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600">{rules.length}</div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span>for selected product</span>
                {rules.length > 10 && (
                  <ExclamationTriangleIcon className="w-3 h-3 text-amber-500" />
                )}
              </div>
              <div className="mt-3 flex gap-1">
                {['DRAFT', 'REVIEW', 'PUBLISHED'].map(status => {
                  const count = rules.filter(r => r.status === status).length;
                  return count > 0 ? (
                    <Badge key={status} className="text-xs px-2 py-1 bg-gray-100 text-gray-700">
                      {status}: {count}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg hover:shadow-xl transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-800">Product Status</div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    selectedProduct?.status === 'Active'
                      ? 'bg-green-500'
                      : selectedProduct?.status === 'Draft'
                        ? 'bg-amber-500'
                        : 'bg-gray-500'
                  }`}
                ></div>
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {selectedProduct?.status || 'Active'}
              </div>
              <div className="text-xs text-gray-500 mt-1">workflow status</div>
              <div className="mt-3">
                <div className="text-xs text-gray-600">
                  {selectedProduct?.name || 'No product selected'}
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-white to-amber-50 border-amber-200 shadow-lg hover:shadow-xl transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-800">Quick Actions</div>
                <BeakerIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-xs hover:bg-amber-100 border-amber-200"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-xs hover:bg-blue-100 border-blue-200"
                  onClick={() =>
                    analytics(
                      'relationships_validate_click',
                      { productId: selectedProductId },
                      'medium'
                    )
                  }
                >
                  Validate Rules
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Workspace Layout: Left Sidebar / Main Canvas / Right Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Sidebar */}
          <div className="lg:col-span-3">
            <RelationshipsSidebar
              productId={selectedProductId}
              rules={rules}
              loading={loading}
              onAddRule={() => {
                analytics(
                  'relationships_add_rule_click',
                  { productId: selectedProductId },
                  'medium'
                );
                setBuilderInitial(null);
                setCanvasView('builder');
              }}
              onRuleSelected={ruleId => {
                setSelectedRule(ruleId);
                const found = rules.find(r => r.id === ruleId) || null;
                if (found) {
                  setBuilderInitial(found);
                  setCanvasView('builder');
                }
              }}
            />
          </div>

          {/* Main Canvas */}
          <div className="lg:col-span-6 space-y-4">
            {canvasView === 'builder' ? (
              <RuleBuilder
                productId={selectedProductId}
                onCreated={() => {
                  onRefresh();
                  setCanvasView('graph');
                }}
                initialRule={builderInitial ? (builderInitial as unknown as any) : undefined}
                onCancel={() => setCanvasView('graph')}
              />
            ) : null}

            {/* Enhanced Main Content Area */}
            {viewMode === 'visual' && canvasView === 'graph' && (
              <div className="space-y-6">
                {/* Interactive Graph Visualization */}
                <Card className="bg-gradient-to-br from-white to-gray-50 shadow-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Relationship Graph</h3>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" className="text-xs">
                          Zoom Fit
                        </Button>
                        <Button size="sm" variant="secondary" className="text-xs">
                          Reset View
                        </Button>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 min-h-[400px] flex items-center justify-center">
                      <GraphMap
                        rules={
                          rules as unknown as Array<{
                            id: string;
                            name: string;
                            ruleType: string;
                            productId: string;
                            status: string;
                            rule?: any;
                          }>
                        }
                        onRuleSelected={ruleId => {
                          setSelectedRule(ruleId);
                          const found = rules.find(r => r.id === ruleId) || null;
                          if (found) {
                            setBuilderInitial(found);
                            setCanvasView('builder');
                          }
                        }}
                      />
                    </div>
                  </div>
                </Card>

                {/* Testing and Analysis Tools */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-lg">
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <BeakerIcon className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Sandbox Testing</h3>
                      </div>
                      <InlineTestPanel productId={selectedProductId} />
                    </div>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-lg">
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <ClockIcon className="w-5 h-5 text-amber-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Rule History</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="text-sm text-gray-600">
                          View version history and audit trail for relationship rules.
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" className="text-xs">
                            View Timeline
                          </Button>
                          <Button size="sm" variant="secondary" className="text-xs">
                            Export History
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {viewMode === 'matrix' && canvasView === 'graph' && (
              <Card className="bg-white shadow-lg">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Relationship Matrix</h3>
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Matrix view coming soon...</p>
                    <p className="text-sm text-gray-500 mt-2">
                      This will show a comprehensive matrix of all product relationships
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {viewMode === 'list' && canvasView === 'graph' && (
              <Card className="bg-white shadow-lg">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rules List</h3>
                  <div className="space-y-3">
                    {rules.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No rules found for selected product</p>
                      </div>
                    ) : (
                      rules.map(rule => (
                        <div
                          key={rule.id}
                          className={`p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all ${
                            selectedRule === rule.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200'
                          }`}
                          onClick={() => setSelectedRule(rule.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{rule.name}</h4>
                              <p className="text-sm text-gray-600">{rule.ruleType}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`px-2 py-1 text-xs ${
                                  rule.status === 'PUBLISHED'
                                    ? 'bg-green-100 text-green-800'
                                    : rule.status === 'DRAFT'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {rule.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(rule.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {rule.explain && (
                            <p className="text-sm text-gray-600 mt-2">{rule.explain}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Sidebar: Enhanced Product Simulator */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              <ProductSimulator />

              {/* Additional Tools Panel */}
              {showAdvanced && (
                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 shadow-lg">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Tools</h3>
                    <div className="space-y-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs hover:bg-purple-100"
                        onClick={() =>
                          analytics(
                            'relationships_dependency_analysis',
                            { productId: selectedProductId },
                            'medium'
                          )
                        }
                      >
                        Dependency Analysis
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs hover:bg-purple-100"
                        onClick={() =>
                          analytics(
                            'relationships_circular_detection',
                            { productId: selectedProductId },
                            'medium'
                          )
                        }
                      >
                        Detect Circular Dependencies
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs hover:bg-purple-100"
                        onClick={() =>
                          analytics(
                            'relationships_impact_analysis',
                            { productId: selectedProductId },
                            'medium'
                          )
                        }
                      >
                        Impact Analysis
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs hover:bg-purple-100"
                        onClick={() =>
                          analytics(
                            'relationships_optimization',
                            { productId: selectedProductId },
                            'medium'
                          )
                        }
                      >
                        Optimize Relationships
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Selected Rule Details */}
              {selectedRule && (
                <Card className="bg-gradient-to-br from-green-50 to-white border-green-200 shadow-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Rule Details</h3>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedRule(null)}
                        className="text-xs"
                      >
                        Close
                      </Button>
                    </div>
                    {(() => {
                      const rule = rules.find(r => r.id === selectedRule);
                      if (!rule) return <p className="text-gray-500">Rule not found</p>;
                      return (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Name</label>
                            <p className="text-sm text-gray-900">{rule.name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Type</label>
                            <p className="text-sm text-gray-900">{rule.ruleType}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <Badge
                              className={`text-xs ${
                                rule.status === 'PUBLISHED'
                                  ? 'bg-green-100 text-green-800'
                                  : rule.status === 'DRAFT'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {rule.status}
                            </Badge>
                          </div>
                          {rule.explain && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">
                                Explanation
                              </label>
                              <p className="text-sm text-gray-900">{rule.explain}</p>
                            </div>
                          )}
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="secondary" className="text-xs">
                              Edit Rule
                            </Button>
                            <Button size="sm" variant="secondary" className="text-xs">
                              Test Rule
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
