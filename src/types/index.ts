export interface Dataset {
  name: string;
  data: Record<string, any>[];
  columns: ColumnInfo[];
  rowCount: number;
  columnCount: number;
}

export interface ColumnInfo {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'text';
  missingCount: number;
  uniqueCount: number;
  stats?: NumericStats | CategoricalStats;
}

export interface NumericStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  std: number;
  q1: number;
  q3: number;
  outliers: number[];
}

export interface CategoricalStats {
  topValues: Array<{ value: string; count: number }>;
  distribution: Record<string, number>;
}

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  xColumn?: string;
  yColumn?: string;
  colorColumn?: string;
  sizeColumn?: string;
  filters?: FilterConfig[];
  options?: ChartOptions;
}

export type ChartType = 
  | 'histogram'
  | 'boxplot'
  | 'scatter'
  | 'bar'
  | 'pie'
  | 'line'
  | 'heatmap'
  | 'violin';

export interface FilterConfig {
  column: string;
  type: 'range' | 'categorical' | 'text';
  value: any;
}

export interface ChartOptions {
  width?: number;
  height?: number;
  bins?: number;
  color?: string;
  showLegend?: boolean;
  logScale?: boolean;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

export interface DataProfile {
  overview: {
    rowCount: number;
    columnCount: number;
    missingTotal: number;
    duplicateRows: number;
  };
  columns: ColumnInfo[];
  correlations?: Record<string, Record<string, number>>;
}

export interface VisualizationProps {
  data: any[];
  config: ChartConfig;
  width?: number;
  height?: number;
}
