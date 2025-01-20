import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * General Utility Functions Module
 * Contains reusable helper functions used throughout the application
 */

/**
 * Formats a value for display based on its type
 * Handles special cases like dates, numbers, and null values
 * 
 * @param {any} value - The value to format
 * @returns {string} - The formatted value as a string
 */
export function formatValue(value: any): string {
  if (value === null || value === undefined) return '-';
  
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  
  if (typeof value === 'number') {
    // Handle phone numbers (10+ digits) to prevent scientific notation
    if (value.toString().length >= 10) {
      return value.toString();
    }
    return value.toLocaleString();
  }
  
  return String(value);
}

/**
 * Validates if a string is a valid SQL identifier
 * Prevents SQL injection by checking for unsafe characters
 * 
 * @param {string} str - The string to validate
 * @returns {boolean} - True if the string is a valid SQL identifier
 */
export function isValidSqlIdentifier(str: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(str);
}

/**
 * Generates a unique cache key for database queries
 * Used to cache query results based on parameters
 * 
 * @param {string} query - The SQL query
 * @param {any[]} params - Query parameters
 * @returns {string} - A unique cache key
 */
export function generateCacheKey(query: string, params: any[] = []): string {
  return `${query}-${JSON.stringify(params)}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
