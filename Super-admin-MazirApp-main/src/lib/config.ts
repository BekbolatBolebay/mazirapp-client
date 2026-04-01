/**
 * Application Configuration
 * Centralized environment variable management
 * 
 * Frontend variables (VITE_*) are safely exported here.
 * Backend variables should be handled on the server side only.
 */

/**
 * API Configuration
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Supabase Configuration
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Gemini API Configuration
 */
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

/**
 * Application Configuration
 */
export const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Cafe SaaS Admin';

/**
 * Validation: Ensure critical variables are set
 */
export function validateConfig(): string[] {
  const errors: string[] = [];

  if (!SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is not configured');
  }
  if (!SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is not configured');
  }
  if (!GEMINI_API_KEY && APP_ENV !== 'development') {
    errors.push('VITE_GEMINI_API_KEY is not configured for production');
  }

  return errors;
}

/**
 * Log configuration status (development only)
 */
if (APP_ENV === 'development') {
  const errors = validateConfig();
  if (errors.length > 0) {
    console.warn('⚠️ Configuration warnings:', errors);
  }
  console.log('🔧 App Configuration:', {
    API_URL,
    APP_ENV,
    APP_NAME,
    hasSupabase: !!SUPABASE_URL,
    hasGemini: !!GEMINI_API_KEY,
  });
}

export default {
  API_URL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  GEMINI_API_KEY,
  APP_ENV,
  APP_NAME,
};
