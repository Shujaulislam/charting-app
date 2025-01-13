// src/lib/db.ts
import mysql from 'mysql2/promise';

export async function createConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error('Failed to connect to database');
  }
}

// Utility function for safe query execution
export async function executeQuery<T>(
  query: string,
  params?: any[]
): Promise<T> {
  const connection = await createConnection();
  try {
    const [results] = await connection.execute(query, params);
    return results as T;
  } finally {
    await connection.end();
  }
}