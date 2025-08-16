'use client';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import {
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  LinkIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';

interface Props {
  rules: Array<{ id: string; name: string; ruleType: string; productId: string; status: string }>;
  onRuleSelected: (id: string) => void;
}

export default function GraphMap({ rules, onRuleSelected }: Props) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  const handleRuleClick = (ruleId: string) => {
    analytics('rule_selected_from_graph', { ruleId }, 'medium');
    onRuleSelected(ruleId);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev: number) => Math.min(prev + 25, 200));
    analytics('graph_zoom_in', { newZoom: zoomLevel + 25 }, 'low');
  };

  const handleZoomOut = () => {
    setZoomLevel((prev: number) => Math.max(prev - 25, 50));
    analytics('graph_zoom_out', { newZoom: zoomLevel - 25 }, 'low');
  };

  const handleReset = () => {
    setZoomLevel(100);
    analytics('graph_reset', {}, 'low');
  };

  const getRuleTypeColor = (ruleType: string) => {
    switch (ruleType.toLowerCase()) {
      case 'requires':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'excludes':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'recommends':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'conditional':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-green-500';
      case 'draft':
        return 'bg-amber-500';
      case 'review':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Simplified edges calculation for display purposes
  const edges = useMemo(() => {
    return rules
      .map(rule => ({
        id: rule.id,
        label: `${rule.name} (${rule.ruleType})`,
      }))
      .slice(0, 12);
  }, [rules]);

  return (
    <Card className="bg-gradient-to-br from-white to-purple-50 shadow-lg border-purple-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Relationship Graph</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setViewMode(viewMode === 'graph' ? 'list' : 'graph')}
              className="text-xs"
            >
              {viewMode === 'graph' ? 'List' : 'Graph'}
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 50}
            >
              <MagnifyingGlassMinusIcon className="w-4 h-4" />
            </Button>
            <span className="text-xs text-gray-600 min-w-[3rem] text-center">{zoomLevel}%</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 200}
            >
              <MagnifyingGlassPlusIcon className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handleReset}>
              <ArrowPathIcon className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="secondary">
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div
          className="space-y-3"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
        >
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <LinkIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500 mb-2">No relationship rules to visualize</p>
              <p className="text-xs text-gray-400">Create rules to see the relationship graph</p>
            </div>
          ) : viewMode === 'graph' ? (
            <div className="relative">
              {/* Graph visualization */}
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-auto">
                {rules.map((rule, index) => (
                  <div key={rule.id} className="relative">
                    {/* Connection lines for visual effect */}
                    {index > 0 && (
                      <div className="absolute -top-3 left-1/2 w-px h-3 bg-gray-300 transform -translate-x-1/2"></div>
                    )}

                    {/* Rule node */}
                    <div
                      onClick={() => handleRuleClick(rule.id)}
                      className="relative border-2 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all group bg-white"
                    >
                      {/* Status indicator */}
                      <div
                        className={`absolute top-2 right-2 w-2 h-2 rounded-full ${getStatusColor(rule.status)}`}
                      ></div>

                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 group-hover:text-purple-700 text-sm">
                            {rule.name}
                          </div>
                          <div className="mt-1">
                            <Badge
                              className={`text-xs px-2 py-1 ${getRuleTypeColor(rule.ruleType)}`}
                            >
                              {rule.ruleType}
                            </Badge>
                          </div>
                        </div>
                        <LinkIcon className="w-4 h-4 text-gray-400 group-hover:text-purple-500 mt-1" />
                      </div>
                    </div>

                    {/* Connection to next rule */}
                    {index < rules.length - 1 && (
                      <div className="flex justify-center mt-2">
                        <div className="w-px h-4 bg-gray-300"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* List view */
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {rules.map(rule => (
                <div
                  key={rule.id}
                  onClick={() => handleRuleClick(rule.id)}
                  className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 group-hover:text-purple-700 text-sm">
                        {rule.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs px-2 py-1 ${getRuleTypeColor(rule.ruleType)}`}>
                          {rule.ruleType}
                        </Badge>
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusColor(rule.status)}`}
                        ></div>
                      </div>
                    </div>
                    <LinkIcon className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        {rules.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600 mb-2">Rule Types:</div>
            <div className="flex flex-wrap gap-2">
              {['requires', 'excludes', 'recommends', 'conditional'].map(type => (
                <Badge key={type} className={`text-xs px-2 py-1 ${getRuleTypeColor(type)}`}>
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
