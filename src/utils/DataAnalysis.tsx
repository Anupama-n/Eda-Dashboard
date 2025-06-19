import _ from 'lodash';

/**
 * Determines the data type of a column based on its values
 */
export function detectColumnType(values) {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonNullValues.length === 0) return 'unknown';
  
  // Check if all values are numbers
  const numericValues = nonNullValues.filter(v => !isNaN(Number(v)) && isFinite(Number(v)));
  if (numericValues.length === nonNullValues.length) {
    // Check if all numbers are integers
    const isAllIntegers = numericValues.every(v => Number.isInteger(Number(v)));
    return isAllIntegers ? 'integer' : 'float';
  }
  
  // Check if all values are boolean-like
  const booleanValues = nonNullValues.filter(v => 
    typeof v === 'boolean' || 
    (typeof v === 'string' && ['true', 'false', 'yes', 'no', '1', '0'].includes(v.toLowerCase()))
  );
  if (booleanValues.length === nonNullValues.length) {
    return 'boolean';
  }
  
  // Check if values look like dates
  const dateValues = nonNullValues.filter(v => {
    const date = new Date(v);
    return !isNaN(date.getTime());
  });
  if (dateValues.length === nonNullValues.length) {
    return 'date';
  }
  
  return 'string';
}

/**
 * Calculates basic statistics for numeric data
 */
export function calculateNumericStats(values) {
  const numericValues = values
    .map(v => Number(v))
    .filter(v => !isNaN(v) && isFinite(v))
    .sort((a, b) => a - b);
  
  if (numericValues.length === 0) {
    return {
      count: 0,
      mean: null,
      median: null,
      std: null,
      min: null,
      max: null,
      q1: null,
      q3: null,
      variance: null,
      skewness: null,
      kurtosis: null
    };
  }
  
  const count = numericValues.length;
  const mean = _.mean(numericValues);
  const median = count % 2 === 0 
    ? (numericValues[count / 2 - 1] + numericValues[count / 2]) / 2
    : numericValues[Math.floor(count / 2)];
  
  const variance = _.sum(numericValues.map(v => Math.pow(v - mean, 2))) / (count - 1);
  const std = Math.sqrt(variance);
  
  const q1Index = Math.floor(count * 0.25);
  const q3Index = Math.floor(count * 0.75);
  const q1 = numericValues[q1Index];
  const q3 = numericValues[q3Index];
  
  // Calculate skewness (third moment)
  const skewness = count > 2 ? (
    _.sum(numericValues.map(v => Math.pow((v - mean) / std, 3))) / count
  ) : null;
  
  // Calculate kurtosis (fourth moment)
  const kurtosis = count > 3 ? (
    _.sum(numericValues.map(v => Math.pow((v - mean) / std, 4))) / count - 3
  ) : null;
  
  return {
    count,
    mean: Number(mean.toFixed(4)),
    median,
    std: Number(std.toFixed(4)),
    min: numericValues[0],
    max: numericValues[count - 1],
    q1,
    q3,
    variance: Number(variance.toFixed(4)),
    skewness: skewness ? Number(skewness.toFixed(4)) : null,
    kurtosis: kurtosis ? Number(kurtosis.toFixed(4)) : null
  };
}

/**
 * Calculates statistics for categorical data
 */
export function calculateCategoricalStats(values) {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  const valueCounts = _.countBy(nonNullValues);
  const sortedCounts = _.orderBy(Object.entries(valueCounts), [1], ['desc']);
  
  const uniqueCount = Object.keys(valueCounts).length;
  const totalCount = nonNullValues.length;
  const mode = sortedCounts.length > 0 ? sortedCounts[0][0] : null;
  const modeFrequency = sortedCounts.length > 0 ? sortedCounts[0][1] : 0;
  
  return {
    count: totalCount,
    uniqueCount,
    mode,
    modeFrequency,
    valueCounts,
    topValues: sortedCounts.slice(0, 10).map(([value, count]) => ({
      value,
      count,
      percentage: Number(((count / totalCount) * 100).toFixed(2))
    }))
  };
}

/**
 * Detects outliers using IQR method
 */
