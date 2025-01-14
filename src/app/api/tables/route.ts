// src/app/api/tables/route.ts
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use simple SHOW TABLES query for reliability
    const results = await executeQuery<Array<{ [key: string]: string }>>(
      'SHOW TABLES'
    );
    
    if (!Array.isArray(results)) {
      throw new Error('Invalid response format from database');
    }

    // Extract table names from the first column of each row
    const tables = results
      .map(row => Object.values(row)[0])
      .filter(Boolean)
      .sort();
    
    console.log('Found tables:', tables);
    
    return NextResponse.json({ 
      tables,
      count: tables.length
    });
  } catch (error) {
    console.error('Failed to fetch tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}