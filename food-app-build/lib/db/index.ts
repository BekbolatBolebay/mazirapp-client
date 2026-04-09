import 'server-only';
import { Pool } from 'pg';

if (!process.env.POSTGRES_URL) {
  console.error('❌ CRITICAL: POSTGRES_URL is not defined in environment variables');
} else {
  try {
    const url = new URL(process.env.POSTGRES_URL);
    console.log(`📡 Connecting to DB: ${url.hostname}:${url.port} (User: ${url.username})`);
  } catch (e) {
    console.log('📡 Connecting to DB: [URL format error]');
  }
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
