import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

type DistinctValueResult = {
  value: string | number | null;
  count: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const column = searchParams.get('column');

    console.log('Distinct values request:', { table, column });

    if (!table || !column) {
      console.error('Missing required parameters');
      return NextResponse.json(
        { error: 'Table and column are required' },
        { status: 400 }
      );
    }

    // Basic input validation
    if (!/^[a-zA-Z0-9_]+$/.test(table) || !/^[a-zA-Z0-9_]+$/.test(column)) {
      console.error('Invalid table or column format:', { table, column });
      return NextResponse.json(
        { error: 'Invalid table or column name format' },
        { status: 400 }
      );
    }

    // First, get total count and distinct count to determine if it's an ID-like column
    const countQuery = `
      SELECT 
        COUNT(*) as total_count,
        COUNT(DISTINCT \`${column}\`) as distinct_count
      FROM \`${table}\`
    `;
    console.log('Executing count query:', countQuery);
    const countResult = await executeQuery(countQuery);
    console.log('Count result:', countResult);
    
    if (!Array.isArray(countResult) || countResult.length === 0) {
      console.error('Invalid count result format:', countResult);
      throw new Error('Invalid count result format');
    }

    const { total_count, distinct_count } = countResult[0] as { total_count: number; distinct_count: number };
    console.log('Counts:', { total_count, distinct_count });

    // If more than 95% of values are unique, consider it an ID column
    const uniquenessRatio = distinct_count / total_count;
    console.log('Uniqueness ratio:', uniquenessRatio);
    
    if (uniquenessRatio > 0.95) {
      console.log('Column identified as ID-like column');
      return NextResponse.json({
        isIdColumn: true,
        uniquenessRatio: uniquenessRatio,
        message: 'Column contains mostly unique values'
      });
    }

    // Get distinct values with their counts, ordered by frequency
    const distinctQuery = `
      SELECT 
        \`${column}\` as value,
        COUNT(*) as count
      FROM \`${table}\`
      WHERE \`${column}\` IS NOT NULL
      GROUP BY \`${column}\`
      ORDER BY count DESC, value ASC
      LIMIT 1000
    `;
    console.log('Executing distinct values query:', distinctQuery);
    
    const distinctValues = await executeQuery(distinctQuery) as DistinctValueResult[];
    
    if (!Array.isArray(distinctValues)) {
      console.error('Invalid distinct values result format:', distinctValues);
      throw new Error('Invalid distinct values result format');
    }
    
    console.log(`Found ${distinctValues.length} distinct values`);
    
    return NextResponse.json({
      isIdColumn: false,
      values: distinctValues,
      total: distinct_count
    });
  } catch (error) {
    console.error('Database error in distinct-values:', error);
    return NextResponse.json(
      { error: 'Failed to fetch distinct values' },
      { status: 500 }
    );
  }
} 