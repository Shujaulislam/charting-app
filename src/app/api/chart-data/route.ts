/**
 * Chart Data API Route
 * Handles requests for chart data with support for different chart types and aggregations
 * Includes validation, data transformation, and error handling
 */

import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import { ChartType, ChartAggregation } from '@/types';

// Valid chart types
const VALID_CHART_TYPES: ChartType[] = ['bar', 'line', 'pie', 'histogram'];

/**
 * Validates if a string is a valid SQL identifier
 * Prevents SQL injection by checking for unsafe characters
 */
function isValidIdentifier(str: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(str);
}

/**
 * Gets the appropriate SQL aggregation function based on aggregation type and data type
 */
function getAggregationFunction(aggregation: ChartAggregation, dataType: string): string {
  if (aggregation === 'none') return '';
  
  switch (aggregation) {
    case 'sum':
      return 'SUM';
    case 'avg':
      return 'AVG';
    case 'count':
      return 'COUNT';
    default:
      return '';
  }
}

/**
 * Builds the SQL query based on chart type and configuration
 */
async function buildChartQuery(
  table: string,
  xAxis: string,
  yAxes: string[],
  chartType: ChartType,
  aggregation: ChartAggregation
): Promise<string> {
  // Get column types from information schema
  const typeQuery = `
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = ? AND COLUMN_NAME IN (${[xAxis, ...yAxes].map(() => '?').join(',')})
  `;
  const columnTypes = await executeQuery<Array<{COLUMN_NAME: string; DATA_TYPE: string}>>(
    typeQuery, 
    [table, xAxis, ...yAxes]
  );

  // Special handling for pie charts
  if (chartType === 'pie') {
    const aggFunc = getAggregationFunction(aggregation, 'number');
    return `
      SELECT 
        COALESCE(${xAxis}, 'Unknown') as x,
        ${aggFunc}(${yAxes[0]}) as y
      FROM ${table}
      WHERE ${xAxis} IS NOT NULL
      GROUP BY ${xAxis}
      ORDER BY y DESC
    `;
  }

  // Handle other chart types
  const yAxisQueries = yAxes.map(y => {
    const dataType = columnTypes.find(t => t.COLUMN_NAME === y)?.DATA_TYPE;
    const aggFunc = getAggregationFunction(aggregation, dataType || '');
    return `${aggFunc ? `${aggFunc}(${y})` : y} as "${y}"`;
  });

  return `
    SELECT 
      ${xAxis} as x,
      ${yAxisQueries.join(', ')}
    FROM ${table}
    ${aggregation !== 'none' ? `GROUP BY ${xAxis}` : ''}
    ORDER BY ${xAxis}
  `;
}

/**
 * Validates if a value is a valid chart type
 */
function isValidChartType(value: string): value is ChartType {
  return VALID_CHART_TYPES.includes(value as ChartType);
}

/**
 * Validates if a value is a valid aggregation type
 */
function isValidAggregation(value: string): value is ChartAggregation {
  return ['none', 'sum', 'avg', 'count'].includes(value);
}

