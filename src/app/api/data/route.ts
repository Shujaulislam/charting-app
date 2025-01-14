// src/app/api/data/route.ts
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

function formatValue(value: any): any {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'number') {
    // Handle phone numbers and other numeric values
    if (value.toString().length >= 10) {
      return value.toString(); // Prevent scientific notation
    }
    return value;
  }
  if (Buffer.isBuffer(value)) {
    return value.toString('utf8');
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  
  return value;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const columns = searchParams.get('columns')?.split(',');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    if (!table || !columns?.length) {
      return NextResponse.json(
        { error: 'Table and columns are required' },
        { status: 400 }
      );
    }

    // Basic input validation
    if (!/^[a-zA-Z0-9_]+$/.test(table) || !columns.every(col => /^[a-zA-Z0-9_]+$/.test(col))) {
      return NextResponse.json(
        { error: 'Invalid table or column name format' },
        { status: 400 }
      );
    }

    // Collect filters from query params
    const filters: { column: string; value: string }[] = [];
    let index = 0;
    while (true) {
      const column = searchParams.get(`filter_column_${index}`);
      const value = searchParams.get(`filter_value_${index}`);
      if (!column || !value) break;
      
      // Validate filter column names
      if (!columns.includes(column) || !/^[a-zA-Z0-9_]+$/.test(column)) {
        return NextResponse.json(
          { error: 'Invalid filter column name' },
          { status: 400 }
        );
      }
      
      filters.push({ column, value });
      index++;
    }

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build the queries safely using backticks for identifiers
    const columnList = columns.map(col => `\`${col}\``).join(',');
    
    // Build WHERE clause for filters
    const whereClause = filters.length > 0
      ? 'WHERE ' + filters.map((f, i) => `\`${f.column}\` = ?`).join(' AND ')
      : '';
    
    const filterValues = filters.map(f => f.value);

    // Count total rows with filters
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM \`${table}\`
      ${whereClause}
    `;
    
    // Get paginated data with filters
    const dataQuery = `
      SELECT ${columnList}
      FROM \`${table}\`
      ${whereClause}
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;
    
    // Execute both queries with filter values
    const [countResult, rows] = await Promise.all([
      executeQuery(countQuery, filterValues),
      executeQuery(dataQuery, filterValues)
    ]);
    
    const total = (countResult as any[])[0].total;
    
    // Format the data
    const formattedRows = Array.isArray(rows) ? rows.map(row => {
      const formattedRow: Record<string, any> = {};
      for (const [key, value] of Object.entries(row)) {
        formattedRow[key] = formatValue(value);
      }
      return formattedRow;
    }) : [];
    
    return NextResponse.json({
      rows: formattedRows,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('Database error when fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
