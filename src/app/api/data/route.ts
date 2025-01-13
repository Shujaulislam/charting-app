// src/app/api/data/route.ts
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const columns = searchParams.get('columns')?.split(',');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const sortBy = searchParams.get('sortBy');
  const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc';

  if (!table || !columns) {
    return NextResponse.json(
      { error: 'Table and columns are required' },
      { status: 400 }
    );
  }

  try {
    // Get total count for pagination
    const [countResult] = await executeQuery<[{ total: number }]>(
      'SELECT COUNT(*) as total FROM ??',
      [table]
    );

    // Build the query with pagination and sorting
    let query = `SELECT ${columns.map(() => '??').join(', ')} FROM ??`;
    const params = [...columns, table];

    if (sortBy) {
      query += ' ORDER BY ?? ' + sortOrder;
      params.push(sortBy);
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(limit.toString(), ((page - 1) * limit).toString());

    const data = await executeQuery(query, params);

    return NextResponse.json({
      data,
      pagination: {
        total: countResult.total,
        page,
        limit,
        totalPages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
