// src/app/api/tables/route.ts
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tables = await executeQuery<{ Tables_in_database: string }[]>(
      'SHOW TABLES'
    );
    
    return NextResponse.json({
      tables: tables.map(t => t.Tables_in_database)
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}