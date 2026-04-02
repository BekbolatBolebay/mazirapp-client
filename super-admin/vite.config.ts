import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  // Load environment variables with VITE_ prefix (exposed to client)
  const env = loadEnv(mode, '.', 'VITE_');
  
  return {
    plugins: [react(), tailwindcss()],
    // Environment variables are automatically exposed via import.meta.env
    // No need to manually define them - Vite handles VITE_ prefixed vars
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
