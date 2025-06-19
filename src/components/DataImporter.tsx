import React, { useCallback, useRef, useState } from 'react';
import Papa from 'papaparse';
import type { Dataset, ColumnInfo, NumericStats, CategoricalStats } from '../types';


interface DataImporterProps {
  onDataUpload: (dataset: Dataset) => void;
}

export const DataImporter: React.FC<DataImporterProps> = ({ onDataUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const analyzeColumn = (columnName: string, values: any[]): ColumnInfo => {
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const uniqueValues = [...new Set(nonNullValues)];
    
    // Determine column type
    let type: 'numeric' | 'categorical' | 'datetime' | 'text' = 'text';
    
    // Check if numeric
    const numericValues = nonNullValues.filter(v => !isNaN(Number(v)) && isFinite(Number(v)));
    if (numericValues.length > nonNullValues.length * 0.8) {
      type = 'numeric';
    } else if (uniqueValues.length <= Math.min(20, nonNullValues.length * 0.5)) {
      type = 'categorical';
    } else {
      // Check if datetime
      const dateValues = nonNullValues.filter(v => !isNaN(Date.parse(v)));
      if (dateValues.length > nonNullValues.length * 0.8) {
        type = 'datetime';
      }
    }
    
    // Calculate stats based on type
    let stats: NumericStats | CategoricalStats | undefined;
    
    if (type === 'numeric') {
      const numbers = numericValues.map(v => Number(v)).sort((a, b) => a - b);
      const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      const median = numbers[Math.floor(numbers.length / 2)];
      const q1 = numbers[Math.floor(numbers.length * 0.25)];
      const q3 = numbers[Math.floor(numbers.length * 0.75)];
      const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
      const std = Math.sqrt(variance);
      
      // Simple outlier detection using IQR
      const iqr = q3 - q1;
      const outliers = numbers.filter(n => n < q1 - 1.5 * iqr || n > q3 + 1.5 * iqr);
      
      stats = {
        mean,
        median,
        min: numbers[0],
        max: numbers[numbers.length - 1],
        std,
        q1,
        q3,
        outliers
      };
    } else if (type === 'categorical') {
      const distribution: Record<string, number> = {};
      nonNullValues.forEach(v => {
        const key = String(v);
        distribution[key] = (distribution[key] || 0) + 1;
      });
      
      const topValues = Object.entries(distribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([value, count]) => ({ value, count }));
      
      stats = {
        topValues,
        distribution
      };
    }
    
    return {
      name: columnName,
      type,
      missingCount: values.length - nonNullValues.length,
      uniqueCount: uniqueValues.length,
      stats
    };
  };

  const processCSVFile = useCallback((file: File) => {
    setIsProcessing(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      delimitersToGuess: [',', '\t', '|', ';'],
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          
          const rawData = results.data as Record<string, any>[];
          const columnNames = results.meta.fields || [];
          
          if (rawData.length === 0) {
            alert('The uploaded file appears to be empty or has no valid data.');
            setIsProcessing(false);
            return;
          }
          
          // Clean column names (remove whitespace)
          const cleanColumnNames = columnNames.map(col => col?.toString().trim()).filter(Boolean);
          
          // Analyze each column
          const columns: ColumnInfo[] = cleanColumnNames.map(columnName => {
            const columnValues = rawData.map(row => row[columnName]);
            return analyzeColumn(columnName, columnValues);
          });
          
          const dataset: Dataset = {
            name: file.name.replace('.csv', ''),
            data: rawData,
            columns: columns,
            rowCount: rawData.length,
            columnCount: cleanColumnNames.length
          };
          
          console.log('Processed dataset:', {
            name: dataset.name,
            columns: dataset.columns.map(c => ({ name: c.name, type: c.type })),
            rowCount: dataset.rowCount,
            columnCount: dataset.columnCount,
            sampleData: dataset.data.slice(0, 3)
          });
          
          onDataUpload(dataset);
        } catch (error) {
          console.error('Error processing CSV:', error);
          alert('Error processing the CSV file. Please check the file format.');
        } finally {
          setIsProcessing(false);
        }
      },
      error: (error) => {
        console.error('Papa Parse error:', error);
        alert('Error reading the CSV file: ' + error.message);
        setIsProcessing(false);
      }
    });
  }, [onDataUpload]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file.');
      return;
    }
    
    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('File is too large. Please select a file smaller than 50MB.');
      return;
    }
    
    processCSVFile(file);
  }, [processCSVFile]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Your Dataset
        </h2>
        <p className="text-gray-600">
          Upload a CSV file to begin exploring your data
        </p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={isProcessing ? undefined : handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isProcessing}
        />
        
        <div className="space-y-4">
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <div>
                <p className="text-lg font-medium text-gray-900">Processing file...</p>
                <p className="text-sm text-gray-500">Please wait while we load your data</p>
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl text-gray-400 mb-4">📊</div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {dragActive ? 'Drop your CSV file here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  CSV files up to 50MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p className="font-medium mb-2">Supported formats:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>CSV files with headers</li>
          <li>Common delimiters: comma, tab, semicolon, pipe</li>
          <li>UTF-8 encoding recommended</li>
        </ul>
      </div>
    </div>
  );
};