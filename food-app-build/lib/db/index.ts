import 'server-only';
import { Pool } from 'pg';

if (!process.env.POSTGRES_URL) {
  console.error('❌ CRITICAL: POSTGRES_URL is not defined in environment variables');
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false
  }
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
