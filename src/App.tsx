import React, { useState, useCallback } from 'react';
import { DataImporter } from '.././src/components/DataImporter';
import { DataProfiler } from '.././src/components/DataProfiler';
import { VisualizationEngine } from '.././src/components/VisualizationEngine';
import { DashboardLayout } from '.././src/components/DashboardLayout';
import { ControlPanel } from '.././src/components/ControlPanel';
import { DataProvider } from '.././src/contexts/DataContexts';
import type { Dataset, ChartConfig } from './types';

function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [activeCharts, setActiveCharts] = useState<ChartConfig[]>([]);

  const handleDataUpload = useCallback((data: Dataset) => {
    setDataset(data);
    setActiveCharts([]); // Reset charts when new data is uploaded
  }, []);

  const handleAddChart = useCallback((chartConfig: ChartConfig) => {
    setActiveCharts(prev => [...prev, { ...chartConfig, id: Date.now().toString() }]);
  }, []);

  const handleRemoveChart = useCallback((chartId: string) => {
    setActiveCharts(prev => prev.filter(chart => chart.id !== chartId));
  }, []);

  const handleUpdateChart = useCallback((chartId: string, updates: Partial<ChartConfig>) => {
    setActiveCharts(prev => 
      prev.map(chart => 
        chart.id === chartId ? { ...chart, ...updates } : chart
      )
    );
  }, []);

  return (
    <DataProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              EDA Visualization System
            </h1>
            <p className="text-gray-600 mt-1">
              Upload and explore your data with interactive visualizations
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          {!dataset ? (
            <div className="max-w-2xl mx-auto">
              <DataImporter onDataUpload={handleDataUpload} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Data Overview */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <DataProfiler dataset={dataset} />
              </div>

              {/* Control Panel */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <ControlPanel 
                  dataset={dataset}
                  onAddChart={handleAddChart}
                />
              </div>

              {/* Dashboard */}
              {activeCharts.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <DashboardLayout
                    charts={activeCharts}
                    dataset={dataset}
                    onRemoveChart={handleRemoveChart}
                    onUpdateChart={handleUpdateChart}
                  />
                </div>
              )}

              {/* Reset Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => setDataset(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Upload New Dataset
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </DataProvider>
  );
}

export default App;
