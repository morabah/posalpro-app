/**
 * Interactive Revenue Chart Component
 * Chart.js-based revenue visualization with drill-down capabilities
 */

import { Card } from '@/components/ui/Card';
import { RevenueChart } from '@/types/dashboard';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend as ChartLegend,
  Tooltip as ChartTooltip,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  type ActiveElement,
  type ChartEvent,
  type ChartData as ChartJSData,
  type ChartOptions as ChartJSOptions,
  type Chart as ChartType,
  type TooltipItem,
} from 'chart.js';
import { memo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { formatCurrency, formatPercentage } from '../design';
import { TouchFriendlyButton } from '../ui/TouchFriendlyComponents';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTooltip,
  ChartLegend,
  Filler
);

// Comprehensive interfaces for InteractiveRevenueChart
interface RevenueDataPoint {
  date: string;
  revenue: number;
  category: string;
  count: number;
}

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: {
      display: boolean;
      position: 'top' | 'bottom' | 'left' | 'right';
    };
    tooltip: {
      enabled: boolean;
      mode: 'index' | 'dataset' | 'point' | 'nearest' | 'x' | 'y';
    };
  };
  scales: {
    x: {
      display: boolean;
      title: {
        display: boolean;
        text: string;
      };
    };
    y: {
      display: boolean;
      title: {
        display: boolean;
        text: string;
      };
    };
  };
}

// Use Chart.js types via TooltipItem<'line'> for callbacks

interface CategoryData {
  category: string;
  count: number;
  value: number;
}

// Interactive Revenue Chart with Drill-down Capabilities
export const InteractiveRevenueChart = memo(
  ({ data, loading }: { data: RevenueChart[]; loading: boolean }) => {
    const [selectedPoint, setSelectedPoint] = useState<RevenueChart | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [drillDownData, setDrillDownData] = useState<CategoryData[]>([]);
    const [isDrillingDown, setIsDrillingDown] = useState(false);

    if (loading) {
      return (
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </Card>
      );
    }

    // Enhanced chart options with interactivity
    const chartOptions: ChartJSOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: (tooltipItems: TooltipItem<'line'>[]) => {
              return `Period: ${tooltipItems[0]?.label ?? ''}`;
            },
            label: (tooltipItem: TooltipItem<'line'>) => {
              const label = tooltipItem.dataset?.label ?? '';
              const value = (tooltipItem.parsed?.y as number) ?? 0;
              return `${label}: ${formatCurrency(value)}`;
            },
            afterLabel: (tooltipItem: TooltipItem<'line'>) => {
              const dataPoint = data[tooltipItem.dataIndex!];
              if (dataPoint) {
                const variance = ((dataPoint.actual - dataPoint.target) / dataPoint.target) * 100;
                return `Variance: ${variance > 0 ? '+' : ''}${formatPercentage(variance)}`;
              }
              return '';
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#6b7280',
          },
        },
        y: {
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: '#6b7280',
            callback: (value: string | number) => formatCurrency(Number(value)),
          },
        },
      },
      onClick: (event: ChartEvent, elements: ActiveElement[], _chart: ChartType<'line'>) => {
        if (Array.isArray(elements) && elements.length > 0) {
          const dataIndex = elements[0].index;
          const dataPoint = data[dataIndex];
          setSelectedPoint(dataPoint);
          setShowDetails(true);

          // Simulate drill-down data
          setIsDrillingDown(true);
          setTimeout(() => {
            setDrillDownData([
              { category: 'Enterprise', value: dataPoint.actual * 0.4, count: 12 },
              { category: 'Mid-Market', value: dataPoint.actual * 0.35, count: 18 },
              { category: 'SMB', value: dataPoint.actual * 0.25, count: 25 },
            ]);
            setIsDrillingDown(false);
          }, 500);
        }
      },
    };

    if (!data || data.length === 0) {
      return (
        <Card className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500">No revenue data available</p>
          </div>
        </Card>
      );
    }

    const safe = data.filter(d => d.actual !== null && d.actual !== undefined);
    const datasets = [
      {
        label: 'Actual Revenue',
        data: safe.map(d => d.actual),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBorderWidth: 3,
      },
      {
        label: 'Target',
        data: safe.map(d => d.target),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ];

    if (safe.some(d => d.forecast != null)) {
      datasets.push({
        label: 'Forecast',
        data: safe.map(d => d.forecast ?? 0),
        borderColor: '#ea580c',
        backgroundColor: 'rgba(234, 88, 12, 0.3)',
        borderWidth: 2,
        borderDash: [3, 3],
        tension: 0.4,
        fill: false,
        pointBackgroundColor: '#ea580c',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      });
    }

    const chartData: ChartJSData<'line'> = {
      labels: safe.map(d => d.period),
      datasets,
    };

    const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
      // Simulate export functionality
      console.log(`Exporting chart data in ${format} format`);
      // In a real implementation, this would trigger actual export
    };

    const handleDrillDown = (category: string) => {
      // Simulate deeper drill-down
      console.log(`Drilling down into ${category} for ${selectedPoint?.period}`);
    };

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Analytics</h3>
          <div className="flex items-center space-x-2">
            <TouchFriendlyButton onClick={() => handleExport('pdf')} variant="secondary" size="sm">
              Export PDF
            </TouchFriendlyButton>
            <TouchFriendlyButton
              onClick={() => handleExport('excel')}
              variant="secondary"
              size="sm"
            >
              Export Excel
            </TouchFriendlyButton>
          </div>
        </div>

        <div className="relative">
          <div className="h-80">
            <Line data={chartData} options={chartOptions} />
          </div>

          {/* Interactive overlay for better UX */}
          <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-600 mb-1">💡 Click any point to drill down</p>
            <p className="text-xs text-gray-500">Hover for detailed tooltips</p>
          </div>
        </div>

        {/* Drill-down Modal */}
        {showDetails && selectedPoint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Revenue Details: {selectedPoint.period}</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Actual Revenue</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(selectedPoint.actual)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Target</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedPoint.target)}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900">Forecast</h4>
                  <p className="text-2xl font-bold text-orange-600">
                    {selectedPoint.forecast ? formatCurrency(selectedPoint.forecast) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Drill-down Data */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Revenue by Customer Segment</h4>
                {isDrillingDown ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {drillDownData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => handleDrillDown(item.category)}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              index === 0
                                ? 'bg-blue-500'
                                : index === 1
                                  ? 'bg-green-500'
                                  : 'bg-orange-500'
                            }`}
                          ></div>
                          <div>
                            <p className="font-medium">{item.category}</p>
                            <p className="text-sm text-gray-500">{item.count} proposals</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(item.value)}</p>
                          <p className="text-sm text-gray-500">
                            {formatPercentage((item.value / selectedPoint.actual) * 100)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <TouchFriendlyButton
                  onClick={() => handleExport('excel')}
                  variant="primary"
                  size="md"
                >
                  Export Details
                </TouchFriendlyButton>
                <TouchFriendlyButton
                  onClick={() => setShowDetails(false)}
                  variant="secondary"
                  size="md"
                >
                  Close
                </TouchFriendlyButton>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

InteractiveRevenueChart.displayName = 'InteractiveRevenueChart';
