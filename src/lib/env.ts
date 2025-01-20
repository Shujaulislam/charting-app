/**
 * Environment Variables Module
 * Provides type-safe access to environment variables
 * Validates required variables at runtime
 */

const env = {
  DB_HOST: process.env.MYSQL_HOST!,
  DB_USER: process.env.MYSQL_USER!,
  DB_PASSWORD: process.env.MYSQL_PASSWORD!,
  DB_NAME: process.env.MYSQL_DATABASE!
} as const;

// Validate that all required environment variables are present
Object.entries(env).forEach(([key, value]) => {
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
});

export { env };