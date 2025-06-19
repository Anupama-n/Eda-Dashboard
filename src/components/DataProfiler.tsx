import React from 'react';
import { Database, BarChart3, AlertTriangle, Hash } from 'lucide-react';
import type { Dataset } from '../types';

interface DataProfilerProps {
  dataset: Dataset;
}

export const DataProfiler: React.FC<DataProfilerProps> = ({ dataset }) => {
  // Add null/undefined checks with fallback values
  const data = dataset?.data || [];
  const columns = dataset?.columns || [];
  const rowCount = dataset?.rowCount || 0;
  const columnCount = dataset?.columnCount || 0;

  const totalMissing = columns.reduce((sum, col) => sum + (col?.missingCount || 0), 0);
  const missingPercentage = rowCount > 0 && columnCount > 0 
    ? ((totalMissing / (rowCount * columnCount)) * 100).toFixed(1)
    : '0.0';

  const typeDistribution = columns.reduce((acc, col) => {
    if (col?.type) {
      acc[col.type] = (acc[col.type] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const getTypeColor = (type: string) => {
    const colors = {
      numeric: 'bg-blue-100 text-blue-800',
      categorical: 'bg-green-100 text-green-800',
      datetime: 'bg-purple-100 text-purple-800',
      text: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'numeric':
        return <Hash className="h-4 w-4" />;
      case 'categorical':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  // Show loading state if dataset is not properly loaded
  if (!dataset || !dataset.name) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading dataset...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Dataset Overview</h2>
        <p className="text-gray-600 mb-4">
          <strong>{dataset.name}</strong> - Basic statistics and column information
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-blue-900">{rowCount.toLocaleString()}</p>
              <p className="text-blue-700 text-sm">Rows</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-green-900">{columnCount}</p>
              <p className="text-green-700 text-sm">Columns</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-yellow-900">{totalMissing.toLocaleString()}</p>
              <p className="text-yellow-700 text-sm">Missing Values ({missingPercentage}%)</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Hash className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-purple-900">
                {columns.reduce((sum, col) => sum + (col?.uniqueCount || 0), 0).toLocaleString()}
              </p>
              <p className="text-purple-700 text-sm">Total Unique Values</p>
            </div>
          </div>
        </div>
      </div>

      {/* Column Type Distribution */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Column Types</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(typeDistribution).map(([type, count]) => (
            <div
              key={type}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(type)}`}
            >
              {getTypeIcon(type)}
              <span className="ml-1 capitalize">{type}</span>
              <span className="ml-2 bg-white bg-opacity-50 px-2 py-0.5 rounded-full text-xs">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Column Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Column Details</h3>
        {columns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Column Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Missing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unique
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sample Values
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {columns.map((column, index) => {
                  const sampleValues = data
                    .slice(0, 5)
                    .map(row => row?.[column?.name])
                    .filter(val => val !== null && val !== undefined)
                    .map(val => String(val).substring(0, 20));

                  const missingCount = column?.missingCount || 0;
                  const uniqueCount = column?.uniqueCount || 0;
                  const missingPercentage = rowCount > 0 
                    ? ((missingCount / rowCount) * 100).toFixed(1)
                    : '0.0';

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {column?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(column?.type || 'unknown')}`}>
                          {getTypeIcon(column?.type || 'unknown')}
                          <span className="ml-1 capitalize">{column?.type || 'unknown'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {missingCount} ({missingPercentage}%)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {uniqueCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {sampleValues.join(', ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No columns found in dataset
          </div>
        )}
      </div>
    </div>
  );
};
