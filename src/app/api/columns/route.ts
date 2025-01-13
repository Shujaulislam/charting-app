// src/app/api/columns/route.ts
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');

  if (!table) {
    return NextResponse.json(
      { error: 'Table name is required' },
      { status: 400 }
    );
  }

  try {
    const columns = await executeQuery<any[]>(
      'SHOW COLUMNS FROM ??',
      [table]
    );
    
    return NextResponse.json({ columns });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch columns' },
      { status: 500 }
    );
  }
}