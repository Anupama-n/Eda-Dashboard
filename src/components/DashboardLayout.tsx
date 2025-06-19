import React from 'react';
import { X, Download, Settings } from 'lucide-react';
import { VisualizationEngine } from './VisualizationEngine';
import type { Dataset, ChartConfig } from '../types';

interface DashboardLayoutProps {
  charts: ChartConfig[];
  dataset: Dataset;
  onRemoveChart: (chartId: string) => void;
  onUpdateChart: (chartId: string, updates: Partial<ChartConfig>) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  charts,
  dataset,
  onRemoveChart,
  onUpdateChart
}) => {
  const exportChart = (chartId: string) => {
    // In a real implementation, this would export the chart as an image
    console.log('Exporting chart:', chartId);
  };

  if (charts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No charts created yet. Use the control panel above to add visualizations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        <div className="text-sm text-gray-600">
          {charts.length} chart{charts.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {charts.map((chart) => (
          <div key={chart.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Chart Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {chart.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => exportChart(chart.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Export chart"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onRemoveChart(chart.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove chart"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Chart Info */}
              <div className="mt-1 text-xs text-gray-500">
                {chart.type} • {chart.xColumn && `X: ${chart.xColumn}`} 
                {chart.yColumn && ` • Y: ${chart.yColumn}`}
                {chart.colorColumn && ` • Color: ${chart.colorColumn}`}
              </div>
            </div>

            {/* Chart Content */}
            <div className="p-4">
              <VisualizationEngine
                data={dataset.data}
                config={chart}
                width={chart.options?.width || 350}
                height={chart.options?.height || 250}
              />
            </div>

            {/* Chart Controls */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {dataset.data.length} data points
                </div>
                <button
                  onClick={() => {
                    // Toggle chart options or show settings modal
                    console.log('Chart settings for:', chart.id);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Chart settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Total visualizations: {charts.length}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              charts.forEach(chart => exportChart(chart.id));
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export All
          </button>
          <button
            onClick={() => {
              charts.forEach(chart => onRemoveChart(chart.id));
            }}
            className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 transition-colors"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};
