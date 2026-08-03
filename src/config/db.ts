import { Pool, neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { env } from './env';

// Configure Neon to use WebSockets in Node.js environment
neonConfig.webSocketConstructor = ws;

// Serverless Pool instance for transactional / pooled queries
let pool: Pool | null = null;

export const getDbPool = (): Pool => {
  if (!pool) {
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Please configure it in your .env file.');
    }
    pool = new Pool({ connectionString: env.DATABASE_URL });
  }
  return pool;
};

// Tagged template SQL client for quick serverless queries
export const sql = env.DATABASE_URL ? neon(env.DATABASE_URL) : null;

// Database connectivity check helper
export const checkDbConnection = async (): Promise<boolean> => {
  if (!env.DATABASE_URL || env.DATABASE_URL.includes('your_password')) {
    console.warn('⚠️  Neon DATABASE_URL is not configured with valid credentials yet.');
    return false;
  }
  try {
    const client = getDbPool();
    const result = await client.query('SELECT 1 as connected');
    return result.rows?.[0]?.connected === 1;
  } catch (error) {
    console.error('❌ Failed to connect to Neon Database:', error instanceof Error ? error.message : error);
    return false;
  }
};
