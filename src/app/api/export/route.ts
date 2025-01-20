// src/app/api/export/route.ts
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import { Parser } from 'json2csv';

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

      // First, get column types from information schema
    const typeQuery = `
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = ? AND COLUMN_NAME IN (${columns.map(() => '?').join(',')})
    `;
    const columnTypes = await executeQuery<Array<{COLUMN_NAME: string; DATA_TYPE: string}>>(
      typeQuery, 
      [table, ...columns]
    );

    // Build the query with appropriate CAST for numeric columns
    const columnList = columns.map(col => {
      const colType = columnTypes.find(t => t.COLUMN_NAME === col)?.DATA_TYPE.toLowerCase();
      // Cast numeric types to CHAR to prevent scientific notation
      if (colType && ['bigint', 'int', 'decimal', 'numeric'].includes(colType)) {
        return `CAST(\`${col}\` AS CHAR) AS \`${col}\``;
      }
      return `\`${col}\``;
    }).join(',');

    const query = `SELECT ${columnList} FROM \`${table}\``;
    
    const data = await executeQuery<Record<string, any>[]>(query);

    if (!Array.isArray(data)) {
      throw new Error('Invalid data format received from database');
    }

    // Direct conversion to CSV without formatting
    const parser = new Parser({
      fields: columns,
      quote: '"',
      escapedQuote: '""',
      header: true,
      eol: '\n'
    });
    const csv = parser.parse(data);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${table}_seed.csv"`,
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