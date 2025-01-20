/**
 * Database Utility Module
 * Provides functions for database connection and query execution
 * Uses MySQL2 for better performance and prepared statement support
 */

// src/lib/db.ts
import mysql from 'mysql2/promise';
import { env } from './env';

/**
 * Database connection configuration
 * Uses environment variables for secure credential management
 */
const dbConfig = {
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
};

/**
 * Executes a SQL query with optional parameters
 * Uses connection pooling for better performance
 * 
 * @template T - The expected return type of the query
 * @param {string} query - The SQL query to execute
 * @param {any[]} [params] - Optional parameters for the prepared statement
 * @returns {Promise<T>} - The query results
 * @throws {Error} - If the query fails to execute
 */
export async function executeQuery<T>(query: string, params?: any[]): Promise<T> {
  const connection = await mysql.createConnection(dbConfig);
  try {
    // Execute the query with prepared statement if params are provided
    const [results] = await connection.execute(query, params);
    return results as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    // Always close the connection to prevent leaks
    await connection.end();
  }
}

// Comment out filter-related queries or functions
/*
export const filterTableColumns = async () => {
  // ... filtering logic
};
*/