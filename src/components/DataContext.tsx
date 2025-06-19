import React, { createContext, useContext, useState } from 'react';
import type { Dataset, FilterConfig } from '../types';

interface DataContextType {
  dataset: Dataset | null;
  setDataset: (dataset: Dataset | null) => void;
  filters: FilterConfig[];
  setFilters: (filters: FilterConfig[]) => void;
  getFilteredData: () => any[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [filters, setFilters] = useState<FilterConfig[]>([]);

  const getFilteredData = () => {
    if (!dataset) return [];
    
    let filteredData = [...dataset.data];
    
    filters.forEach(filter => {
      filteredData = filteredData.filter(row => {
        const value = row[filter.column];
        
        switch (filter.type) {
          case 'range':
            return value >= filter.value.min && value <= filter.value.max;
          case 'categorical':
            return filter.value.includes(value);
          case 'text':
            return String(value).toLowerCase().includes(filter.value.toLowerCase());
          default:
            return true;
        }
      });
    });
    
    return filteredData;
  };

  return (
    <DataContext.Provider value={{
      dataset,
      setDataset,
      filters,
      setFilters,
      getFilteredData
    }}>
      {children}
    </DataContext.Provider>
  );
};
