import React, { useState } from 'react';
import { Plus, BarChart3, PieChart, ScatterChart, TrendingUp } from 'lucide-react';
import type { Dataset, ChartConfig, ChartType } from '../types';

interface ControlPanelProps {
  dataset: Dataset;
  onAddChart: (config: ChartConfig) => void;
}

const chartTypes: Array<{ type: ChartType; label: string; icon: React.ReactNode; description: string }> = [
  {
    type: 'histogram',
    label: 'Histogram',
    icon: <BarChart3 className="h-5 w-5" />,
    description: 'Distribution of numeric values'
  },
  {
    type: 'boxplot',
    label: 'Box Plot',
    icon: <BarChart3 className="h-5 w-5" />,
    description: 'Quartiles and outliers'
  },
  {
    type: 'scatter',
    label: 'Scatter Plot',
    icon: <ScatterChart className="h-5 w-5" />,
    description: 'Relationship between two variables'
  },
  {
    type: 'bar',
    label: 'Bar Chart',
    icon: <BarChart3 className="h-5 w-5" />,
    description: 'Categorical data comparison'
  },
  {
    type: 'pie',
    label: 'Pie Chart',
    icon: <PieChart className="h-5 w-5" />,
    description: 'Proportional data'
  },
  {
    type: 'line',
    label: 'Line Chart',
    icon: <TrendingUp className="h-5 w-5" />,
    description: 'Trends over time'
  },
  {
    type: 'heatmap',
    label: 'Heatmap',
    icon: <BarChart3 className="h-5 w-5" />,
    description: 'Correlation matrix'
  }
];

export const ControlPanel: React.FC<ControlPanelProps> = ({ dataset, onAddChart }) => {
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('histogram');
  const [xColumn, setXColumn] = useState<string>('');
  const [yColumn, setYColumn] = useState<string>('');
  const [colorColumn, setColorColumn] = useState<string>('');
  const [chartTitle, setChartTitle] = useState<string>('');

  const numericColumns = dataset.columns.filter(col => col.type === 'numeric');
  const categoricalColumns = dataset.columns.filter(col => col.type === 'categorical');
  const allColumns = dataset.columns;

  const getAvailableColumns = (usage: 'x' | 'y' | 'color') => {
    switch (selectedChartType) {
      case 'histogram':
      case 'boxplot':
        return usage === 'x' ? numericColumns : [];
      case 'scatter':
      case 'line':
        return numericColumns;
      case 'bar':
        return usage === 'x' ? categoricalColumns : numericColumns;
      case 'pie':
        return usage === 'x' ? categoricalColumns : [];
      case 'heatmap':
        return numericColumns;
      default:
        return allColumns;
    }
  };

  const canAddChart = () => {
    switch (selectedChartType) {
      case 'histogram':
      case 'boxplot':
        return xColumn !== '';
      case 'scatter':
      case 'line':
        return xColumn !== '' && yColumn !== '';
      case 'bar':
        return xColumn !== '' && yColumn !== '';
      case 'pie':
        return xColumn !== '';
      case 'heatmap':
        return numericColumns.length >= 2;
      default:
        return false;
    }
  };

  const handleAddChart = () => {
    if (!canAddChart()) return;

    const config: ChartConfig = {
      id: '', // Will be set by parent
      type: selectedChartType,
      title: chartTitle || `${chartTypes.find(ct => ct.type === selectedChartType)?.label} Chart`,
      xColumn: xColumn || undefined,
      yColumn: yColumn || undefined,
      colorColumn: colorColumn || undefined,
      options: {
        width: 400,
        height: 300
      }
    };

    onAddChart(config);

    // Reset form
    setChartTitle('');
    setColorColumn('');
    if (selectedChartType !== 'heatmap') {
      setXColumn('');
      setYColumn('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Visualization</h2>
        <p className="text-gray-600 mb-4">
          Configure and add charts to your dashboard
        </p>
      </div>

      {/* Chart Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Chart Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {chartTypes.map((chart) => (
            <button
              key={chart.type}
              onClick={() => {
                setSelectedChartType(chart.type);
                setXColumn('');
                setYColumn('');
                setColorColumn('');
              }}
              className={`
                p-3 border rounded-lg text-left transition-colors
                ${selectedChartType === chart.type
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center mb-2">
                {chart.icon}
                <span className="ml-2 font-medium text-sm">{chart.label}</span>
              </div>
              <p className="text-xs text-gray-600">{chart.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Column Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* X Column */}
        {getAvailableColumns('x').length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedChartType === 'pie' ? 'Category' : 'X-Axis'} Column
            </label>
            <select
              value={xColumn}
              onChange={(e) => setXColumn(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select column...</option>
              {getAvailableColumns('x').map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.type})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Y Column */}
        {getAvailableColumns('y').length > 0 && selectedChartType !== 'histogram' && selectedChartType !== 'boxplot' && selectedChartType !== 'pie' && selectedChartType !== 'heatmap' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Y-Axis Column
            </label>
            <select
              value={yColumn}
              onChange={(e) => setYColumn(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select column...</option>
              {getAvailableColumns('y').map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.type})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Color Column */}
        {(categoricalColumns.length > 0 && selectedChartType !== 'heatmap') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color By (Optional)
            </label>
            <select
              value={colorColumn}
              onChange={(e) => setColorColumn(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">None</option>
              {categoricalColumns.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chart Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chart Title (Optional)
        </label>
        <input
          type="text"
          value={chartTitle}
          onChange={(e) => setChartTitle(e.target.value)}
          placeholder="Enter chart title..."
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Add Chart Button */}
      <div className="flex justify-end">
        <button
          onClick={handleAddChart}
          disabled={!canAddChart()}
          className={`
            inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors
            ${canAddChart()
              ? 'text-white bg-blue-600 hover:bg-blue-700'
              : 'text-gray-400 bg-gray-200 cursor-not-allowed'
            }
          `}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Chart
        </button>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Chart Requirements:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          {selectedChartType === 'histogram' && (
            <li>• Select a numeric column for distribution analysis</li>
          )}
          {selectedChartType === 'boxplot' && (
            <li>• Select a numeric column to show quartiles and outliers</li>
          )}
          {selectedChartType === 'scatter' && (
            <>
              <li>• Select numeric columns for both X and Y axes</li>
              <li>• Optionally color points by a categorical variable</li>
            </>
          )}
          {selectedChartType === 'bar' && (
            <>
              <li>• Select a categorical column for X-axis</li>
              <li>• Select a numeric column for Y-axis (values)</li>
            </>
          )}
          {selectedChartType === 'pie' && (
            <li>• Select a categorical column to show proportions</li>
          )}
          {selectedChartType === 'line' && (
            <>
              <li>• Select numeric columns for both X and Y axes</li>
              <li>• Best for time series or ordered data</li>
            </>
          )}
          {selectedChartType === 'heatmap' && (
            <li>• Shows correlation matrix of all numeric columns</li>
          )}
        </ul>
      </div>
    </div>
  );
};
