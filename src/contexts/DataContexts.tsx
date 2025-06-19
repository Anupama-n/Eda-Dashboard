import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Action types
const ActionTypes = {
  SET_DATASET: 'SET_DATASET',
  SET_ACTIVE_CHART: 'SET_ACTIVE_CHART',
  ADD_CHART: 'ADD_CHART',
  UPDATE_CHART: 'UPDATE_CHART',
  REMOVE_CHART: 'REMOVE_CHART',
  SET_FILTER: 'SET_FILTER',
  CLEAR_FILTER: 'CLEAR_FILTER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_STATE: 'RESET_STATE'
};

// Initial state
const initialState = {
  dataset: null,
  charts: [],
  activeChartId: null,
  filters: {},
  filteredData: null,
  isLoading: false,
  error: null,
  history: []
};

// Reducer function
function dataReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_DATASET:
      return {
        ...state,
        dataset: action.payload,
        filteredData: action.payload?.data || null,
        charts: [],
        activeChartId: null,
        filters: {},
        error: null,
        history: [...state.history, {
          action: 'dataset_loaded',
          timestamp: new Date().toISOString(),
          filename: action.payload?.filename
        }]
      };

    case ActionTypes.SET_ACTIVE_CHART:
      return {
        ...state,
        activeChartId: action.payload
      };

    case ActionTypes.ADD_CHART:
      const newChart = {
        id: `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        ...action.payload
      };
      return {
        ...state,
        charts: [...state.charts, newChart],
        activeChartId: newChart.id,
        history: [...state.history, {
          action: 'chart_added',
          timestamp: new Date().toISOString(),
          chartType: newChart.type,
          chartId: newChart.id
        }]
      };

    case ActionTypes.UPDATE_CHART:
      return {
        ...state,
        charts: state.charts.map(chart =>
          chart.id === action.payload.id
            ? { ...chart, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : chart
        ),
        history: [...state.history, {
          action: 'chart_updated',
          timestamp: new Date().toISOString(),
          chartId: action.payload.id
        }]
      };

    case ActionTypes.REMOVE_CHART:
      const updatedCharts = state.charts.filter(chart => chart.id !== action.payload);
      return {
        ...state,
        charts: updatedCharts,
        activeChartId: state.activeChartId === action.payload 
          ? (updatedCharts.length > 0 ? updatedCharts[0].id : null)
          : state.activeChartId,
        history: [...state.history, {
          action: 'chart_removed',
          timestamp: new Date().toISOString(),
          chartId: action.payload
        }]
      };

    case ActionTypes.SET_FILTER:
      const newFilters = { ...state.filters, [action.payload.column]: action.payload.filter };
      const filteredData = applyFilters(state.dataset?.data, newFilters);
      return {
        ...state,
        filters: newFilters,
        filteredData,
        history: [...state.history, {
          action: 'filter_applied',
          timestamp: new Date().toISOString(),
          column: action.payload.column,
          filter: action.payload.filter
        }]
      };

    case ActionTypes.CLEAR_FILTER:
      const clearedFilters = { ...state.filters };
      delete clearedFilters[action.payload];
      const newFilteredData = applyFilters(state.dataset?.data, clearedFilters);
      return {
        ...state,
        filters: clearedFilters,
        filteredData: newFilteredData,
        history: [...state.history, {
          action: 'filter_cleared',
          timestamp: new Date().toISOString(),
          column: action.payload
        }]
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case ActionTypes.RESET_STATE:
      return {
        ...initialState,
        history: [...state.history, {
          action: 'state_reset',
          timestamp: new Date().toISOString()
        }]
      };

    default:
      return state;
  }
}

// Helper function to apply filters to data
function applyFilters(data, filters) {
  if (!data || Object.keys(filters).length === 0) {
    return data;
  }

  return data.filter(row => {
    return Object.entries(filters).every(([column, filter]) => {
      const value = row[column];
      
      switch (filter.type) {
        case 'equals':
          return value === filter.value;
        
        case 'not_equals':
          return value !== filter.value;
        
        case 'contains':
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        
        case 'not_contains':
          return !String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        
        case 'greater_than':
          return Number(value) > Number(filter.value);
        
        case 'less_than':
          return Number(value) < Number(filter.value);
        
        case 'greater_equal':
          return Number(value) >= Number(filter.value);
        
        case 'less_equal':
          return Number(value) <= Number(filter.value);
        
        case 'between':
          const numValue = Number(value);
          return numValue >= Number(filter.min) && numValue <= Number(filter.max);
        
        case 'in':
          return filter.values.includes(value);
        
        case 'not_in':
          return !filter.values.includes(value);
        
        case 'is_null':
          return value === null || value === undefined || value === '';
        
        case 'is_not_null':
          return value !== null && value !== undefined && value !== '';
        
        case 'date_after':
          return new Date(value) > new Date(filter.date);
        
        case 'date_before':
          return new Date(value) < new Date(filter.date);
        
        case 'date_between':
          const dateValue = new Date(value);
          return dateValue >= new Date(filter.startDate) && dateValue <= new Date(filter.endDate);
        
        default:
          return true;
      }
    });
  });
}

// Create context
const DataContext = createContext(null);

// Context provider component
export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Action creators
  const setDataset = useCallback((dataset) => {
    dispatch({ type: ActionTypes.SET_DATASET, payload: dataset });
  }, []);

  const setActiveChart = useCallback((chartId) => {
    dispatch({ type: ActionTypes.SET_ACTIVE_CHART, payload: chartId });
  }, []);

  const addChart = useCallback((chartConfig) => {
    dispatch({ type: ActionTypes.ADD_CHART, payload: chartConfig });
  }, []);

  const updateChart = useCallback((chartId, updates) => {
    dispatch({ 
      type: ActionTypes.UPDATE_CHART, 
      payload: { id: chartId, updates } 
    });
  }, []);

  const removeChart = useCallback((chartId) => {
    dispatch({ type: ActionTypes.REMOVE_CHART, payload: chartId });
  }, []);

  const setFilter = useCallback((column, filter) => {
    dispatch({ 
      type: ActionTypes.SET_FILTER, 
      payload: { column, filter } 
    });
  }, []);

  const clearFilter = useCallback((column) => {
    dispatch({ type: ActionTypes.CLEAR_FILTER, payload: column });
  }, []);

  const clearAllFilters = useCallback(() => {
    Object.keys(state.filters).forEach(column => {
      dispatch({ type: ActionTypes.CLEAR_FILTER, payload: column });
    });
  }, [state.filters]);

  const setLoading = useCallback((isLoading) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: isLoading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_STATE });
  }, []);

  // Derived data and computed values
  const getActiveChart = useCallback(() => {
    return state.charts.find(chart => chart.id === state.activeChartId) || null;
  }, [state.charts, state.activeChartId]);

  const getChartById = useCallback((chartId) => {
    return state.charts.find(chart => chart.id === chartId) || null;
  }, [state.charts]);

  const getFilteredData = useCallback(() => {
    return state.filteredData || state.dataset?.data || [];
  }, [state.filteredData, state.dataset]);

  const getColumnData = useCallback((columnName) => {
    const data = getFilteredData();
    return data.map(row => row[columnName]).filter(value => 
      value !== null && value !== undefined && value !== ''
    );
  }, [getFilteredData]);

  const getUniqueValues = useCallback((columnName) => {
    const columnData = getColumnData(columnName);
    return [...new Set(columnData)].sort();
  }, [getColumnData]);

  const getColumnStats = useCallback((columnName) => {
    return state.dataset?.columns.find(col => col.name === columnName)?.stats || null;
  }, [state.dataset]);

  const hasFilters = Object.keys(state.filters).length > 0;
  const hasData = state.dataset !== null;
  const hasCharts = state.charts.length > 0;

  // Export data functions
  const exportData = useCallback((format = 'csv') => {
    const data = getFilteredData();
    if (!data.length) return null;

    switch (format) {
      case 'csv':
        const headers = Object.keys(data[0]);
        const csvContent = [
          headers.join(','),
          ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');
        return csvContent;

      case 'json':
        return JSON.stringify(data, null, 2);

      default:
        return null;
    }
  }, [getFilteredData]);

  const downloadData = useCallback((filename, format = 'csv') => {
    const content = exportData(format);
    if (!content) return;

    const blob = new Blob([content], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [exportData]);

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Computed properties
    hasFilters,
    hasData,
    hasCharts,
    
    // Actions
    setDataset,
    setActiveChart,
    addChart,
    updateChart,
    removeChart,
    setFilter,
    clearFilter,
    clearAllFilters,
    setLoading,
    setError,
    clearError,
    resetState,
    
    // Data access functions
    getActiveChart,
    getChartById,
    getFilteredData,
    getColumnData,
    getUniqueValues,
    getColumnStats,
    
    // Export functions
    exportData,
    downloadData
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use the data context
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Selector hooks for performance optimization
export const useDataset = () => {
  const { dataset } = useData();
  return dataset;
};

export const useCharts = () => {
  const { charts } = useData();
  return charts;
};

export const useActiveChart = () => {
  const { getActiveChart } = useData();
  return getActiveChart();
};

export const useFilters = () => {
  const { filters, setFilter, clearFilter, clearAllFilters } = useData();
  return { filters, setFilter, clearFilter, clearAllFilters };
};

export const useFilteredData = () => {
  const { getFilteredData } = useData();
  return getFilteredData();
};

// HOC for components that need data context
export const withDataContext = (Component) => {
  return function WrappedComponent(props) {
    return (
      <DataProvider>
        <Component {...props} />
      </DataProvider>
    );
  };
};
