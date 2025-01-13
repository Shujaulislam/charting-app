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
    const data = await executeQuery(
      `SELECT ${columns.map(() => '??').join(', ')} FROM ??`,
      [...columns, table]
    );

    const parser = new Parser();
    const csv = parser.parse(data);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${table}.csv"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}