# Charting Library Analysis and Recommendations

## Current Implementation (Recharts)

### Data Flow
Currently, we're not properly passing data to our charts. In `DashboardLayout.tsx`:
```typescript
<ChartWrapper
  data={[]} // Empty data array
  type={chartType}
  xAxis={chartConfig.xAxis}
  yAxis={chartConfig.yAxis}
/>
```

### Limitations
1. Manual data transformation required
2. Need to handle different chart types separately
3. No built-in statistical functions
4. Limited automatic scaling and binning

## Plotly.js Analysis

### Advantages
1. **Automatic Data Handling**
   ```javascript
   // Plotly automatically handles data format
   Plotly.newPlot('chart', [{
     x: sqlResults.map(r => r.created_at),
     y: sqlResults.map(r => r.count),
     type: 'bar'
   }]);
   ```

2. **Statistical Functions**
   - Built-in aggregations
   - Box plots
   - Histograms with automatic binning
   - Contour plots
   - 3D visualizations

3. **SQL Integration Example**
   ```typescript
   // Simple SQL query, Plotly handles the rest
   const query = `
     SELECT created_at, message_status, COUNT(*) as count 
     FROM messages 
     GROUP BY created_at, message_status
   `;
   
   // Plotly automatically creates stacked bar chart
   Plotly.newPlot('chart', {
     data: sqlResults,
     type: 'bar',
     mode: 'stack'
   });
   ```

4. **Interactive Features**
   - Zoom
   - Pan
   - Hover tooltips
   - Click events
   - Modebar

5. **Chart Types**
   - 40+ basic chart types
   - Statistical charts
   - Scientific visualizations
   - Financial charts

### Implementation Size
- Core: ~3MB
- Basic: ~800KB (with limited features)
- Full: ~5MB (all features)

## Alternative Libraries

### 1. Apache ECharts
#### Advantages
- Lighter than Plotly (~600KB)
- Excellent performance with large datasets
- Built-in data transforms

```typescript
// ECharts automatic data handling
option = {
  dataset: {
    source: sqlResults
  },
  transform: {
    type: 'aggregate',
    config: { type: 'sum' }
  }
};
```

### 2. Chart.js + chartjs-adapter-date-fns
#### Advantages
- Lightweight (~86KB)
- Simple API
- Good animation support

```typescript
new Chart(ctx, {
  type: 'bar',
  data: sqlResults,
  options: {
    parsing: {
      xAxisKey: 'created_at',
      yAxisKey: 'count'
    }
  }
});
```

### 3. Observable Plot
#### Advantages
- Modern D3-based library
- Excellent data transformation capabilities
- Built for data science

```typescript
Plot.plot({
  marks: [
    Plot.barY(sqlResults, {
      x: "created_at",
      y: "count",
      fill: "message_status"
    })
  ]
});
```

## Recommendation for Your Use Case

### Option 1: Plotly.js Implementation
```typescript
// src/components/charts/PlotlyChart.tsx
import Plot from 'react-plotly.js';

interface PlotlyChartProps {
  data: any[];
  chartType: string;
  xField: string;
  yField: string;
}

export function PlotlyChart({ data, chartType, xField, yField }: PlotlyChartProps) {
  const getChartConfig = () => {
    switch(chartType) {
      case 'bar':
        return {
          type: 'bar',
          mode: 'markers'
        };
      case 'line':
        return {
          type: 'scatter',
          mode: 'lines+markers'
        };
      case 'pie':
        return {
          type: 'pie',
          labels: data.map(d => d[xField]),
          values: data.map(d => d[yField])
        };
      case 'histogram':
        return {
          type: 'histogram',
          x: data.map(d => d[xField])
        };
      default:
        return { type: 'bar' };
    }
  };

  return (
    <Plot
      data={[{
        x: data.map(d => d[xField]),
        y: data.map(d => d[yField]),
        ...getChartConfig()
      }]}
      layout={{
        autosize: true,
        margin: { t: 20, r: 20, b: 30, l: 40 },
        height: 400
      }}
      config={{
        responsive: true,
        displayModeBar: false
      }}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
```

### Option 2: Apache ECharts Implementation
```typescript
// src/components/charts/EChart.tsx
import ReactECharts from 'echarts-for-react';

interface EChartProps {
  data: any[];
  chartType: string;
  xField: string;
  yField: string;
}

export function EChart({ data, chartType, xField, yField }: EChartProps) {
  const getOption = () => {
    const baseOption = {
      dataset: {
        source: data
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: data.map(d => d[xField])
      },
      yAxis: {
        type: 'value'
      }
    };

    switch(chartType) {
      case 'bar':
        return {
          ...baseOption,
          series: [{ type: 'bar' }]
        };
      case 'line':
        return {
          ...baseOption,
          series: [{ type: 'line' }]
        };
      case 'pie':
        return {
          series: [{
            type: 'pie',
            data: data.map(d => ({
              name: d[xField],
              value: d[yField]
            }))
          }]
        };
      default:
        return baseOption;
    }
  };

  return (
    <ReactECharts
      option={getOption()}
      style={{ height: '400px', width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
}
```

## SQL Query Patterns for Different Charts

### Time Series Data
```sql
-- Plotly/ECharts will handle the time formatting
SELECT 
  DATE_FORMAT(created_at, '%Y-%m-%d') as date,
  COUNT(*) as count,
  message_status
FROM messages
GROUP BY DATE(created_at), message_status
ORDER BY date;
```

### Categorical Data
```sql
-- Library will handle stacking/grouping
SELECT 
  message_status,
  COUNT(*) as count
FROM messages
GROUP BY message_status;
```

### Histogram Data
```sql
-- Let the library handle binning
SELECT HOUR(created_at) as hour
FROM messages;
```

## Migration Steps

1. Install chosen library:
```bash
# For Plotly
npm install plotly.js-dist react-plotly.js @types/plotly.js

# For ECharts
npm install echarts echarts-for-react
```

2. Replace ChartWrapper with new component

3. Update API endpoint to return raw aggregated data:
```typescript
// pages/api/chart-data.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { table, chartType, xAxis, yAxis } = Object.fromEntries(searchParams);

  const query = buildQueryForChartType(chartType, table, xAxis, yAxis);
  const results = await executeQuery(query);

  // Return raw data - let the chart library handle the rest
  return NextResponse.json(results);
}
```

## Conclusion

For your specific use case with SQL data and multiple chart types, I recommend:

1. **Primary Recommendation: Apache ECharts**
   - Better performance than Plotly
   - Smaller bundle size
   - Excellent SQL data integration
   - Built-in transformations
   - Strong TypeScript support

2. **Alternative: Plotly.js**
   - If you need more advanced statistical features
   - Better documentation
   - More community resources
   - Scientific visualization capabilities

The choice depends on your specific needs:
- For basic business charts: ECharts
- For statistical/scientific charts: Plotly.js
- For lightweight solutions: Chart.js

Would you like me to help you implement either of these solutions? 