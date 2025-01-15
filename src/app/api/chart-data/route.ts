import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

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
      // For pie charts, we want aggregated data
      return `
        SELECT 
          \`${xAxis}\` as label,
          COUNT(*) as value
        FROM \`${table}\`
        GROUP BY \`${xAxis}\`
        ORDER BY value DESC
      `;

    case 'histogram':
      // For histograms, we just need the raw values
      // Plotly will handle the binning
      return `
        SELECT \`${yAxis}\` as value
        FROM \`${table}\`
        WHERE \`${yAxis}\` IS NOT NULL
      `;

    case 'line':
      // For line charts, ensure proper date formatting if x is a date
      return `
        SELECT 
          \`${xAxis}\` as x,
          COUNT(*) as y
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
    const yAxis = searchParams.get('yAxis') || '';
    const chartType = searchParams.get('chartType') || 'bar';

    // Validate parameters
    const validationError = validateParams(table, xAxis, yAxis);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Build and execute query
    const query = buildChartQuery(table, xAxis, yAxis, chartType);
    const data = await executeQuery(query);

    // Format the response based on chart type
    const formattedData = Array.isArray(data) 
      ? data.map(row => {
          // Handle null values and format data
          const formatted: Record<string, any> = {};
          Object.entries(row).forEach(([key, value]) => {
            formatted[key] = value === null ? 'N/A' : value;
          });
          return formatted;
        })
      : [];

    // Return the formatted data
    return NextResponse.json({
      data: formattedData,
      chartType,
      xAxis,
      yAxis
    });

  } catch (error) {
    console.error('Chart data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
} 