/**
 * GET handler for chart data
 * Processes requests and returns formatted data for charts
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const xAxis = searchParams.get('xAxis');
  const yAxis = searchParams.get('yAxis');
  const requestedChartType = searchParams.get('chartType') || '';
  const requestedAggregation = searchParams.get('aggregation') || 'none';

  // Validate required parameters
  if (!table || !xAxis || !yAxis) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  // Validate chart type
  if (!isValidChartType(requestedChartType)) {
    return NextResponse.json(
      { error: 'Invalid chart type' },
      { status: 400 }
    );
  }
  const chartType = requestedChartType;

  // Validate aggregation type
  if (!isValidAggregation(requestedAggregation)) {
    return NextResponse.json(
      { error: 'Invalid aggregation type' },
      { status: 400 }
    );
  }
  const aggregation = requestedAggregation;

  // Validate identifiers to prevent SQL injection
  const yAxes = yAxis.split(',');
  if (![table, xAxis, ...yAxes].every(isValidIdentifier)) {
    return NextResponse.json(
      { error: 'Invalid identifier format' },
      { status: 400 }
    );
  }

  try {
    // Build and execute query
    const query = await buildChartQuery(table, xAxis, yAxes, chartType, aggregation);
    const results = await executeQuery<Record<string, any>[]>(query);

    // Transform results into chart-friendly format
    const chartData = yAxes.map(y => ({
      name: y,
      data: results.map(row => ({
        x: row.x,
        y: row[y]
      }))
    }));

    return NextResponse.json({ data: chartData });
  } catch (error) {
    console.error('Chart data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}

// Constants for data aggregation
const MAX_DATA_POINTS = 50;

// Helper function to get column type from database
async function getColumnType(table: string, column: string): Promise<string> {
  const query = `
    SELECT DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = ? AND COLUMN_NAME = ?
  `;
  const result = await executeQuery<Array<{ DATA_TYPE: string }>>(query, [table, column]);
  return (result[0]?.DATA_TYPE || '').toLowerCase();
}

// Helper function to check if a type is numeric
function isNumericType(dataType: string): boolean {
  const numericTypes = ['int', 'bigint', 'decimal', 'float', 'double', 'numeric'];
  return numericTypes.some(type => dataType.includes(type));
}

// Helper function to check if a type is temporal (date/time)
function isTemporalType(dataType: string): boolean {
  const temporalTypes = ['date', 'time', 'year', 'timestamp'];
  return temporalTypes.some(type => dataType.includes(type));
}

// Helper function to build aggregation query based on data type and size
async function buildAggregatedQuery(
  table: string,
  xAxis: string,
  yAxis: string,
  chartType: string
): Promise<string> {
  const xAxisType = await getColumnType(table, xAxis);
  const yAxisType = await getColumnType(table, yAxis);
  
  // Get total distinct values for x-axis
  const countQuery = `SELECT COUNT(DISTINCT \`${xAxis}\`) as count FROM \`${table}\``;
  const result = await executeQuery<Array<{ count: number }>>(countQuery);
  const count = result[0]?.count || 0;
  
  // If data size is small enough, return non-aggregated query
  if (count <= MAX_DATA_POINTS) {
    return buildChartQuery(table, xAxis, [yAxis], chartType as ChartType, 'none');
  }
  
  // For temporal data, use appropriate date grouping
  if (isTemporalType(xAxisType)) {
    const interval = count > 365 ? 'MONTH' : 'DAY';
    return `
      SELECT 
        DATE_FORMAT(\`${xAxis}\`, ${interval === 'MONTH' ? "'%Y-%m'" : "'%Y-%m-%d'"}) as x,
        ${isNumericType(yAxisType) ? `AVG(\`${yAxis}\`)` : 'COUNT(*)'} as y
      FROM \`${table}\`
      GROUP BY x
      ORDER BY x
    `;
  }
  
  // For numeric x-axis, use binning
  if (isNumericType(xAxisType)) {
    const binSize = Math.ceil(count / MAX_DATA_POINTS);
    return `
      SELECT 
        CONCAT(
          FLOOR(\`${xAxis}\` / ${binSize}) * ${binSize},
          ' - ',
          FLOOR(\`${xAxis}\` / ${binSize}) * ${binSize} + ${binSize}
        ) as x,
        ${isNumericType(yAxisType) ? `AVG(\`${yAxis}\`)` : 'COUNT(*)'} as y
      FROM \`${table}\`
      GROUP BY FLOOR(\`${xAxis}\` / ${binSize})
      ORDER BY FLOOR(\`${xAxis}\` / ${binSize})
    `;
  }
  
  // For categorical data, group by top categories
  return `
    SELECT x, y FROM (
      SELECT 
        \`${xAxis}\` as x,
        ${isNumericType(yAxisType) ? `AVG(\`${yAxis}\`)` : 'COUNT(*)'} as y,
        COUNT(*) as group_size
      FROM \`${table}\`
      GROUP BY \`${xAxis}\`
      ORDER BY group_size DESC
      LIMIT ${MAX_DATA_POINTS}
    ) t
    ORDER BY x
  `;
}

// Helper function to validate continuous data
function isValidContinuousData(dataType: string): boolean {
  return isNumericType(dataType) || isTemporalType(dataType);
}

// Helper function to format date values based on granularity
function getDateFormat(minDate: Date, maxDate: Date): string {
  const diffDays = Math.abs((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) return '%Y-%m-%d %H:%i'; // hourly
  if (diffDays <= 31) return '%Y-%m-%d'; // daily
  if (diffDays <= 365) return '%Y-%m'; // monthly
  return '%Y'; // yearly
}

// Helper function to build line chart query
async function buildLineChartQuery(
  table: string,
  xAxis: string,
  yAxis: string
): Promise<string> {
  const xAxisType = await getColumnType(table, xAxis);
  const yAxisType = await getColumnType(table, yAxis);

  // Validate continuous x-axis data
  if (!isValidContinuousData(xAxisType)) {
    throw new Error(`Line charts require continuous data (numeric or date) for x-axis. Got: ${xAxisType}`);
  }

  // For temporal x-axis, determine date format
  if (isTemporalType(xAxisType)) {
    const [minMaxResult] = await executeQuery<Array<{ min_date: Date; max_date: Date }>>(`
      SELECT 
        MIN(\`${xAxis}\`) as min_date,
        MAX(\`${xAxis}\`) as max_date
      FROM \`${table}\`
      WHERE \`${xAxis}\` IS NOT NULL
    `);

    const dateFormat = getDateFormat(minMaxResult.min_date, minMaxResult.max_date);

    return `
      SELECT 
        DATE_FORMAT(\`${xAxis}\`, '${dateFormat}') as x,
        ${isNumericType(yAxisType) ? `AVG(\`${yAxis}\`)` : 'COUNT(*)'} as y
      FROM \`${table}\`
      WHERE \`${xAxis}\` IS NOT NULL
      GROUP BY x
      ORDER BY MIN(\`${xAxis}\`)
    `;
  }

  // For numeric x-axis, use binning for large datasets
  const [countResult] = await executeQuery<Array<{ count: number }>>(`
    SELECT COUNT(DISTINCT \`${xAxis}\`) as count 
    FROM \`${table}\`
    WHERE \`${xAxis}\` IS NOT NULL
  `);

  if (countResult.count > MAX_DATA_POINTS) {
    return `
      WITH bounds AS (
        SELECT 
          MIN(\`${xAxis}\`) as min_val,
          MAX(\`${xAxis}\`) as max_val,
          (MAX(\`${xAxis}\`) - MIN(\`${xAxis}\`)) / ${MAX_DATA_POINTS} as bin_size
        FROM \`${table}\`
        WHERE \`${xAxis}\` IS NOT NULL
      )
      SELECT 
        ROUND(FLOOR((\`${xAxis}\` - bounds.min_val) / bounds.bin_size) * bounds.bin_size + bounds.min_val, 2) as x,
        ${isNumericType(yAxisType) ? `AVG(\`${yAxis}\`)` : 'COUNT(*)'} as y
      FROM \`${table}\`, bounds
      WHERE \`${xAxis}\` IS NOT NULL
      GROUP BY x
      ORDER BY x
    `;
  }

  // For smaller datasets, use raw values
  return `
    SELECT 
      \`${xAxis}\` as x,
      ${isNumericType(yAxisType) ? `AVG(\`${yAxis}\`)` : 'COUNT(*)'} as y
    FROM \`${table}\`
    WHERE \`${xAxis}\` IS NOT NULL
    GROUP BY \`${xAxis}\`
    ORDER BY \`${xAxis}\`
  `;
}

// Helper to validate input parameters
function validateParams(table: string, xAxis: string, yAxis: string): string | null {
  if (!table || !xAxis || !yAxis) {
    return 'Missing required parameters: table, xAxis, yAxis';
  }
  
  // Basic SQL injection prevention
  const validNameRegex = /^[a-zA-Z0-9_]+$/;
  if (!validNameRegex.test(table) || !validNameRegex.test(xAxis) || !validNameRegex.test(yAxis)) {
    return 'Invalid parameter format';
  }

  return null;
}

// Helper function to validate categorical data
function isValidCategoricalData(values: any[]): boolean {
  // Check if we have a reasonable number of unique categories
  const uniqueValues = new Set(values.map(v => v?.toString())).size;
  return uniqueValues > 1 && uniqueValues <= 50; // Limit to 50 categories for readability
}

// Helper function to transform pie chart data
function transformPieChartData(data: Array<{ x: any; y: number }>) {
  // 1. Group and aggregate data
  const aggregated = data.reduce((acc, curr) => {
    const key = curr.x?.toString() || 'Unknown';
    acc[key] = (acc[key] || 0) + (Number(curr.y) || 0);
    return acc;
  }, {} as Record<string, number>);

  // 2. Sort by value descending
  const sortedEntries = Object.entries(aggregated)
    .sort(([, a], [, b]) => b - a);

  // 3. If we have too many categories, group small ones into "Other"
  const MAX_SLICES = 10;
  let result: Array<{ label: string; value: number }>;
  
  if (sortedEntries.length > MAX_SLICES) {
    // Take top N-1 categories
    result = sortedEntries.slice(0, MAX_SLICES - 1).map(([label, value]) => ({
      label,
      value
    }));
    
    // Group the rest into "Other"
    const otherSum = sortedEntries.slice(MAX_SLICES - 1)
      .reduce((sum, [, value]) => sum + value, 0);
    
    result.push({ label: 'Other', value: otherSum });
  } else {
    result = sortedEntries.map(([label, value]) => ({
      label,
      value
    }));
  }

  // 4. Calculate total and percentages
  const total = result.reduce((sum, { value }) => sum + value, 0);
  
  return result.map(item => ({
    label: item.label,
    value: item.value,
    percentage: (item.value / total) * 100
  }));
}

// Helper function to get distinct count
async function getDistinctCount(table: string, column: string): Promise<number> {
  const query = `SELECT COUNT(DISTINCT \`${column}\`) as count FROM \`${table}\``;
  const result = await executeQuery<Array<{ count: number }>>(query);
  return result[0]?.count || 0;
} 