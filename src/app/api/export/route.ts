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

    // Build the query with raw data selection
    const columnList = columns.map(col => `\`${col}\``).join(',');
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