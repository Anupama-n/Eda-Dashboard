import React, { useState, useCallback } from "react";
import { DataImporter } from ".././src/components/DataImporter";
import { DataProfiler } from ".././src/components/DataProfiler";

import { DashboardLayout } from ".././src/components/DashboardLayout";
import { ControlPanel } from ".././src/components/ControlPanel";
import { DataProvider } from ".././src/contexts/DataContexts";
import type { Dataset, ChartConfig } from "./types";

function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [activeCharts, setActiveCharts] = useState<ChartConfig[]>([]);

  const handleDataUpload = useCallback((data: Dataset) => {
    setDataset(data);
    setActiveCharts([]);
    // Reset charts when new data is uploaded
    console.log("Data uploaded:", data);
  }, []);

  const handleAddChart = useCallback((chartConfig: ChartConfig) => {
    setActiveCharts((prev) => [
      ...prev,
      { ...chartConfig, id: Date.now().toString() },
    ]);
  }, []);

  const handleRemoveChart = useCallback((chartId: string) => {
    setActiveCharts((prev) => prev.filter((chart) => chart.id !== chartId));
  }, []);

  const handleUpdateChart = useCallback(
    (chartId: string, updates: Partial<ChartConfig>) => {
      setActiveCharts((prev) =>
        prev.map((chart) =>
          chart.id === chartId ? { ...chart, ...updates } : chart
        )
      );
    },
    []
  );

  // --- DataAnalysisWithRegression Component ---
  const DataAnalysisWithRegression: React.FC<{ dataset: any }> = ({
    dataset,
  }) => {
    const [xCol, setXCol] = useState<string>("");
    const [yCol, setYCol] = useState<string>("");
    const [result, setResult] = useState<any>(null);

    if (!dataset) return null;

    // Find numeric columns
    const sample = dataset.data?.[0] || {};
    const numericCols = Object.keys(sample).filter(
      (key) => typeof sample[key] === "number"
    );

    // Linear regression (least squares)
    function linearRegression(x: number[], y: number[]) {
      const n = x.length;
      const xMean = x.reduce((a, b) => a + b, 0) / n;
      const yMean = y.reduce((a, b) => a + b, 0) / n;
      let num = 0,
        den = 0;
      for (let i = 0; i < n; i++) {
        num += (x[i] - xMean) * (y[i] - yMean);
        den += (x[i] - xMean) ** 2;
      }
      const slope = num / den;
      const intercept = yMean - slope * xMean;
      // R^2
      const yPred = x.map((xi) => slope * xi + intercept);
      const ssTot = y.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0);
      const ssRes = y.reduce((sum, yi, i) => sum + (yi - yPred[i]) ** 2, 0);
      const r2 = 1 - ssRes / ssTot;
      return { slope, intercept, r2 };
    }

    const handleRunRegression = () => {
      if (!xCol || !yCol) return;
      const x = dataset.data
        .map((row: any) => row[xCol])
        .filter((v: any) => typeof v === "number");
      const y = dataset.data
        .map((row: any) => row[yCol])
        .filter((v: any) => typeof v === "number");
      if (x.length !== y.length || x.length === 0) {
        setResult({
          error: "Selected columns do not have matching numeric data.",
        });
        return;
      }
      const reg = linearRegression(x, y);
      setResult(reg);
    };

    return (
      <div className="p-4 bg-white rounded shadow mt-4">
        <h2 className="text-xl font-bold mb-2">
          Data Analysis: Linear Regression
        </h2>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium">
              X (independent):
            </label>
            <select
              className="border rounded px-2 py-1"
              value={xCol}
              onChange={(e) => setXCol(e.target.value)}
            >
              <option value="">Select column</option>
              {numericCols.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Y (dependent):</label>
            <select
              className="border rounded px-2 py-1"
              value={yCol}
              onChange={(e) => setYCol(e.target.value)}
            >
              <option value="">Select column</option>
              {numericCols.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleRunRegression}
            disabled={!xCol || !yCol}
          >
            Run Regression
          </button>
        </div>
        {result && (
          <div className="mt-4">
            {result.error ? (
              <div className="text-red-600">{result.error}</div>
            ) : (
              <>
                <pre className="bg-gray-100 p-2 rounded text-sm mb-4">
                  {`y = ${result.slope?.toFixed(
                    4
                  )} * x + ${result.intercept?.toFixed(4)}
R² = ${result.r2?.toFixed(4)}`}
                </pre>
                {/* Visualization */}
                <RegressionPlot
                  data={dataset.data}
                  xCol={xCol}
                  yCol={yCol}
                  slope={result.slope}
                  intercept={result.intercept}
                />
              </>
            )}
          </div>
        )}
      </div>
    );
  };
  // --- End DataAnalysisWithRegression ---

  const RegressionPlot: React.FC<{
    data: any[];
    xCol: string;
    yCol: string;
    slope: number;
    intercept: number;
  }> = ({ data, xCol, yCol, slope, intercept }) => {
    // Prepare points
    const points = data
      .map((row) => ({
        x: row[xCol],
        y: row[yCol],
      }))
      .filter((pt) => typeof pt.x === "number" && typeof pt.y === "number");

    if (points.length === 0) return null;

    // Find min/max for scaling
    const xVals = points.map((pt) => pt.x);
    const yVals = points.map((pt) => pt.y);
    const xMin = Math.min(...xVals);
    const xMax = Math.max(...xVals);
    const yMin = Math.min(...yVals);
    const yMax = Math.max(...yVals);

    // SVG size
    const width = 400;
    const height = 300;
    const padding = 40;

    // Scale functions
    const scaleX = (x: number) =>
      padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
    const scaleY = (y: number) =>
      height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding);

    // Regression line endpoints
    const lineX1 = xMin;
    const lineY1 = slope * xMin + intercept;
    const lineX2 = xMax;
    const lineY2 = slope * xMax + intercept;

    return (
      <svg width={width} height={height} className="bg-white border rounded">
        {/* Axes */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#888"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#888"
        />
        {/* Points */}
        {points.map((pt, i) => (
          <circle
            key={i}
            cx={scaleX(pt.x)}
            cy={scaleY(pt.y)}
            r={3}
            fill="#2563eb"
            opacity={0.7}
          />
        ))}
        {/* Regression line */}
        <line
          x1={scaleX(lineX1)}
          y1={scaleY(lineY1)}
          x2={scaleX(lineX2)}
          y2={scaleY(lineY2)}
          stroke="#ef4444"
          strokeWidth={2}
        />
        {/* Axis labels */}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize={12}
          fill="#333"
        >
          {xCol}
        </text>
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          fontSize={12}
          fill="#333"
          transform={`rotate(-90 15,${height / 2})`}
        >
          {yCol}
        </text>
      </svg>
    );
  };

  // --- K-Means Clustering Component ---
  const KMeansClustering: React.FC<{ dataset: Dataset }> = ({ dataset }) => {
    const [xCol, setXCol] = useState<string>('');
    const [yCol, setYCol] = useState<string>('');
    const [k, setK] = useState<number>(3);
    const [clusters, setClusters] = useState<number[]>([]);
    const [centroids, setCentroids] = useState<{x: number, y: number}[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    if (!dataset || !dataset.data) return null;

    // Get numeric columns
    const sample = dataset.data[0] || {};
    const numericCols = Object.keys(sample).filter(
      key => typeof sample[key] === 'number'
    );

    // K-means clustering implementation
    const runKMeans = () => {
      if (!xCol || !yCol) return;
      
      setLoading(true);
      
      // Prepare data points
      const points = dataset.data
        .map(row => ({ 
          x: row[xCol], 
          y: row[yCol] 
        }))
        .filter(pt => typeof pt.x === 'number' && typeof pt.y === 'number');
      
      if (points.length < k) {
        alert(`Need at least ${k} points for clustering`);
        setLoading(false);
        return;
      }
      
      // Initialize centroids randomly
      let centroids = [];
      for (let i = 0; i < k; i++) {
        const randomIndex = Math.floor(Math.random() * points.length);
        centroids.push({ ...points[randomIndex] });
      }
      
      let clusters: number[] = [];
      const maxIterations = 10;
      
      for (let iter = 0; iter < maxIterations; iter++) {
        // Assign points to nearest centroid
        clusters = points.map(p => {
          let minDist = Infinity;
          let clusterIndex = -1;
          
          centroids.forEach((c, idx) => {
            const dist = Math.sqrt((p.x - c.x) ** 2 + (p.y - c.y) ** 2);
            if (dist < minDist) {
              minDist = dist;
              clusterIndex = idx;
            }
          });
          
          return clusterIndex;
        });
        
        // Update centroids
        const newCentroids = centroids.map((_, idx) => {
          const clusterPoints = points.filter((_, i) => clusters[i] === idx);
          if (clusterPoints.length === 0) return centroids[idx]; // Keep previous centroid if no points
          
          const sumX = clusterPoints.reduce((sum, p) => sum + p.x, 0);
          const sumY = clusterPoints.reduce((sum, p) => sum + p.y, 0);
          return {
            x: sumX / clusterPoints.length,
            y: sumY / clusterPoints.length
          };
        });
        
        centroids = newCentroids;
      }
      
      setCentroids(centroids);
      setClusters(clusters);
      setLoading(false);
    };

    return (
      <div className="p-4 bg-white rounded shadow mt-6">
        <h2 className="text-xl font-bold mb-4">
          K-Means Clustering
        </h2>
        
        <div className="flex gap-4 flex-wrap items-end">
          <div>
            <label className="block text-sm font-medium">X Axis:</label>
            <select
              className="border rounded px-2 py-1 w-40"
              value={xCol}
              onChange={e => setXCol(e.target.value)}
            >
              <option value="">Select column</option>
              {numericCols.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium">Y Axis:</label>
            <select
              className="border rounded px-2 py-1 w-40"
              value={yCol}
              onChange={e => setYCol(e.target.value)}
            >
              <option value="">Select column</option>
              {numericCols.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium">Number of Clusters (k):</label>
            <input
              type="number"
              min="2"
              max="10"
              value={k}
              onChange={e => setK(parseInt(e.target.value) || 3)}
              className="border rounded px-2 py-1 w-24"
            />
          </div>
          
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
            onClick={runKMeans}
            disabled={!xCol || !yCol || loading}
          >
            {loading ? 'Clustering...' : 'Run K-Means'}
          </button>
        </div>
        
        {clusters.length > 0 && centroids.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Clustering Result:</h3>
            <ClusterPlot
              points={dataset.data.map(row => ({ x: row[xCol], y: row[yCol] }))}
              clusters={clusters}
              centroids={centroids}
              xLabel={xCol}
              yLabel={yCol}
            />
          </div>
        )}
      </div>
    );
  };

  // --- Cluster Plot Component ---
  const ClusterPlot: React.FC<{
    points: {x: any, y: any}[];
    clusters: number[];
    centroids: {x: number, y: number}[];
    xLabel: string;
    yLabel: string;
  }> = ({ points, clusters, centroids, xLabel, yLabel }) => {
    // Filter out invalid points
    const validPoints = points.filter((pt, i) => 
      typeof pt.x === 'number' && 
      typeof pt.y === 'number' &&
      clusters[i] !== undefined
    );
    
    if (validPoints.length === 0) return null;

    // Find min/max for scaling
    const xVals = validPoints.map(pt => pt.x);
    const yVals = validPoints.map(pt => pt.y);
    const xMin = Math.min(...xVals);
    const xMax = Math.max(...xVals);
    const yMin = Math.min(...yVals);
    const yMax = Math.max(...yVals);

    // SVG size
    const width = 500;
    const height = 400;
    const padding = 50;

    // Scale functions
    const scaleX = (x: number) => 
      padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
    const scaleY = (y: number) => 
      height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding);

    // Color palette for clusters
    const colors = [
      '#3B82F6', // blue
      '#EF4444', // red
      '#10B981', // green
      '#F59E0B', // yellow
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#06B6D4', // cyan
      '#F97316', // orange
      '#8B5CF6', // violet
      '#64748B'  // gray
    ];

    return (
      <div className="flex flex-col items-center">
        <svg width={width} height={height} className="border rounded bg-white">
          {/* Axes */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#ccc"
            strokeWidth={1}
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#ccc"
            strokeWidth={1}
          />
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(t => (
            <line
              key={`xgrid-${t}`}
              x1={padding + t * (width - 2 * padding)}
              y1={padding}
              x2={padding + t * (width - 2 * padding)}
              y2={height - padding}
              stroke="#eee"
              strokeWidth={0.5}
            />
          ))}
          
          {[0, 0.25, 0.5, 0.75, 1].map(t => (
            <line
              key={`ygrid-${t}`}
              x1={padding}
              y1={height - padding - t * (height - 2 * padding)}
              x2={width - padding}
              y2={height - padding - t * (height - 2 * padding)}
              stroke="#eee"
              strokeWidth={0.5}
            />
          ))}
          
          {/* Points */}
          {validPoints.map((pt, i) => (
            <circle
              key={`point-${i}`}
              cx={scaleX(pt.x)}
              cy={scaleY(pt.y)}
              r={4}
              fill={colors[clusters[i] % colors.length]}
              opacity={0.8}
            />
          ))}
          
          {/* Centroids */}
          {centroids.map((c, i) => (
            <circle
              key={`centroid-${i}`}
              cx={scaleX(c.x)}
              cy={scaleY(c.y)}
              r={8}
              fill={colors[i % colors.length]}
              stroke="#333"
              strokeWidth={2}
            />
          ))}
          
          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize={12}
            fill="#333"
          >
            {xLabel}
          </text>
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            fontSize={12}
            fill="#333"
            transform={`rotate(-90 15,${height / 2})`}
          >
            {yLabel}
          </text>
        </svg>
        
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {centroids.map((_, i) => (
            <div key={`legend-${i}`} className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-2" 
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span className="text-sm">Cluster {i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
                <ControlPanel dataset={dataset} onAddChart={handleAddChart} />
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

              {/* Data Analysis Section - Linear Regression */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <DataAnalysisWithRegression dataset={dataset} />
              </div>

              {/* K-Means Clustering Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <KMeansClustering dataset={dataset} />
              </div>

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