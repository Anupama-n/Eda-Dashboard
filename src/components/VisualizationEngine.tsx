import React, { useState, useEffect, useRef, forwardRef } from 'react';
import * as d3 from 'd3';

interface ChartConfig {
  type: 'histogram' | 'scatter' | 'bar' | 'pie' | 'line' | 'boxplot' | 'heatmap';
  xColumn?: string;
  yColumn?: string;
  colorColumn?: string;
}

interface VisualizationEngineProps {
  data: any[];
  config: ChartConfig;
  width: number;
  height: number;
}

// FIXED: Added a trailing comma inside the generic type parameters to fix TSX parsing error.
export const VisualizationEngine = forwardRef<SVGSVGElement, VisualizationEngineProps,>(({
  data,
  config,
  width,
  height
}, ref) => {
  // Use the forwarded ref, or create a local one if none is provided.
  const localRef = useRef<SVGSVGElement>(null);
  const svgRef = ref || localRef;

  // State to manage the expanded/modal view
  const [isExpanded, setIsExpanded] = useState(false);
  const expandedSvgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Debug logging
    console.log('VisualizationEngine render:', {
      dataLength: data?.length,
      config,
      dimensions: { width, height },
      sampleData: data?.[0],
      availableColumns: data?.[0] ? Object.keys(data[0]) : []
    });

    if (!svgRef.current) {
      console.warn('SVG ref not available');
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous chart

    if (!data || data.length === 0) {
      renderErrorMessage(svg, 'No data available', width, height);
      return;
    }
    if (!config || !config.type) {
      renderErrorMessage(svg, 'No chart configuration', width, height);
      return;
    }
    if (config.xColumn && !data[0].hasOwnProperty(config.xColumn)) {
      renderErrorMessage(svg, `Column '${config.xColumn}' not found`, width, height);
      return;
    }
    if (config.yColumn && !data[0].hasOwnProperty(config.yColumn)) {
      renderErrorMessage(svg, `Column '${config.yColumn}' not found`, width, height);
      return;
    }

    const margin = { top: 40, right: 40, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) {
      renderErrorMessage(svg, 'Chart area too small', width, height);
      return;
    }

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    try {
      console.log(`Rendering ${config.type} chart`);
      
      switch (config.type) {
        case 'histogram':
          renderHistogram(g, data, config, innerWidth, innerHeight);
          break;
        case 'scatter':
          renderScatterPlot(g, data, config, innerWidth, innerHeight);
          break;
        case 'bar':
          renderBarChart(g, data, config, innerWidth, innerHeight);
          break;
        case 'pie':
          renderPieChart(g, data, config, innerWidth, innerHeight);
          break;
        case 'line':
          renderLineChart(g, data, config, innerWidth, innerHeight);
          break;
        case 'boxplot':
          renderBoxPlot(g, data, config, innerWidth, innerHeight);
          break;
        case 'heatmap':
          renderHeatmap(g, data, config, innerWidth, innerHeight);
          break;
        default:
          renderErrorMessage(g, `Unsupported chart type: ${config.type}`, innerWidth, innerHeight);
          break;
      }
      
      console.log(`Successfully rendered ${config.type} chart`);
      
    } catch (error) {
      console.error('Error rendering chart:', error);
      g.selectAll('*').remove();
      renderErrorMessage(g, 'Error rendering chart', innerWidth, innerHeight);
    }
  }, [data, config, width, height, svgRef]);


  // Function to handle downloading the SVG
  const handleDownloadSVG = () => {
    const svgEl = expandedSvgRef.current;
    if (!svgEl) {
      console.error("Expanded SVG reference not found for download.");
      return;
    }
    
    // Serialize the SVG
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgEl);

    // Add XML declaration
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    
    // Create a Blob
    const blob = new Blob([source], {type: "image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger the download
    const link = document.createElement("a");
    link.href = url;
    link.download = `${config.type}_chart.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Added onClick to expand and cursor style */}
      <div 
        className="w-full overflow-hidden cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="w-full h-auto border border-gray-200 rounded"
          style={{ maxWidth: '100%' }}
        />
      </div>

      {/* Modal for expanded view */}
      {isExpanded && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.content}>
            <div style={modalStyles.header}>
              <button onClick={handleDownloadSVG} style={modalStyles.button}>
                Download SVG
              </button>
              <button onClick={() => setIsExpanded(false)} style={modalStyles.closeButton}>
                ×
              </button>
            </div>
            <div style={modalStyles.chartContainer}>
              {/* Render the chart again, but larger and with a ref for downloading */}
              <VisualizationEngine
                ref={expandedSvgRef}
                data={data}
                config={config}
                width={window.innerWidth * 0.85}
                height={window.innerHeight * 0.8}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
});

// Styles for the modal
const modalStyles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: '#1e1e1e', // Dark background to match VS Code theme
    padding: '20px',
    borderRadius: '8px',
    width: '90vw',
    height: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: '10px',
  },
  button: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: 'auto'
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '2rem',
    color: '#ccc',
    cursor: 'pointer',
    lineHeight: 1,
  },
  chartContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff', // White background for the chart itself
    borderRadius: '4px',
  },
};


// Helper function for consistent error message rendering
function renderErrorMessage(container: any, message: string, width: number, height: number) {
  container.append('text')
    .attr('x', width / 2)
    .attr('y', height / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .style('font-size', '16px')
    .style('fill', '#dc2626')
    .style('font-weight', 'bold')
    .text(message);
}

// ... (all your render... functions like renderHistogram, renderScatterPlot, etc., remain here unchanged)
// [The rest of your existing code for renderHistogram, renderScatterPlot, etc. goes here]
// Helper function to calculate Pearson correlation coefficient
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;

  const sumX = d3.sum(x);
  const sumY = d3.sum(y);
  const sumXY = d3.sum(x.map((xi, i) => xi * y[i]));
  const sumX2 = d3.sum(x.map(xi => xi * xi));
  const sumY2 = d3.sum(y.map(yi => yi * yi));

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

// Histogram
function renderHistogram(g: any, data: any[], config: ChartConfig, width: number, height: number) {
  console.log('Rendering histogram with config:', config);
  
  if (!config.xColumn) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('Please select a column for X-axis');
    return;
  }

  const values = data
    .map(d => d && d[config.xColumn!] !== null ? +d[config.xColumn!] : NaN)
    .filter(d => !isNaN(d));
  
  console.log('Histogram values:', values.slice(0, 5), `(${values.length} total)`);
  
  if (values.length === 0) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('No valid numeric data found');
    return;
  }

  const extent = d3.extent(values) as [number, number];
  const x = d3.scaleLinear()
    .domain(extent)
    .range([0, width]);

  const bins = d3.histogram()
    .domain(x.domain() as [number, number])
    .thresholds(x.ticks(Math.min(20, values.length)))(values);

  const maxBinLength = d3.max(bins, d => d.length) || 0;
  const y = d3.scaleLinear()
    .domain([0, maxBinLength])
    .range([height, 0]);

  // Bars
  g.selectAll('.bar')
    .data(bins)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', (d: any) => x(d.x0))
    .attr('width', (d: any) => Math.max(0, x(d.x1) - x(d.x0) - 1))
    .attr('y', (d: any) => y(d.length))
    .attr('height', (d: any) => height - y(d.length))
    .attr('fill', '#3b82f6')
    .attr('opacity', 0.7);

  // Axes
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));

  g.append('g')
    .call(d3.axisLeft(y));

  // Labels
  g.append('text')
    .attr('transform', `translate(${width / 2}, ${height + 35})`)
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(config.xColumn);

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - 35)
    .attr('x', 0 - (height / 2))
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text('Frequency');
}

// Scatter Plot
function renderScatterPlot(g: any, data: any[], config: ChartConfig, width: number, height: number) {
  console.log('Rendering scatter plot with config:', config);
  
  if (!config.xColumn || !config.yColumn) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('Please select both X and Y columns');
    return;
  }

  const validData = data.filter(d => 
    d && 
    d[config.xColumn!] !== null && 
    d[config.yColumn!] !== null &&
    !isNaN(+d[config.xColumn!]) && 
    !isNaN(+d[config.yColumn!])
  );

  console.log('Scatter plot valid data points:', validData.length);

  if (validData.length === 0) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('No valid data points found');
    return;
  }

  const xExtent = d3.extent(validData, d => +d[config.xColumn!]) as [number, number];
  const yExtent = d3.extent(validData, d => +d[config.yColumn!]) as [number, number];

  const x = d3.scaleLinear()
    .domain(xExtent)
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain(yExtent)
    .range([height, 0]);

  const colorScale = config.colorColumn 
    ? d3.scaleOrdinal(d3.schemeCategory10)
        .domain([...new Set(validData.map(d => d[config.colorColumn!]))])
    : null;

  // Points
  g.selectAll('.dot')
    .data(validData)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('cx', (d: any) => x(+d[config.xColumn!]))
    .attr('cy', (d: any) => y(+d[config.yColumn!]))
    .attr('r', 4)
    .attr('fill', (d: any) => 
      colorScale ? colorScale(d[config.colorColumn!]) : '#3b82f6'
    )
    .attr('opacity', 0.7)
    .on('mouseover', function(_event: any, d: { [x: string]: any; }) {
      // Simple tooltip
      const tooltip = g.append('text')
        .attr('class', 'tooltip')
        .attr('x', x(+d[config.xColumn!]) + 10)
        .attr('y', y(+d[config.yColumn!]) - 10)
        .style('font-size', '12px')
        .style('fill', '#333')
        .style('background', 'white')
        .text(`(${d[config.xColumn!]}, ${d[config.yColumn!]})`);
    })
    .on('mouseout', function() {
      g.selectAll('.tooltip').remove();
    });

  // Axes
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));

  g.append('g')
    .call(d3.axisLeft(y));

  // Labels
  g.append('text')
    .attr('transform', `translate(${width / 2}, ${height + 35})`)
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(config.xColumn);

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - 35)
    .attr('x', 0 - (height / 2))
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(config.yColumn);
}

// Bar Chart
function renderBarChart(g: any, data: any[], config: ChartConfig, width: number, height: number) {
  console.log('Rendering bar chart with config:', config);
  
  if (!config.xColumn || !config.yColumn) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('Please select both X and Y columns');
    return;
  }

  // Filter valid data
  const validData = data.filter(d => 
    d && 
    d[config.xColumn!] !== null && 
    d[config.yColumn!] !== null &&
    !isNaN(+d[config.yColumn!])
  );

  console.log('Bar chart valid data points:', validData.length);

  if (validData.length === 0) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('No valid data found');
    return;
  }

  // Aggregate data
  const aggregated = d3.rollup(
    validData,
    v => d3.sum(v, d => +d[config.yColumn!]),
    d => String(d[config.xColumn!])
  );

  const chartData = Array.from(aggregated, ([key, value]) => ({ key, value }));

  if (chartData.length === 0) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('No data to aggregate');
    return;
  }

  const x = d3.scaleBand()
    .domain(chartData.map(d => d.key))
    .range([0, width])
    .padding(0.1);

  const maxValue = d3.max(chartData, d => d.value) || 0;
  const y = d3.scaleLinear()
    .domain([0, maxValue])
    .range([height, 0]);

  // Bars
  g.selectAll('.bar')
    .data(chartData)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', (d: any) => x(d.key) || 0)
    .attr('width', x.bandwidth())
    .attr('y', (d: any) => y(d.value))
    .attr('height', (d: any) => height - y(d.value))
    .attr('fill', '#3b82f6');

  // Axes
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));

  g.append('g')
    .call(d3.axisLeft(y));

  // Labels
  g.append('text')
    .attr('transform', `translate(${width / 2}, ${height + 35})`)
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(config.xColumn);

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - 35)
    .attr('x', 0 - (height / 2))
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(config.yColumn);
}

// Pie Chart
function renderPieChart(g: any, data: any[], config: ChartConfig, width: number, height: number) {
  console.log('Rendering pie chart with config:', config);
  
  if (!config.xColumn) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('Please select a column');
    return;
  }

  const validData = data.filter(d => d && d[config.xColumn!] !== null);

  console.log('Pie chart valid data points:', validData.length);

  if (validData.length === 0) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('No valid data found');
    return;
  }

  const counts = d3.rollup(
    validData,
    v => v.length,
    d => String(d[config.xColumn!])
  );

  const chartData = Array.from(counts, ([key, value]) => ({ key, value }));

  const radius = Math.min(width, height) / 2;
  const pie = d3.pie<any>().value(d => d.value);
  const arc = d3.arc().innerRadius(0).outerRadius(radius - 10);

  const color = d3.scaleOrdinal()
  .domain(chartData.map(d => d.key))
  .range(['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']);

  const pieData = pie(chartData);

  g.attr('transform', `translate(${width / 2}, ${height / 2})`);

  // Arcs
  const arcs = g.selectAll('.arc')
    .data(pieData)
    .enter().append('g')
    .attr('class', 'arc');

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', (d: any, i: number) => color(i.toString()));

  // Labels
  arcs.append('text')
    .attr('transform', (d: any) => `translate(${arc.centroid(d)})`)
    .attr('dy', '0.35em')
    .style('text-anchor', 'middle')
    .style('font-size', '10px')
    .text((d: any) => d.data.key);
}

// Line Chart
function renderLineChart(g: any, data: any[], config: ChartConfig, width: number, height: number) {
  console.log('Rendering line chart with config:', config);
  
  if (!config.xColumn || !config.yColumn) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('Please select both X and Y columns');
    return;
  }

  const validData = data.filter(d => 
    d && 
    d[config.xColumn!] !== null && 
    d[config.yColumn!] !== null &&
    !isNaN(+d[config.xColumn!]) && 
    !isNaN(+d[config.yColumn!])
  ).sort((a, b) => +a[config.xColumn!] - +b[config.xColumn!]);

  console.log('Line chart valid data points:', validData.length);

  if (validData.length === 0) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('No valid data points found');
    return;
  }

  const xExtent = d3.extent(validData, d => +d[config.xColumn!]) as [number, number];
  const yExtent = d3.extent(validData, d => +d[config.yColumn!]) as [number, number];

  const x = d3.scaleLinear()
    .domain(xExtent)
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain(yExtent)
    .range([height, 0]);

  const line = d3.line<any>()
    .x(d => x(+d[config.xColumn!]))
    .y(d => y(+d[config.yColumn!]));

  // Line
  g.append('path')
    .datum(validData)
    .attr('fill', 'none')
    .attr('stroke', '#3b82f6')
    .attr('stroke-width', 2)
    .attr('d', line);

  // Points
  g.selectAll('.dot')
    .data(validData)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('cx', (d: any) => x(+d[config.xColumn!]))
    .attr('cy', (d: any) => y(+d[config.yColumn!]))
    .attr('r', 3)
    .attr('fill', '#3b82f6');

  // Axes
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));

  g.append('g')
    .call(d3.axisLeft(y));

  // Labels
  g.append('text')
    .attr('transform', `translate(${width / 2}, ${height + 35})`)
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(config.xColumn);

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - 35)
    .attr('x', 0 - (height / 2))
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(config.yColumn);
}

// Box Plot
function renderBoxPlot(g: any, data: any[], config: ChartConfig, width: number, height: number) {
  console.log('Rendering box plot with config:', config);
  
  if (!config.xColumn) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('Please select a column');
    return;
  }

  const values = data
    .map(d => d && d[config.xColumn!] !== null ? +d[config.xColumn!] : NaN)
    .filter(d => !isNaN(d))
    .sort(d3.ascending);
  
  console.log('Box plot values:', values.slice(0, 5), `(${values.length} total)`);
  
  if (values.length === 0) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text('No valid numeric data found');
    return;
  }

  const q1 = d3.quantile(values, 0.25) || 0;
  const median = d3.quantile(values, 0.5) || 0;
  const q3 = d3.quantile(values, 0.75) || 0;
  const min = values[0];
  const max = values[values.length - 1];

  const y = d3.scaleLinear()
    .domain([min, max])
    .range([height, 0]);

  const boxWidth = width * 0.3;
  const boxX = (width - boxWidth) / 2;

  // Box
  g.append('rect')
    .attr('x', boxX)
    .attr('y', y(q3))
    .attr('width', boxWidth)
    .attr('height', y(q1) - y(q3))
    .attr('fill', '#3b82f6')
    .attr('opacity', 0.7);

  // Median line
  g.append('line')
    .attr('x1', boxX)
    .attr('x2', boxX + boxWidth)
    .attr('y1', y(median))
    .attr('y2', y(median))
    .attr('stroke', 'white')
    .attr('stroke-width', 2);

  // Whiskers
  g.append('line')
    .attr('x1', boxX + boxWidth / 2)
    .attr('x2', boxX + boxWidth / 2)
    .attr('y1', y(min))
    .attr('y2', y(q1))
    .attr('stroke', '#3b82f6')
    .attr('stroke-width', 1);

  g.append('line')
    .attr('x1', boxX + boxWidth / 2)
    .attr('x2', boxX + boxWidth / 2)
    .attr('y1', y(q3))
    .attr('y2', y(max))
    .attr('stroke', '#3b82f6')
    .attr('stroke-width', 1);

  // Whisker caps
  [min, max].forEach(val => {
    g.append('line')
      .attr('x1', boxX + boxWidth * 0.25)
      .attr('x2', boxX + boxWidth * 0.75)
      .attr('y1', y(val))
      .attr('y2', y(val))
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 1);
  });

  // Y axis
  g.append('g')
    .attr('transform', `translate(${boxX - 10}, 0)`)
    .call(d3.axisLeft(y));

  // Label
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', boxX - 40)
    .attr('x', 0 - (height / 2))
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(config.xColumn);
}

// Heatmap (correlation matrix)
// Heatmap (correlation matrix)
function renderHeatmap(g: any, data: any[], config: ChartConfig, width: number, height: number) {
  console.log('Rendering heatmap with config:', config);
  
  if (!data || data.length === 0) {
    renderErrorMessage(g, 'No data available', width, height);
    return;
  }

  const sampleRow = data[0];
  const numericColumns = Object.keys(sampleRow).filter(key => 
    data.every(d => d && d[key] !== null && !isNaN(+d[key]))
  );

  console.log('Heatmap numeric columns:', numericColumns);

  if (numericColumns.length < 2) {
    renderErrorMessage(g, 'Need at least 2 numeric columns', width, height);
    return;
  }
  
  // FIXED: Explicitly define padding for labels to prevent clipping.
  const labelPadding = 100; // Generous space for long/rotated labels

  // FIXED: Adjust grid size to account for the new padding.
  const gridSize = Math.min(width - labelPadding, height - labelPadding);
  const cellSize = Math.max(10, gridSize / numericColumns.length); // Ensure cells are not too small
  
  const correlations: number[][] = [];
  numericColumns.forEach((col1, i) => {
    correlations[i] = [];
    numericColumns.forEach((col2, j) => {
      if (i === j) {
        correlations[i][j] = 1;
        return;
      }
      const values1 = data.map(d => +d[col1]);
      const values2 = data.map(d => +d[col2]);
      correlations[i][j] = pearsonCorrelation(values1, values2);
    });
  });

  const colorScale = d3.scaleSequential(d3.interpolateRdYlBu).domain([1, -1]);

  // Cells
  numericColumns.forEach((col1, i) => {
    numericColumns.forEach((col2, j) => {
      // FIXED: Add labelPadding to x and y attributes to offset the grid.
      g.append('rect')
        .attr('x', labelPadding + j * cellSize)
        .attr('y', labelPadding + i * cellSize)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('fill', colorScale(correlations[i][j]))
        .attr('stroke', '#333')
        .attr('stroke-width', 0.5);

      // Correlation value text
      g.append('text')
        .attr('x', labelPadding + j * cellSize + cellSize / 2)
        .attr('y', labelPadding + i * cellSize + cellSize / 2)
        .attr('dy', '0.35em')
        .style('text-anchor', 'middle')
        .style('font-size', Math.min(12, cellSize / 3) + 'px')
        .style('fill', Math.abs(correlations[i][j]) > 0.6 ? 'white' : 'black')
        .text(correlations[i][j].toFixed(2));
    });
  });

  // Column labels (top, X-axis)
  numericColumns.forEach((col, i) => {
    const xPos = labelPadding + i * cellSize + cellSize / 2;
    const yPos = labelPadding - 10;
    g.append('text')
      .attr('transform', `translate(${xPos}, ${yPos}) rotate(-45)`)
      .style('text-anchor', 'start')
      .style('font-size', Math.min(12, cellSize / 2.5) + 'px')
      .style('font-weight', 'bold')
      .text(col);
  });

  // Row labels (left, Y-axis) - THIS IS THE PART THAT WASN'T SHOWING
  numericColumns.forEach((col, i) => {
    g.append('text')
      .attr('x', labelPadding - 10)
      .attr('y', labelPadding + i * cellSize + cellSize / 2)
      .attr('dy', '0.35em')
      .style('text-anchor', 'end')
      .style('font-size', Math.min(12, cellSize / 2.5) + 'px')
      .style('font-weight', 'bold')
      .text(col);
  });
}