export function detectOutliers(values) {
  const numericValues = values
    .map(v => Number(v))
    .filter(v => !isNaN(v) && isFinite(v))
    .sort((a, b) => a - b);
  
  if (numericValues.length < 4) return [];
  
  const count = numericValues.length;
  const q1Index = Math.floor(count * 0.25);
  const q3Index = Math.floor(count * 0.75);
  const q1 = numericValues[q1Index];
  const q3 = numericValues[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return numericValues.filter(v => v < lowerBound || v > upperBound);
}

/**
 * Calculates missing data statistics
 */
export function calculateMissingData(values) {
  const total = values.length;
  const missing = values.filter(v => 
    v === null || 
    v === undefined || 
    v === '' || 
    (typeof v === 'string' && v.trim() === '') ||
    (typeof v === 'number' && isNaN(v))
  ).length;
  
  return {
    total,
    missing,
    present: total - missing,
    missingPercentage: Number(((missing / total) * 100).toFixed(2)),
    presentPercentage: Number((((total - missing) / total) * 100).toFixed(2))
  };
}

/**
 * Suggests appropriate chart types based on column types and data characteristics
 */
export function suggestChartTypes(columns) {
  const suggestions = [];
  
  const numericColumns = columns.filter(col => col.type === 'integer' || col.type === 'float');
  const categoricalColumns = columns.filter(col => col.type === 'string' || col.type === 'boolean');
  const dateColumns = columns.filter(col => col.type === 'date');
  
  // Single numeric column - histogram, box plot
  if (numericColumns.length >= 1) {
    suggestions.push({
      type: 'histogram',
      title: 'Distribution Analysis',
      description: 'Shows the distribution of numeric values',
      requiredColumns: { x: numericColumns[0].name },
      priority: 'high'
    });
    
    suggestions.push({
      type: 'boxplot',
      title: 'Box Plot Analysis',
      description: 'Shows quartiles and outliers',
      requiredColumns: { x: numericColumns[0].name },
      priority: 'medium'
    });
  }
  
  // Two numeric columns - scatter plot
  if (numericColumns.length >= 2) {
    suggestions.push({
      type: 'scatter',
      title: 'Correlation Analysis',
      description: 'Shows relationship between two numeric variables',
      requiredColumns: { 
        x: numericColumns[0].name, 
        y: numericColumns[1].name 
      },
      priority: 'high'
    });
  }
  
  // Multiple numeric columns - correlation heatmap
  if (numericColumns.length >= 3) {
    suggestions.push({
      type: 'heatmap',
      title: 'Correlation Matrix',
      description: 'Shows correlations between all numeric variables',
      requiredColumns: {},
      priority: 'medium'
    });
  }
  
  // Categorical and numeric - bar chart
  if (categoricalColumns.length >= 1 && numericColumns.length >= 1) {
    suggestions.push({
      type: 'bar',
      title: 'Category Comparison',
      description: 'Compare numeric values across categories',
      requiredColumns: { 
        x: categoricalColumns[0].name, 
        y: numericColumns[0].name 
      },
      priority: 'high'
    });
  }
  
  // Single categorical - pie chart
  if (categoricalColumns.length >= 1) {
    suggestions.push({
      type: 'pie',
      title: 'Category Distribution',
      description: 'Shows proportion of each category',
      requiredColumns: { x: categoricalColumns[0].name },
      priority: 'medium'
    });
  }
  
  // Time series - line chart
  if (dateColumns.length >= 1 && numericColumns.length >= 1) {
    suggestions.push({
      type: 'line',
      title: 'Time Series Analysis',
      description: 'Shows trends over time',
      requiredColumns: { 
        x: dateColumns[0].name, 
        y: numericColumns[0].name 
      },
      priority: 'high'
    });
  }
  
  return _.orderBy(suggestions, ['priority'], ['desc']);
}

/**
 * Calculates correlation matrix for numeric columns
 */
export function calculateCorrelationMatrix(data, numericColumns) {
  const correlations = {};
  
  numericColumns.forEach(col1 => {
    correlations[col1] = {};
    numericColumns.forEach(col2 => {
      const values1 = data.map(d => Number(d[col1])).filter(v => !isNaN(v) && isFinite(v));
      const values2 = data.map(d => Number(d[col2])).filter(v => !isNaN(v) && isFinite(v));
      
      if (values1.length === values2.length && values1.length > 1) {
        correlations[col1][col2] = pearsonCorrelation(values1, values2);
      } else {
        correlations[col1][col2] = 0;
      }
    });
  });
  
  return correlations;
}

/**
 * Calculates Pearson correlation coefficient
 */
export function pearsonCorrelation(x, y) {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;

  const sumX = _.sum(x);
  const sumY = _.sum(y);
  const sumXY = _.sum(x.map((xi, i) => xi * y[i]));
  const sumX2 = _.sum(x.map(xi => xi * xi));
  const sumY2 = _.sum(y.map(yi => yi * yi));

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : Number((numerator / denominator).toFixed(4));
}

/**
 * Performs basic data quality assessment
 */
export function assessDataQuality(data, columns) {
  const issues = [];
  const warnings = [];
  
  // Check for completely empty columns
  columns.forEach(col => {
    if (col.missingData.missing === col.missingData.total) {
      issues.push(`Column '${col.name}' is completely empty`);
    } else if (col.missingData.missingPercentage > 50) {
      warnings.push(`Column '${col.name}' has ${col.missingData.missingPercentage}% missing data`);
    }
  });
  
  // Check for duplicate rows
  const uniqueRows = _.uniqBy(data, row => JSON.stringify(row));
  const duplicateCount = data.length - uniqueRows.length;
  if (duplicateCount > 0) {
    warnings.push(`Found ${duplicateCount} duplicate rows`);
  }
  
  // Check for columns with very low variance
  const numericColumns = columns.filter(col => col.type === 'integer' || col.type === 'float');
  numericColumns.forEach(col => {
    if (col.stats && col.stats.std !== null && col.stats.std < 0.001) {
      warnings.push(`Column '${col.name}' has very low variance (std: ${col.stats.std})`);
    }
  });
  
  // Check for high cardinality categorical columns
  const categoricalColumns = columns.filter(col => col.type === 'string');
  categoricalColumns.forEach(col => {
    if (col.stats && col.stats.uniqueCount > data.length * 0.8) {
      warnings.push(`Column '${col.name}' has high cardinality (${col.stats.uniqueCount} unique values)`);
    }
  });
  
  return {
    issues,
    warnings,
    overallQuality: issues.length === 0 ? (warnings.length === 0 ? 'excellent' : 'good') : 'poor'
  };
}

/**
 * Main function to analyze a dataset
 */
export function analyzeDataset(data, filename = 'dataset') {
  if (!data || data.length === 0) {
    throw new Error('Dataset is empty or invalid');
  }
  
  // Clean and standardize column names
  const firstRow = data[0];
  const columnNames = Object.keys(firstRow).map(name => 
    name.trim().replace(/\s+/g, '_').toLowerCase()
  );
  
  // Rename columns in data
  const cleanData = data.map(row => {
    const cleanRow = {};
    Object.keys(row).forEach((originalName, index) => {
      cleanRow[columnNames[index]] = row[originalName];
    });
    return cleanRow;
  });
  
  // Analyze each column
  const columns = columnNames.map(name => {
    const values = cleanData.map(row => row[name]);
    const type = detectColumnType(values);
    const missingData = calculateMissingData(values);
    
    let stats = null;
    let outliers = [];
    
    if (type === 'integer' || type === 'float') {
      stats = calculateNumericStats(values);
      outliers = detectOutliers(values);
    } else {
      stats = calculateCategoricalStats(values);
    }
    
    return {
      name,
      type,
      missingData,
      stats,
      outliers: outliers.length > 0 ? outliers.slice(0, 10) : [], // Limit outliers shown
      sampleValues: _.uniq(values.filter(v => v !== null && v !== undefined && v !== '')).slice(0, 5)
    };
  });
  
  // Calculate correlations for numeric columns
  const numericColumnNames = columns
    .filter(col => col.type === 'integer' || col.type === 'float')
    .map(col => col.name);
  
  const correlations = numericColumnNames.length >= 2 
    ? calculateCorrelationMatrix(cleanData, numericColumnNames)
    : {};
  
  // Suggest chart types
  const chartSuggestions = suggestChartTypes(columns);
  
  // Assess data quality
  const qualityAssessment = assessDataQuality(cleanData, columns);
  
  // Generate summary
  const summary = {
    totalRows: cleanData.length,
    totalColumns: columns.length,
    numericColumns: columns.filter(col => col.type === 'integer' || col.type === 'float').length,
    categoricalColumns: columns.filter(col => col.type === 'string' || col.type === 'boolean').length,
    dateColumns: columns.filter(col => col.type === 'date').length,
    missingDataPercentage: Number((_.meanBy(columns, col => col.missingData.missingPercentage)).toFixed(2)),
    duplicateRows: cleanData.length - _.uniqBy(cleanData, row => JSON.stringify(row)).length
  };
  
  return {
    filename,
    data: cleanData,
    columns,
    summary,
    correlations,
    chartSuggestions,
    qualityAssessment,
    metadata: {
      analyzedAt: new Date().toISOString(),
      dataTypes: _.countBy(columns, 'type')
    }
  };
}
