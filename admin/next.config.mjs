import withPWAInit from 'next-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withPWA = withPWAInit({
  dest: 'public',
  disable: false, // Enable PWA even in development for testing push notifications
  register: true,
  skipWaiting: true,
  customWorkerDir: 'worker',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: __dirname,
  experimental: {
    serverActions: {
      allowedOrigins: [
        'secure-cafes-idishere.mazirapp.kz', 
        'secure-cafes-idishere.mazirapp.kz.', 
        'mazirapp.kz',
        'mazirapp.kz.'
      ]
    }
  },
  // This silences the "Turbopack with Webpack config" error in Next.js 15/16
  turbopack: {},
  output: 'standalone',
}

const finalConfig = withPWA(nextConfig);

// Double ensure turbopack is disabled if configured via plugin
if (finalConfig) {
  finalConfig.turbopack = {};
}

export default finalConfig;
