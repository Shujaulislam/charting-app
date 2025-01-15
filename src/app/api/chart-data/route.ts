import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

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
    return buildChartQuery(table, xAxis, yAxis, chartType);
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

// Helper function to build SQL query based on chart type
function buildChartQuery(
  table: string,
  xAxis: string,
  yAxis: string,
  chartType: string
): string {
  // Base query for simple x-y relationship
  const baseQuery = `
    SELECT 
      \`${xAxis}\` as x,
      \`${yAxis}\` as y,
      COUNT(*) as count
    FROM \`${table}\`
    GROUP BY \`${xAxis}\`, \`${yAxis}\`
    ORDER BY \`${xAxis}\`
  `;

  // Specific queries for different chart types
  switch (chartType) {
    case 'pie':
      return `
        SELECT 
          \`${xAxis}\` as x,
          ${isNumericType(yAxis) ? `SUM(\`${yAxis}\`)` : 'COUNT(*)'} as y
        FROM \`${table}\`
        GROUP BY \`${xAxis}\`
        ORDER BY y DESC
      `;

    case 'histogram':
      return `
        SELECT 
          \`${xAxis}\` as value
        FROM \`${table}\`
        WHERE \`${xAxis}\` IS NOT NULL
        ORDER BY \`${xAxis}\`
      `;

    case 'line':
      return `
        SELECT 
          \`${xAxis}\` as x,
          ${isNumericType(yAxis) ? `AVG(\`${yAxis}\`)` : 'COUNT(*)'} as y
        FROM \`${table}\`
        GROUP BY \`${xAxis}\`
        ORDER BY \`${xAxis}\`
      `;

    default:
      // Default to base query for bar charts and others
      return baseQuery;
  }
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

export async function GET(request: Request) {
  try {
    // Extract parameters from URL
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') || '';
    const xAxis = searchParams.get('xAxis') || '';
    const yAxes = (searchParams.get('yAxis') || '').split(',').filter(Boolean);
    const chartType = searchParams.get('chartType') || 'bar';

    // Validate parameters
    if (!table || !xAxis || yAxes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters: table, xAxis, yAxis' },
        { status: 400 }
      );
    }

    // Basic SQL injection prevention
    const validNameRegex = /^[a-zA-Z0-9_]+$/;
    if (!validNameRegex.test(table) || !validNameRegex.test(xAxis) || 
        !yAxes.every(y => validNameRegex.test(y))) {
      return NextResponse.json(
        { error: 'Invalid parameter format' },
        { status: 400 }
      );
    }

    // For pie charts, only allow single y-axis
    if (chartType === 'pie' && yAxes.length > 1) {
      return NextResponse.json(
        { error: 'Pie charts only support a single y-axis' },
        { status: 400 }
      );
    }

    // Get column types for all y-axes
    const yAxisTypes = await Promise.all(
      yAxes.map(async y => ({
        column: y,
        type: await getColumnType(table, y)
      }))
    );

    // For non-pie charts, check if any y-axis is non-numeric
    const nonNumericYAxes = yAxisTypes.filter(y => !isNumericType(y.type));
    
    if (chartType !== 'pie' && nonNumericYAxes.length > 0) {
      // Switch to count aggregation for non-numeric y-axes
      const queries = nonNumericYAxes.map(y => `
        SELECT 
          \`${xAxis}\` as x,
          COUNT(*) as y,
          '${y.column}' as series
        FROM \`${table}\`
        GROUP BY \`${xAxis}\`
      `);

      // Add numeric y-axes with their actual values
      const numericYAxes = yAxisTypes.filter(y => isNumericType(y.type));
      queries.push(...numericYAxes.map(y => `
        SELECT 
          \`${xAxis}\` as x,
          AVG(\`${y.column}\`) as y,
          '${y.column}' as series
        FROM \`${table}\`
        GROUP BY \`${xAxis}\`
      `));

      // Combine all queries
      const query = queries.join(' UNION ALL ') + ` ORDER BY x, series`;
      const data = await executeQuery(query);

      // Transform data into series format
      const seriesData = yAxes.map(series => ({
        name: series,
        data: (data as any[])
          .filter(d => d.series === series)
          .map(d => ({ x: d.x, y: d.y }))
      }));

      return NextResponse.json({
        data: seriesData,
        chartType,
        xAxis,
        yAxes,
        isAggregated: true,
        seriesFormat: true
      });
    }

    // Build and execute query with smart aggregation for each y-axis
    const queries = yAxes.map(async y => {
      const query = await buildAggregatedQuery(table, xAxis, y, chartType);
      return {
        series: y,
        query: query.replace('SELECT', `SELECT '${y}' as series,`)
      };
    });

    const allQueries = await Promise.all(queries);
    const combinedQuery = allQueries.map(q => q.query).join(' UNION ALL ') + ' ORDER BY x, series';
    const data = await executeQuery(combinedQuery);

    // Transform data into series format
    const seriesData = yAxes.map(series => ({
      name: series,
      data: (data as any[])
        .filter(d => d.series === series)
        .map(d => ({ x: d.x, y: d.y }))
    }));

    // Return the formatted data with aggregation info
    return NextResponse.json({
      data: seriesData,
      chartType,
      xAxis,
      yAxes,
      isAggregated: true,
      seriesFormat: true
    });

  } catch (error) {
    console.error('Chart data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}

// Helper function to get distinct count
async function getDistinctCount(table: string, column: string): Promise<number> {
  const query = `SELECT COUNT(DISTINCT \`${column}\`) as count FROM \`${table}\``;
  const result = await executeQuery<Array<{ count: number }>>(query);
  return result[0]?.count || 0;
} 