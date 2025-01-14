// src/app/api/columns/route.ts
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

interface ColumnInfo {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: string | null;
  Extra: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');

    if (!table) {
      return NextResponse.json(
        { error: 'Table name is required' },
        { status: 400 }
      );
    }

    // Basic input validation
    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      return NextResponse.json(
        { error: 'Invalid table name format' },
        { status: 400 }
      );
    }

    // Get column information
    const results = await executeQuery<ColumnInfo[]>(
      `SHOW COLUMNS FROM \`${table}\``
    );
    
    if (!Array.isArray(results)) {
      throw new Error('Invalid response format from database');
    }
    
    // Extract column names and types
    const columns = results.map(col => col.Field);
    
    console.log('Found columns for table', table, ':', columns);
    
    return NextResponse.json({ 
      columns,
      count: columns.length
    });
  } catch (error) {
    console.error('Failed to fetch columns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch columns' },
      { status: 500 }
    );
  }
}