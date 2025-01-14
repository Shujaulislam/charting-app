// src/app/api/export/route.ts
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import { Parser } from 'json2csv';

// Helper function to format data based on type
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  // Handle different data types
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'number') {
    // Handle phone numbers and other numeric values
    if (value.toString().length >= 10) {
      return value.toString(); // Prevent scientific notation for large numbers
    }
    return value.toString();
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
  
  return String(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const columns = searchParams.get('columns')?.split(',');

  if (!table || !columns) {
    return NextResponse.json(
      { error: 'Table and columns are required' },
      { status: 400 }
    );
  }

  try {
    // Basic input validation
    if (!/^[a-zA-Z0-9_]+$/.test(table) || !columns.every(col => /^[a-zA-Z0-9_]+$/.test(col))) {
      return NextResponse.json(
        { error: 'Invalid table or column name format' },
        { status: 400 }
      );
    }

    // Build the query safely using backticks for identifiers
    const columnList = columns.map(col => `\`${col}\``).join(',');
    const query = `SELECT ${columnList} FROM \`${table}\``;
    
    const data = await executeQuery<Record<string, any>[]>(query);

    if (!Array.isArray(data)) {
      throw new Error('Invalid data format received from database');
    }

    // Format the data before CSV conversion
    const formattedData = data.map(row => {
      const formattedRow: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        formattedRow[key] = formatValue(value);
      }
      return formattedRow;
    });

    const parser = new Parser({
      fields: columns,
      quote: '"',
      escapedQuote: '""',
      excelStrings: true
    });
    const csv = parser.parse(formattedData);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${table}_export.csv"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}